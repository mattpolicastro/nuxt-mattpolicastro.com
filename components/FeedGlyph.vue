<script setup lang="ts">
const props = defineProps<{ type: string }>()
// Shared five-by-five marks, restored to the original blocky silhouettes.
const patterns: Record<string, string[]> = {
  skeet: ['00000', '00100', '00010', '11111', '00000'],
  quote_post: ['11011', '11011', '01001', '10010', '00000'],
  pr_merged: ['10001', '01010', '00100', '00100', '00100'],
  release: ['00100', '00100', '11111', '00100', '00100'],
  blog_post: ['11110', '10110', '11110', '00110', '00110'],
  push: ['00100', '00010', '11111', '00010', '00100'],
  issue_opened: ['00100', '00100', '00100', '00000', '00100'],
  fallback: ['11000', '11000', '00000', '00011', '00011'],
}
const cells = computed(() => (patterns[props.type] ?? patterns.fallback!)
  .join('').split('').flatMap((cell, index) => cell === '1' ? [index] : []))
</script>

<template>
  <PixelPattern class="feed-glyph" :cells="cells" :columns="5" :rows="5" />
</template>

<style scoped>
.feed-glyph {
  --pixel-unit: var(--glyph-unit, 4px);
  color: var(--palette-accent);
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
