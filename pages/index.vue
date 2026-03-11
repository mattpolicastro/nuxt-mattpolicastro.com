<script setup lang="ts">
import { useFeed } from '~/composables/useFeed'

const { data: feedItems } = await useFeed()
</script>

<template>
  <div>

    <!-- =====================================================
         Unified activity feed
    ====================================================== -->
    <section class="py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-7">
            <FeedList :items="feedItems ?? []" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-section {
  /* min-height: 75vh; */
}

.hero-splat {
  position: absolute;
  inset: 0;
}
</style>
