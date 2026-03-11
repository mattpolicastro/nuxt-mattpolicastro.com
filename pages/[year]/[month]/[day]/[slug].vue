<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: post } = await useAsyncData(`post-${slug.value}`, () =>
  queryCollection('posts')
    .path(`/posts/${slug.value}`)
    .first()
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

useHead({
  title: `${post.value.title} — Matt Policastro`,
  meta: [
    { name: 'description', content: post.value.description ?? '' },
  ],
})
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">

        <!-- Back link -->
        <NuxtLink to="/" class="small text-muted d-inline-block mb-4">
          ← Home
        </NuxtLink>

        <!-- Post header -->
        <header class="mb-5">
          <div class="d-flex align-items-center gap-2 mb-3 flex-wrap">
            <time
              class="small text-muted"
              :datetime="post!.date"
            >
              {{ new Date(post!.date.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) }}
            </time>
            <span
              v-for="tag in post!.tags"
              :key="tag"
              class="badge bg-secondary bg-opacity-50 text-light fw-normal"
            >
              {{ tag }}
            </span>
          </div>

          <h1 class="display-5 fw-bold">{{ post!.title }}</h1>

          <p v-if="post!.description" class="lead text-secondary mt-3">
            {{ post!.description }}
          </p>
        </header>

        <!-- Post body rendered by Nuxt Content -->
        <div class="prose">
          <ContentRenderer :value="post!" />
        </div>

        <!-- Footer -->
        <hr class="my-5 border-secondary border-opacity-25" />
        <NuxtLink to="/" class="small">← Home</NuxtLink>
      </div>
    </div>
  </div>
</template>
