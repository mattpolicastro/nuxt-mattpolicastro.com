<script setup lang="ts">
const props = defineProps<{ cells: number[]; label: string }>()
const gridSize = 5
const root = ref<HTMLButtonElement | null>(null)
const live = ref([...props.cells])
const paused = ref(false)
const reducedMotion = ref(false)
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | undefined
let preference: MediaQueryList | undefined
let hidden = false
let seen = new Set<string>()
let restart = false

function reset() {
  live.value = [...props.cells]
  seen = new Set([live.value.join(',')])
  restart = false
}

function tick() {
  if (restart) {
    reset()
    schedule()
    return
  }
  const alive = new Set(live.value)
  const next: number[] = []
  for (let cell = 0; cell < gridSize * gridSize; cell++) {
    const x = cell % gridSize
    const y = Math.floor(cell / gridSize)
    let neighbors = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || x + dx < 0 || x + dx >= gridSize || y + dy < 0 || y + dy >= gridSize) continue
        if (alive.has((y + dy) * gridSize + x + dx)) neighbors++
      }
    }
    if (neighbors === 3 || (alive.has(cell) && neighbors === 2)) next.push(cell)
  }
  const signature = next.join(',')
  restart = !next.length || seen.has(signature) || seen.size >= 120
  seen.add(signature)
  live.value = next
  schedule(restart ? 1500 : 700)
}

function schedule(delay = 700) {
  clearTimeout(timer)
  if (visible.value && !hidden && !paused.value && !reducedMotion.value) timer = setTimeout(tick, delay)
}

function syncMotion() {
  reducedMotion.value = preference?.matches ?? false
  schedule()
}
function syncVisibility() {
  hidden = document.hidden
  schedule()
}
function toggle() {
  paused.value = !paused.value
  schedule()
}
watch(() => props.cells, () => { reset(); schedule() })

onMounted(() => {
  reset()
  preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', syncMotion)
  hidden = document.hidden
  syncMotion()
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry?.isIntersecting ?? false
    schedule()
  })
  observer.observe(root.value!)
  document.addEventListener('visibilitychange', syncVisibility)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  observer?.disconnect()
  preference?.removeEventListener('change', syncMotion)
  document.removeEventListener('visibilitychange', syncVisibility)
})
</script>

<template>
  <button ref="root" type="button" class="life-pattern" :disabled="reducedMotion"
    :aria-label="`${paused ? 'Resume' : 'Pause'} ${label} Life pattern`"
    :aria-pressed="paused" :title="reducedMotion ? 'Static pattern: reduced motion enabled' : 'Click to pause or resume Life'" @click="toggle">
    <PixelPattern :cells="live" :columns="gridSize" :rows="gridSize" />
  </button>
</template>

<style scoped>
.life-pattern { display: inline-flex; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; }
.life-pattern:disabled { cursor: default; }
.life-pattern:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
</style>
