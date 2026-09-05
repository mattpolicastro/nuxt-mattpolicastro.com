<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Drafts exist only in `nuxt dev`; never expose a preview route in production.
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not found' })
}

const { data: post } = await useAsyncData(`draft-preview-${slug.value}`, () =>
  queryCollection('drafts')
    .path(`/drafts/${slug.value}`)
    .first()
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Draft not found' })
}

useHead({
  title: `${post.value.title} — Draft preview`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <div class="container post-page py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <p class="preview-notice mb-5">Local draft preview — not published</p>

        <header class="specimen-block mb-5">
          <div class="specimen-meta d-flex align-items-center gap-2 mb-3 flex-wrap">
            <FeedGlyph type="blog_post" />
            <span class="post-date">Draft</span>
            <span v-for="tag in post.tags" :key="tag" class="post-tag">{{ tag }}</span>
          </div>
          <h1 class="post-title">{{ post.title }}</h1>
          <p v-if="post.description" class="post-dek mt-4">{{ post.description }}</p>
        </header>

        <div class="prose">
          <ContentRenderer :value="post" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-page {
  padding-top: clamp(3.5rem, 8vw, 6rem) !important;
}

.preview-notice {
  border-left: 2px solid var(--palette-accent, #f05d23);
  color: rgba(27, 40, 56, 0.7);
  font-family: var(--font-family-monospace, ui-monospace, monospace);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding-left: 0.75rem;
  text-transform: uppercase;
}

.post-date {
  color: rgba(27, 40, 56, 0.65);
  font-size: 0.76rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.post-tag {
  border: 1px solid rgba(27, 40, 56, 0.15);
  color: rgba(27, 40, 56, 0.72);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.post-title {
  max-width: 15ch;
  color: #18212b;
  font-family: var(--font-display);
  font-size: clamp(3.2rem, 8vw, 6.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 0.98;
}

.post-dek {
  max-width: 42rem;
  color: rgba(27, 40, 56, 0.7);
  font-size: 1.18rem;
  line-height: 1.6;
}
</style>
