<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null)
let resize: ResizeObserver | undefined
let theme: MutationObserver | undefined
let frame = 0
let scrollTimer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined
let lastScroll = 0
let columns = 0
let rows = 0
let unit = 4
let width = 0
let height = 0
let cells = new Uint8Array(0)
let age = new Uint8Array(0)

function seedField() {
  columns = Math.ceil(width / unit)
  rows = Math.ceil(height / unit)
  cells = new Uint8Array(columns * rows)
  age = new Uint8Array(cells.length)
  let seed = 0x5eed2026
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  // Uneven colonies grow inward from the margins. The middle stays unseeded.
  const reach = Math.min(width * 0.2, 240)
  const colonies = [
    { x: -reach * 0.12, y: height * 0.18, rx: reach, ry: 170 },
    { x: reach * 0.12, y: height * 0.76, rx: reach * 0.7, ry: 130 },
    { x: width + reach * 0.1, y: height * 0.45, rx: reach, ry: 210 },
    { x: width - reach * 0.15, y: height * 0.94, rx: reach * 0.7, ry: 120 },
  ]
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      let density = 0
      for (const colony of colonies) {
        const distance = ((x * unit - colony.x) / colony.rx) ** 2
          + ((y * unit - colony.y) / colony.ry) ** 2
        density = Math.max(density, Math.max(0, 1 - distance) * 0.48)
      }
      cells[y * columns + x] = random() < density ? 1 : 0
    }
  }
  // Keep the original settled texture as the starting point.
  for (let generation = 0; generation < 9; generation++) advance()
}

function advance() {
    const next = new Uint8Array(cells.length)
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < columns - 1; x++) {
        const index = y * columns + x
        const neighbors = cells[index - columns - 1]! + cells[index - columns]!
          + cells[index - columns + 1]! + cells[index - 1]! + cells[index + 1]!
          + cells[index + columns - 1]! + cells[index + columns]! + cells[index + columns + 1]!
        next[index] = neighbors === 3 || (cells[index] && neighbors === 2) ? 1 : 0
        age[index] = next[index] ? Math.min(9, age[index]! + 1) : 0
      }
    }
    cells = next
}

function draw() {
  const el = canvas.value
  const shell = el?.parentElement
  if (!el || !shell) return
  const context = el.getContext('2d')
  if (!context) return
  const style = getComputedStyle(shell)
  const nextUnit = parseFloat(style.getPropertyValue('--pixel-unit')) || 4
  const bounds = el.getBoundingClientRect()
  if (bounds.width !== width || bounds.height !== height || nextUnit !== unit || !cells.length) {
    width = bounds.width
    height = bounds.height
    unit = nextUnit
    seedField()
  }
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  el.width = Math.round(width * ratio)
  el.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  const dark = shell.dataset.theme === 'dark'
  context.fillStyle = style.getPropertyValue(dark ? '--palette-dark-ink' : '--palette-ink').trim()
  for (let index = 0; index < cells.length; index++) {
    if (!cells[index]) continue
    context.globalAlpha = (dark ? 0.035 : 0.045) + age[index]! * 0.006
    context.fillRect((index % columns) * unit, Math.floor(index / columns) * unit, unit, unit)
  }
  context.globalAlpha = 1
}

function schedule() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(draw)
}

function stopScrolling() {
  clearTimeout(scrollTimer)
  scrollTimer = undefined
}

function scrollTick() {
  scrollTimer = undefined
  if (motionPreference?.matches || document.hidden || performance.now() - lastScroll > 180) return
  advance()
  schedule()
  scrollTimer = setTimeout(scrollTick, 140)
}

function onScroll() {
  if (motionPreference?.matches || document.hidden) return
  lastScroll = performance.now()
  // One generation per 140ms, regardless of how many scroll events fire.
  if (scrollTimer === undefined) scrollTick()
}

function syncMotion() {
  if (motionPreference?.matches || document.hidden) stopScrolling()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', syncMotion)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', syncMotion)
  resize = new ResizeObserver(schedule)
  resize.observe(canvas.value!)
  theme = new MutationObserver(schedule)
  theme.observe(canvas.value!.parentElement!, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] })
  schedule()
})
onBeforeUnmount(() => {
  stopScrolling()
  motionPreference?.removeEventListener('change', syncMotion)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('visibilitychange', syncMotion)
  cancelAnimationFrame(frame)
  resize?.disconnect()
  theme?.disconnect()
})
</script>

<template>
  <canvas ref="canvas" class="cellular-background" aria-hidden="true" />
</template>

<style scoped>
.cellular-background {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
