<script setup lang="ts">
const root = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const paths = ref<{ d: string; platform: string }[]>([])
const nodes = ref<{ x: number; y: number }[]>([])
let observer: ResizeObserver | undefined
let mutations: MutationObserver | undefined
let frame = 0

function measure() {
  const el = root.value
  if (!el) return
  const bounds = el.getBoundingClientRect()
  const entries = Array.from(el.querySelectorAll<HTMLElement>('.archive-entry'))
  const previous = new Map<string, DOMRect>()
  const lines: { d: string; platform: string }[] = []
  const points: { x: number; y: number }[] = []
  for (const entry of entries) {
    const platform = entry.dataset.platform ?? ''
    const b = entry.getBoundingClientRect()
    const a = previous.get(platform)
    previous.set(platform, b)
    if (!a) continue
    const ax = a.left + a.width / 2
    const ay = a.top + a.height / 2
    const bx = b.left + b.width / 2
    const by = b.top + b.height / 2
    const dx = bx - ax
    const dy = by - ay
    if (!dx && !dy) continue
    // Intersect the straight center-to-center line with each card's boundary.
    const exit = Math.min(dx ? a.width / (2 * Math.abs(dx)) : Infinity, dy ? a.height / (2 * Math.abs(dy)) : Infinity)
    const enter = Math.min(dx ? b.width / (2 * Math.abs(dx)) : Infinity, dy ? b.height / (2 * Math.abs(dy)) : Infinity)
    const p = { x: ax + dx * exit - bounds.left, y: ay + dy * exit - bounds.top }
    const q = { x: bx - dx * enter - bounds.left, y: by - dy * enter - bounds.top }
    lines.push({ d: `M ${p.x} ${p.y} L ${q.x} ${q.y}`, platform })
    points.push(p, q)
  }
  paths.value = lines
  nodes.value = points
}

function schedule() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

onMounted(() => {
  observer = new ResizeObserver(schedule)
  observer.observe(content.value!)
  mutations = new MutationObserver(schedule)
  mutations.observe(content.value!, { childList: true, subtree: true, characterData: true, attributes: true })
  window.addEventListener('resize', schedule)
  schedule()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  mutations?.disconnect()
  window.removeEventListener('resize', schedule)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div ref="root" class="archive-cluster">
    <svg class="cluster-connections" aria-hidden="true">
      <path v-for="path in paths" :key="path.platform + path.d" :d="path.d" :class="`connection--${path.platform}`" />
      <rect v-for="(node, index) in nodes" :key="index" :x="node.x - 2" :y="node.y - 2" width="4" height="4" />
    </svg>
    <div ref="content" class="cluster-content"><slot /></div>
  </div>
</template>

<style scoped>
.archive-cluster { position: relative; min-width: 0; isolation: isolate; }
.cluster-content { display: flow-root; }
.cluster-connections {
  position: absolute;
  z-index: -1;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  fill: none;
  stroke: var(--palette-accent);
  stroke-width: 1;
  opacity: 0.45;
}
.cluster-connections rect { fill: var(--palette-accent); stroke: none; }
.connection--bluesky { stroke-dasharray: 1 5; stroke-linecap: round; }
.connection--github { stroke-dasharray: 7 4; }
.connection--blog { stroke-width: 1.5; }
</style>
