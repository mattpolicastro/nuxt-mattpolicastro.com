<script setup lang="ts">
const props = defineProps<{ type: 'home' | 'about' | 'archives' }>()
// Five-cell silhouettes in the shared 20px glyph footprint.
const patterns = {
  home: ['00100', '01110', '11111', '11011', '11011'],
  about: ['01110', '01110', '00000', '11111', '11111'],
  archives: ['11111', '00000', '11011', '10001', '11111'],
}
const cells = computed(() => patterns[props.type].join('').split('').flatMap((cell, index) => cell === '1' ? [index] : []))
</script>

<template>
  <PixelPattern class="nav-glyph" :cells="cells" :columns="5" :rows="5" />
</template>

<style scoped>
.nav-glyph { --pixel-unit: var(--glyph-unit, 4px); flex-shrink: 0; color: inherit; }
</style>
