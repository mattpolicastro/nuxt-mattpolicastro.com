<script setup lang="ts">
const props = defineProps<{ type: 'search' | 'sun' | 'moon' | 'menu' | 'close' }>()
const patterns = {
  menu: ['11111', '00000', '11111', '00000', '11111'],
  close: ['10001', '01010', '00100', '01010', '10001'],
  search: ['11100', '10100', '11100', '00010', '00001'],
  moon: ['01100', '11000', '11000', '11101', '01110'],
  sun: ['00100', '01110', '11011', '01110', '00100'],
}
const pattern = computed(() => patterns[props.type])
const cells = computed(() => pattern.value.join('').split('').flatMap((cell, index) => cell === '1' ? [index] : []))
</script>

<template>
  <span class="control-glyph" aria-hidden="true">
    <PixelPattern :cells="cells" :columns="pattern.length" :rows="pattern.length" />
  </span>
</template>

<style scoped>
.control-glyph {
  --pixel-unit: var(--glyph-unit, 4px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--pixel-unit) * 5);
  height: calc(var(--pixel-unit) * 5);
  flex-shrink: 0;
  color: inherit;
}
</style>
