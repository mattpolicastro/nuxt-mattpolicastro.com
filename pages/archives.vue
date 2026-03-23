<script setup lang="ts">
useHead({ title: 'Archives — Matt Policastro' })

const { data: posts } = await useAsyncData('archive-posts', () =>
  queryCollection('posts').order('date', 'DESC').all(),
)

function postUrl(post: { date: string; path: string }): string {
  const [year = '', month = '', day = ''] = post.date.slice(0, 10).split('-')
  const slug = post.path.split('/').at(-1) ?? ''
  return `/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${slug}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// Group posts by year, preserving DESC order within each year.
const byYear = computed(() => {
  const map = new Map<string, typeof posts.value>()
  for (const post of posts.value ?? []) {
    const year = post.date.split('-')[0] ?? ''
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(post)
  }
  // Map keys are insertion-ordered; since posts are DESC the years are too.
  return map
})
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-7">

        <h1 class="display-5 fw-bold mb-5">Archives</h1>

        <div v-if="!posts?.length" class="text-muted fst-italic">
          No posts yet.
        </div>

        <section
          v-for="[year, yearPosts] in byYear"
          :key="year"
          class="mb-5"
        >
          <h2 class="h4 text-muted border-bottom border-secondary border-opacity-25 pb-2 mb-3">
            {{ year }}
          </h2>
          <ul class="list-unstyled mb-0">
            <li
              v-for="post in yearPosts"
              :key="post.path"
              class="py-2"
            >
              <div class="d-flex align-items-baseline gap-3">
                <span class="text-muted small text-nowrap">{{ formatDate(post.date) }}</span>
                <NuxtLink :to="postUrl(post)" class="text-decoration-none post-link">
                  {{ post.title }}
                </NuxtLink>
              </div>
              <p v-if="post.description" class="text-muted small mb-0 ms-5 ps-3">
                {{ post.description }}
              </p>
            </li>
          </ul>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
.post-link:hover {
  text-decoration: underline !important;
}
</style>
