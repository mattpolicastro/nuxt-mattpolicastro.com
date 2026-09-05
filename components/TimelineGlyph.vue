<script setup lang="ts">
defineProps<{ thread: string }>()
// A five-cell wheel, using the same pixel size as the other timeline marks.
const wheelCells = ['01110', '10001', '10101', '10001', '01110']
  .join('').split('').flatMap((cell, index) => cell === '1' ? [index] : [])
</script>

<template>
  <PixelPattern v-if="thread === 'bikes'" :cells="wheelCells" :columns="5" :rows="5" class="bike-glyph" />
  <NavGlyph v-else-if="thread === 'moves'" type="home" />
  <NavGlyph v-else-if="thread === 'living'" type="about" />
  <FeedGlyph v-else :type="thread === 'work' ? 'blog_post' : 'pr_merged'" class="timeline-glyph" />
</template>

<style scoped>
.timeline-glyph { color: inherit; }
.bike-glyph { --pixel-unit: var(--glyph-unit, 4px); flex-shrink: 0; color: inherit; }
</style>
