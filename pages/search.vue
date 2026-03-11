<script setup lang="ts">
useHead({ title: 'Search — Matt Policastro' })

const route = useRoute()
const router = useRouter()
const query = ref((route.query.q as string) ?? '')

watch(query, (val) => {
  router.replace({ query: val.trim() ? { q: val } : {} })
})

// Load all post sections (split at headings) for full-text search.
// Cached in localStorage after first load; built from the static SQL dump.
const { data: sections } = await useAsyncData('search-sections', () =>
  queryCollectionSearchSections('posts'),
)

// All post metadata — needed to reconstruct date-based URLs.
const { data: posts } = await useAsyncData('search-posts', () =>
  queryCollection('posts').all(),
)

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q || !sections.value) return []

  const matched = sections.value.filter(
    (s) =>
      s.title?.toLowerCase().includes(q) ||
      s.content?.toLowerCase().includes(q),
  )

  // One result per post — take the first matching section per path.
  const seen = new Set<string>()
  return matched
    .map((s) => ({ ...s, postPath: s.id.split('#')[0] ?? '' }))
    .filter(({ postPath }) => {
      if (seen.has(postPath)) return false
      seen.add(postPath)
      return true
    })
})

function postUrl(postPath: string): string | null {
  const slug = postPath.split('/').at(-1) ?? ''
  const post = posts.value?.find((p) => p.path.endsWith(`/${slug}`))
  if (!post) return null
  const [year = '', month = '', day = ''] = post.date.split('-')
  return `/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${slug}`
}

function postTitle(postPath: string): string {
  const slug = postPath.split('/').at(-1) ?? ''
  return posts.value?.find((p) => p.path.endsWith(`/${slug}`))?.title ?? slug
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-7">

        <h1 class="display-5 fw-bold mb-4">Search</h1>

        <div class="mb-4">
          <input
            v-model="query"
            type="search"
            class="form-control form-control-lg"
            placeholder="Search posts…"
            autofocus
          />
        </div>

        <template v-if="query.trim()">
          <template v-if="results.length">
            <div v-for="result in results" :key="result.id" class="mb-3">
              <NuxtLink
                v-if="postUrl(result.postPath)"
                :to="postUrl(result.postPath)!"
                class="text-decoration-none"
              >
                <div class="card bg-dark border-secondary">
                  <div class="card-body">
                    <h5 class="card-title mb-1">
                      {{ postTitle(result.postPath) }}
                    </h5>
                    <p v-if="result.content" class="card-text text-muted small mb-0">
                      {{ result.content.slice(0, 160) }}…
                    </p>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </template>
          <p v-else class="text-muted fst-italic">
            No results for "{{ query }}".
          </p>
        </template>

      </div>
    </div>
  </div>
</template>
