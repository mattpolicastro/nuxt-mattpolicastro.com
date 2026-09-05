<script setup lang="ts">
import { archivePostId } from '~/utils/archiveLinks'
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: post } = await useAsyncData(`post-${slug.value}`, () =>
  queryCollection('posts')
    .where('date', '<=', new Date().toISOString())
    .path(`/posts/${slug.value}`)
    .first()
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const archiveLocation = computed(() => {
  const [year, month, day] = post.value!.date.slice(0, 10).split('-')
  const postSlug = post.value!.path.split('/').at(-1) ?? ''
  const path = `/${year}/${month}/${day}/${postSlug}`
  return { path: '/archives', hash: `#${archivePostId(path)}` }
})

useHead({
  title: `${post.value.title} — Matt Policastro`,
  meta: [
    { name: 'description', content: post.value.description ?? '' },
  ],
})
</script>

<template>
  <div class="container post-page py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">

        <!-- Back link -->
        <NuxtLink :to="archiveLocation" class="back-link d-inline-block mb-5">
          <span aria-hidden="true">←</span> Back to archive
        </NuxtLink>

        <!-- Post header -->
        <header class="specimen-block mb-5">
          <div class="specimen-meta d-flex align-items-center gap-2 mb-3 flex-wrap">
            <FeedGlyph type="blog_post" />
            <time
            class="post-date"
              :datetime="post!.date"
            >
              {{ new Date(post!.date.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) }}
            </time>
            <span
              v-for="tag in post!.tags"
              :key="tag"
              class="post-tag"
            >
              {{ tag }}
            </span>
          </div>

          <h1 class="post-title">{{ post!.title }}</h1>

          <p v-if="post!.description" class="post-dek mt-4">
            {{ post!.description }}
          </p>
        </header>

        <!-- Post body rendered by Nuxt Content -->
        <div class="prose">
          <ContentRenderer :value="post!" />
        </div>

        <!-- Footer -->
        <hr class="my-5 border-secondary border-opacity-25" />
        <NuxtLink :to="archiveLocation" class="back-link"><span aria-hidden="true">←</span> Back to archive</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-page {
  padding-top: clamp(3.5rem, 8vw, 6rem) !important;
}

.back-link,
.post-date {
  color: rgba(27, 40, 56, 0.65);
  font-size: 0.76rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  text-decoration-color: #f05d23;
  text-underline-offset: 0.3rem;
}

.post-date {
  align-items: center;
  display: inline-flex;
  gap: 0.5rem;
}

.back-link span {
  color: #f05d23;
}

.post-tag {
  border: 1px solid rgba(27, 40, 56, 0.15);
  border-radius: 0;
  background: transparent;
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
