<script setup lang="ts">
import type { FeedItem, FeedPlatform } from '~/components/feed/types'
import { isSocialQuip } from '~/utils/socialPresentation'
import { archivePostId } from '~/utils/archiveLinks'

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

function formatDate(dateStr: string): string {
  return new Date(dateStr.length === 10 ? `${dateStr}T12:00:00Z` : dateStr)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function itemLabel(item: FeedItem): string {
  if (item.title) return item.title
  return item.content
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
  cells?: number[]
}

function contentClusters(groups: DisplayGroup[]): DisplayGroup[][] {
  const clusters: DisplayGroup[][] = []
  for (const group of groups) {
    const previous = clusters.at(-1)
    if (group.item.platform === 'bluesky' && previous?.[0]?.item.platform === 'bluesky' && previous.length < 4) {
      previous.push(group)
    } else {
      clusters.push([group])
    }
  }
  return clusters
}

/** Repeatable initial population for each month's bounded 5 × 5 Life field. */
function activityCells(items: FeedItem[]): number[] {
  let seed = 2166136261
  for (const char of items.map(item => item.url).join('|')) {
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  }
  const cells = Array.from({ length: 25 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296 < 0.32
  })
  return cells.flatMap((alive, index) => alive ? [index] : [])
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
      month.cells = activityCells(items)
    }
  }
  return map
})
</script>

<template>
  <div class="container archive-page py-5">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <h1 class="page-heading">Everything-ish.</h1>
        <p class="page-intro mb-5">A loose chronological archive of writing, code, or anything else that felt good to note.</p>

        <!-- Platform filter -->
        <div class="d-flex gap-2 mb-4 flex-wrap">
          <button
            v-for="f in filters"
            :key="f.value"
            type="button"
            class="archive-filter"
            :class="[`archive-filter--${f.value}`, { 'is-active': activeFilter === f.value }]"
            :aria-pressed="activeFilter === f.value"
            @click="activeFilter = f.value"
          >
            <FeedGlyph v-if="f.value !== 'all'" :type="f.value === 'bluesky' ? 'skeet' : f.value === 'github' ? 'pr_merged' : 'blog_post'" />
            {{ f.label }}
          </button>
        </div>

        <div v-if="!filtered.length" class="text-muted fst-italic">
          No activity yet.
        </div>

        <ArchiveCluster>
        <section
          v-for="[year, months] in byYear"
          :key="year"
          class="archive-year mb-5"
        >
          <h2 class="archive-year-heading">
            {{ year }}
          </h2>
          <div class="archive-months">
            <div
              v-for="month in months"
              :key="month.label"
              class="archive-month"
            >
              <div class="archive-month-label">
                <h3 class="archive-month-heading">{{ month.label }}</h3>
                <LiveLifePattern class="activity-cells" :cells="month.cells ?? []" :label="`${month.label} ${year}`" />
              </div>
              <div class="archive-cluster-stack">
              <ul v-for="cluster in contentClusters(month.groups)" :key="cluster[0]!.item.url" class="archive-specimens list-unstyled mb-0">
                <li
                  v-for="group in cluster"
                  :key="group.item.url"
                  :id="group.item.platform === 'blog' ? archivePostId(group.item.url) : undefined"
                  class="specimen-block specimen-card archive-entry"
                  :data-platform="group.item.platform"
                  :class="{ 'archive-entry--social': group.item.platform === 'bluesky', 'archive-entry--quip': group.item.type === 'skeet' && isSocialQuip(group.item.content), 'archive-entry--writing': group.item.platform === 'blog', 'archive-entry--project': group.item.platform === 'github' }"
                >
              <div class="d-flex align-items-baseline gap-2">
                <FeedGlyph :type="group.item.type" />
                <span class="text-muted small text-nowrap">{{ formatDate(group.item.date) }}<span v-if="group.item.type === 'quote_post'"> · Quote</span></span>

                <!-- Grouped GitHub items: show repo name as header -->
                <template v-if="group.item.platform === 'github'">
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
              <QuotedPost v-if="group.item.quote" :quote="group.item.quote" />
              <p v-else-if="group.item.type === 'quote_post'" class="text-muted small mt-3 mb-0">Quoted post unavailable in the archive.</p>
              <p
                v-if="group.item.platform === 'blog' && group.item.content && group.item.content !== group.item.title"
                class="text-muted small mb-0 ms-5 ps-1"
              >
                {{ group.item.content }}
              </p>

              <GitHubActivity v-if="group.item.platform === 'github'" :items="[group.item, ...(group.children ?? [])]" />
                </li>
              </ul>
              </div>
            </div>
          </div>
        </section>
        </ArchiveCluster>

      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-page {
  padding-top: clamp(4.5rem, 10vw, 7rem) !important;
}

.archive-year {
  --archive-ink: var(--theme-ink);
  border-top: 1px solid color-mix(in srgb, var(--archive-ink) 30%, transparent);
  padding-top: 1.5rem;
  margin-top: 4rem;
}

.archive-year-heading {
  color: var(--archive-ink);
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
  line-height: 1;
  margin-bottom: 2.5rem;
}

.archive-month {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

.archive-month-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.archive-month-heading {
  color: var(--archive-ink);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
  margin: 0;
}

.activity-cells {
  margin-top: 0;
  color: var(--palette-accent);
  opacity: 0.65;
}

.archive-specimens {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 7%;
  align-items: flex-start;
}

.archive-cluster-stack { min-width: 0; display: grid; gap: 2.5rem; }

.archive-specimens .archive-entry--social {
  padding: 0.85rem 1rem;
}

.archive-specimens .archive-entry--project { flex-basis: 100%; }

.archive-entry {
  scroll-margin-top: 6rem;
  position: relative;
  min-width: 0;
  flex: 0 0 40%;
}

.archive-entry--social > div > .archive-link {
  letter-spacing: var(--tracking-body);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--archive-ink) !important;
}

.archive-entry--social > div > .text-muted {
  font-size: 0.75rem;
}

.archive-entry.archive-entry--social > div > .archive-link {
  white-space: pre-wrap;
}

.archive-entry.archive-entry--quip > div > .archive-link {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
  line-height: 1.2;
  text-wrap: pretty;
}

.archive-entry:nth-child(4n + 2) {
  flex-basis: 51%;
  margin-top: 1.75rem;
}

.archive-entry:nth-child(4n + 3) {
  flex-basis: 55%;
  margin-left: 5%;
}

.archive-entry:nth-child(4n) {
  flex-basis: 33%;
  margin-top: 2.5rem;
}

.archive-entry > div {
  display: grid !important;
  grid-template-columns: calc(var(--pixel-unit) * 5) minmax(0, 1fr);
  gap: 0.35rem 0.5rem !important;
}

.archive-entry > div > .archive-link {
  grid-column: 1 / -1;
  white-space: normal;
  overflow: visible;
  overflow-wrap: anywhere;
  line-height: 1.55;
  margin-top: 0.5rem;
}

.archive-specimens .archive-entry--writing {
  flex-basis: 100%;
  margin: 0.5rem 0 1.25rem;
}

.archive-entry--writing > div > .archive-link {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4.5vw, 3.3rem);
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
  line-height: 1.1;
}

.archive-entry > p,
.archive-entry > ul {
  margin-left: 0 !important;
  padding-left: 0 !important;
  margin-top: 0.75rem;
}

.archive-entry--project > div > .archive-link {
  font-weight: 600;
}

.archive-year .archive-link:hover {
  text-decoration-color: var(--palette-accent) !important;
}

@media (max-width: 767.98px) {
  .archive-month {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;
  }
  .archive-specimens {
    gap: 1.25rem;
  }
  .archive-specimens .archive-entry {
    flex-basis: 100%;
    margin: 0;
  }
}

.archive-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1.5px solid color-mix(in srgb, var(--theme-ink) 50%, transparent);
  border-radius: 0;
  color: var(--theme-ink);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  padding: 0.42rem 0.78rem;
  position: relative;
}

.archive-filter--github { border-style: dashed; }
.archive-filter--bluesky { border-style: dotted; }
.archive-filter::after {
  background: var(--palette-accent);
  content: '';
  height: 0.24rem;
  opacity: 0;
  position: absolute;
  right: -0.15rem;
  top: -0.15rem;
  width: 0.24rem;
}

.archive-filter:hover {
  border-color: var(--palette-accent);
}

.archive-filter.is-active {
  background: var(--theme-ink);
  border-color: var(--theme-ink);
  color: var(--theme-paper);
}

.archive-filter.is-active::after {
  opacity: 1;
}

.archive-filter:focus-visible {
  outline: 2px solid var(--palette-accent);
  outline-offset: 3px;
}

.archive-page :deep(.btn) {
  padding: 0.42rem 0.78rem;
}

.archive-link:hover {
  color: #f05d23 !important;
  text-decoration: underline !important;
  text-decoration-color: #f05d23 !important;
}

.archive-page :deep(li > div > span:first-child) {
  color: #d85a2b;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1;
}
</style>
