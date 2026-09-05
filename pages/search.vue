<script setup lang="ts">
useHead({ title: 'Search — Matt Policastro' })

const route = useRoute()
const router = useRouter()
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchInput = ref<HTMLInputElement | null>(null)

watch(query, (val) => {
  if (val !== (route.query.q ?? '')) router.replace({ query: val ? { q: val } : {} })
})
watch(() => route.query.q, (value) => {
  query.value = typeof value === 'string' ? value : ''
})

// Load all post sections (split at headings) for full-text search.
// Cached in localStorage after first load; built from the static SQL dump.
const { data: sections, status: sectionStatus, error: sectionError } = await useAsyncData('search-sections', () =>
  queryCollectionSearchSections('posts'),
)

// All post metadata — needed to reconstruct date-based URLs.
const now = new Date().toISOString()
const { data: posts, status: postStatus, error: postError } = await useAsyncData('search-posts', () =>
  queryCollection('posts').where('date', '<=', now).all(),
)

const loading = computed(() => sectionStatus.value === 'pending' || postStatus.value === 'pending')
const failed = computed(() => sectionError.value || postError.value)

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
      if (!postUrl(postPath)) return false
      if (seen.has(postPath)) return false
      seen.add(postPath)
      return true
    })
})

function postUrl(postPath: string): string | null {
  const slug = postPath.split('/').at(-1) ?? ''
  const post = posts.value?.find((p) => p.path.endsWith(`/${slug}`))
  if (!post) return null
  const [year = '', month = '', day = ''] = post.date.slice(0, 10).split('-')
  return `/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${slug}`
}

function postTitle(postPath: string): string {
  const slug = postPath.split('/').at(-1) ?? ''
  return posts.value?.find((p) => p.path.endsWith(`/${slug}`))?.title ?? slug
}

function excerpt(content: string): string {
  const text = content.replace(/\s+/g, ' ').trim()
  const match = text.toLowerCase().indexOf(query.value.trim().toLowerCase())
  let start = Math.max(0, match - 65)
  if (start) start = Math.max(0, text.lastIndexOf(' ', start) + 1)
  const end = Math.min(text.length, Math.max(start + 220, match + query.value.trim().length))
  return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

function postDate(path: string): string {
  const post = posts.value?.find(post => post.path === path)
  return post ? new Date(`${post.date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }) : ''
}

function clearSearch() {
  query.value = ''
  searchInput.value?.focus()
}
</script>

<template>
  <div class="container search-page py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">

        <h1 class="page-heading">Search</h1>

        <form class="search-box" role="search" @submit.prevent>
          <label for="post-search" class="visually-hidden">Search blog posts</label>
          <ControlGlyph type="search" />
          <input
            id="post-search"
            ref="searchInput"
            v-model="query"
            type="search"
            placeholder="Search blog posts…"
            @keydown.esc.prevent="clearSearch"
          />
          <button v-if="query" type="button" aria-label="Clear search" @click="clearSearch"><ControlGlyph type="close" /></button>
        </form>

        <p class="search-status" role="status" aria-live="polite" aria-atomic="true">
          <template v-if="failed">Search couldn’t load. Please refresh to try again.</template>
          <template v-else-if="loading">Loading posts…</template>
          <template v-else-if="!query.trim()">Search the titles and text of blog posts.</template>
          <template v-else>{{ results.length }} {{ results.length === 1 ? 'post' : 'posts' }} found</template>
        </p>

        <template v-if="query.trim() && !loading && !failed">
          <ul v-if="results.length" class="search-results list-unstyled">
            <li v-for="result in results" :key="result.id" class="specimen-block specimen-card search-result">
              <div class="specimen-meta search-meta"><FeedGlyph type="blog_post" /><span>{{ postDate(result.postPath) }}</span></div>
              <h2><NuxtLink :to="postUrl(result.postPath)!">{{ postTitle(result.postPath) }}</NuxtLink></h2>
              <p v-if="result.content" class="search-excerpt">{{ excerpt(result.content) }}</p>
              <NuxtLink :to="postUrl(result.postPath)!" class="result-link">Read post <span aria-hidden="true">→</span></NuxtLink>
            </li>
          </ul>
          <div v-else class="search-empty">
            <h2>No matching posts.</h2>
            <p>Try a different word or a shorter phrase.</p>
            <NuxtLink to="/archives" class="result-link">Browse the archive <span aria-hidden="true">→</span></NuxtLink>
            </div>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.search-page { padding-top: clamp(4.5rem, 10vw, 7rem) !important; color: var(--theme-ink); }
.search-box { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border: 1px solid color-mix(in srgb, var(--theme-ink) 35%, transparent); background: var(--theme-paper); }
.search-box:focus-within { border-color: var(--theme-ink); outline: 1px solid var(--theme-ink); }
.search-box input { flex: 1; min-width: 0; width: 100%; border: 0; outline: none; background: transparent; color: inherit; font: inherit; font-size: 1rem; letter-spacing: var(--tracking-body); padding: 0.5rem 0; }
.search-box input::placeholder { color: currentColor; opacity: 0.65; }
.search-box input::-webkit-search-cancel-button { -webkit-appearance: none; }
.search-box button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0; border: 0; background: transparent; color: inherit; cursor: pointer; }
.search-box button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.search-status { margin: 1rem 0 2rem; font-size: 0.875rem; letter-spacing: var(--tracking-body); }
.search-results { display: grid; gap: 1.25rem; }
.search-result { min-width: 0; }
.search-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.search-page h2 { font-family: var(--font-display); font-weight: 400; font-size: clamp(1.8rem, 3vw, 2.5rem); letter-spacing: var(--tracking-heading); line-height: 1.15; margin: 0 0 0.75rem; color: inherit; overflow-wrap: anywhere; }
.search-page a { color: inherit; text-decoration-color: var(--palette-accent); }
.search-page h2 a { text-decoration: none; }
.search-page a:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
.search-excerpt, .search-empty p { font-size: 1rem; line-height: 1.65; letter-spacing: var(--tracking-body); overflow-wrap: anywhere; }
.result-link { font-size: 0.875rem; font-weight: 600; text-underline-offset: 0.28rem; }
.result-link span { color: var(--palette-accent); }
.search-empty { padding: 1.5rem 0; border-top: 1px solid color-mix(in srgb, var(--theme-ink) 20%, transparent); }
</style>
