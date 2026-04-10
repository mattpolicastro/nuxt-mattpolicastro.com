<script setup lang="ts">
import type { FeedItem, FeedPlatform } from '~/components/feed/types'

useHead({ title: 'Archives — Matt Policastro' })

// Blog posts from Nuxt Content
const now = new Date().toISOString()
const { data: posts } = await useAsyncData('archive-posts', () =>
  queryCollection('posts').where('date', '<=', now).order('date', 'DESC').all(),
)

// External feed archives
async function loadArchive(file: string): Promise<FeedItem[]> {
  if (!import.meta.server) return []
  try {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const raw = fs.readFileSync(path.resolve(`data/${file}`), 'utf-8')
    return raw.split('\n').filter(Boolean).map(line => JSON.parse(line))
  } catch { return [] }
}

const { data: allItems } = await useAsyncData('archive-feed', async () => {
  const [bsky, gh] = await Promise.all([
    loadArchive('bluesky.jsonl'),
    loadArchive('github.jsonl'),
  ])

  const blogItems: FeedItem[] = (posts.value ?? []).map((post) => {
    const [year = '', month = '', day = ''] = post.date.slice(0, 10).split('-')
    const slug = post.path.split('/').at(-1) ?? ''
    return {
      platform: 'blog' as const,
      type: 'blog_post',
      date: post.date,
      title: post.title,
      content: post.description ?? post.title,
      url: `/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${slug}`,
    }
  })

  return [...bsky, ...gh, ...blogItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

// Filter state
const activeFilter = ref<FeedPlatform | 'all'>('all')

const filters: { label: string; value: FeedPlatform | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Blog', value: 'blog' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'GitHub', value: 'github' },
]

const filtered = computed(() => {
  if (!allItems.value) return []
  if (activeFilter.value === 'all') return allItems.value
  return allItems.value.filter(i => i.platform === activeFilter.value)
})

const platformIcon: Record<string, string> = {
  bluesky: '💬',
  github: '🔀',
  blog: '📝',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr.length === 10 ? `${dateStr}T12:00:00Z` : dateStr)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function itemLabel(item: FeedItem): string {
  if (item.title) return item.title
  // Truncate Bluesky post text for the list
  return item.content.length > 80 ? item.content.slice(0, 80) + '…' : item.content
}

function isInternal(url: string): boolean {
  return url.startsWith('/')
}

/** Extract "owner/repo" from a GitHub URL. */
function repoFromUrl(url: string): string {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/)
  return match ? match[1] : ''
}

interface DisplayGroup {
  item: FeedItem
  /** Child items when adjacent GitHub items share a repo. */
  children?: FeedItem[]
}

/** Collapse adjacent GitHub items from the same repo into groups. */
function groupItems(items: FeedItem[]): DisplayGroup[] {
  const groups: DisplayGroup[] = []
  for (const item of items) {
    if (item.platform === 'github') {
      const repo = repoFromUrl(item.url)
      const prev = groups.at(-1)
      if (prev?.item.platform === 'github' && repoFromUrl(prev.item.url) === repo) {
        if (!prev.children) prev.children = []
        prev.children.push(item)
        continue
      }
    }
    groups.push({ item })
  }
  return groups
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

interface MonthGroup {
  label: string
  groups: DisplayGroup[]
}

// Group by year → month, then collapse adjacent GitHub items within each month
const byYear = computed(() => {
  const map = new Map<string, MonthGroup[]>()
  for (const item of filtered.value) {
    const year = item.date.slice(0, 4)
    const month = item.date.slice(5, 7)
    if (!map.has(year)) map.set(year, [])
    const months = map.get(year)!
    let current = months.at(-1)
    if (!current || current.label !== monthNames[parseInt(month, 10) - 1]) {
      current = { label: monthNames[parseInt(month, 10) - 1], groups: [] }
      months.push(current)
    }
    current.groups.push({ item })
  }
  // Now collapse adjacent GitHub items within each month
  for (const months of map.values()) {
    for (const month of months) {
      // Flatten back to items, regroup
      const items = month.groups.map(g => g.item)
      month.groups = groupItems(items)
    }
  }
  return map
})
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-7">

        <h1 class="display-5 fw-bold mb-4">Archives</h1>

        <!-- Platform filter -->
        <div class="d-flex gap-2 mb-4 flex-wrap">
          <button
            v-for="f in filters"
            :key="f.value"
            type="button"
            class="btn btn-sm"
            :class="activeFilter === f.value ? 'btn-light' : 'btn-outline-secondary'"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>

        <div v-if="!filtered.length" class="text-muted fst-italic">
          No activity yet.
        </div>

        <section
          v-for="[year, months] in byYear"
          :key="year"
          class="mb-5"
        >
          <h2 class="h4 text-muted border-bottom border-secondary border-opacity-25 pb-2 mb-3">
            {{ year }}
          </h2>
          <div
            v-for="month in months"
            :key="month.label"
            class="mb-4"
          >
            <h3 class="h6 text-muted mb-2">{{ month.label }}</h3>
          <ul class="list-unstyled mb-0">
            <li
              v-for="(group, i) in month.groups"
              :key="group.item.url"
              class="py-2"
            >
              <div class="d-flex align-items-baseline gap-2">
                <span
                  class="flex-shrink-0"
                  :title="group.item.platform"
                  :class="{ 'invisible': i > 0 && !group.children && !month.groups[i - 1].children && month.groups[i - 1].item.platform === group.item.platform }"
                >{{ platformIcon[group.item.platform] ?? '•' }}</span>
                <span class="text-muted small text-nowrap">{{ formatDate(group.item.date) }}</span>

                <!-- Grouped GitHub items: show repo name as header -->
                <template v-if="group.children">
                  <a
                    :href="`https://github.com/${repoFromUrl(group.item.url)}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-decoration-none archive-link text-truncate"
                  >
                    {{ repoFromUrl(group.item.url) }}
                  </a>
                </template>

                <!-- Regular item -->
                <template v-else>
                  <NuxtLink
                    v-if="isInternal(group.item.url)"
                    :to="group.item.url"
                    class="text-decoration-none archive-link text-truncate"
                  >
                    {{ itemLabel(group.item) }}
                  </NuxtLink>
                  <a
                    v-else
                    :href="group.item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-decoration-none archive-link text-truncate"
                  >
                    {{ itemLabel(group.item) }}
                  </a>
                </template>
              </div>

              <!-- Blog post description -->
              <p
                v-if="group.item.platform === 'blog' && group.item.content && group.item.content !== group.item.title"
                class="text-muted small mb-0 ms-5 ps-1"
              >
                {{ group.item.content }}
              </p>

              <!-- Grouped GitHub children: first item + children shown as sub-list -->
              <ul v-if="group.children" class="list-unstyled mb-0 ms-5 ps-1">
                <li class="py-1">
                  <a
                    :href="group.item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-decoration-none archive-link small"
                  >
                    {{ group.item.title }}
                  </a>
                </li>
                <li
                  v-for="child in group.children"
                  :key="child.url"
                  class="py-1"
                >
                  <a
                    :href="child.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-decoration-none archive-link small"
                  >
                    {{ child.title }}
                  </a>
                </li>
              </ul>
            </li>
          </ul>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-link:hover {
  text-decoration: underline !important;
}
</style>
