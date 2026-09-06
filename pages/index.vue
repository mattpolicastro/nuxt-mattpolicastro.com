<script setup lang="ts">
import { useFeed } from '~/composables/useFeed'

const { data: feedItems } = await useFeed()
</script>

<template>
  <div class="home-page">
    <section class="home-intro pt-5 pb-4 pt-md-6 pb-md-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <h1 class="page-heading">Everything's an experiment.</h1>
            <p class="page-intro mb-0">
              Notes on work, tech, and life.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="pb-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-10">
            <div class="feed-heading d-flex align-items-end justify-content-between gap-3 mb-3">
              <div>
                <h2 class="h3 mb-0">Recent updates:</h2>
              </div>
            </div>
            <FeedList :items="feedItems ?? []" />
            <NuxtLink to="/archives" class="archive-cta">Browse the archive <span aria-hidden="true">→</span></NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-intro {
  padding-top: clamp(4.5rem, 10vw, 8rem) !important;
}

.feed-heading h2 {
  color: #18212b;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
}

.archive-cta {
  color: #18212b;
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  text-decoration-color: #f05d23;
  text-underline-offset: 0.35rem;
  white-space: nowrap;
}

.archive-cta span {
  color: #f05d23;
  font-size: 1rem;
}

</style>
