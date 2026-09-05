<script setup lang="ts">
defineProps<{ cells: number[]; columns: number; rows: number }>()
</script>

<template>
  <svg class="pixel-pattern" :viewBox="`0 0 ${columns * 4} ${rows * 4}`"
    :style="{ width: `calc(var(--pixel-unit, 4px) * ${columns})`, height: `calc(var(--pixel-unit, 4px) * ${rows})` }"
    aria-hidden="true" focusable="false">
    <rect v-for="cell in cells" :key="cell" :x="(cell % columns) * 4" :y="Math.floor(cell / columns) * 4" width="4" height="4" />
  </svg>
</template>

<style scoped>
.pixel-pattern { display: inline-block; fill: currentColor; shape-rendering: crispEdges; }
</style>
