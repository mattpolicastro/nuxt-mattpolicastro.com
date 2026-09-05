<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const gridSize = 200 // The supplied 1600px images consist of 8px square cells.
const imageSource = '/images/profile-pixel-mono.png'
let pixels: Uint8ClampedArray | undefined
let observer: MutationObserver | undefined
let disposed = false
let request = 0
let base: HTMLCanvasElement | undefined
let ink = ''
let paper = ''
let driftCells: { x: number; y: number; dx: number; dy: number }[] = []
let motionPreference: MediaQueryList | undefined
let visibility: IntersectionObserver | undefined
let visible = false
let frame = 0
let started = 0
let lastGesture = 0
let lastPaint = 0

function paint(amount = 0) {
  const context = canvas.value?.getContext('2d')
  if (!context || !base) return
  context.drawImage(base, 0, 0)
  if (!amount) return
  context.fillStyle = ink
  for (const cell of driftCells) context.fillRect(cell.x, cell.y, 1, 1)
  context.fillStyle = paper
  for (const cell of driftCells) {
    context.fillRect(cell.x + Math.round(cell.dx * amount), cell.y + Math.round(cell.dy * amount), 1, 1)
  }
}

function stopMotion() {
  cancelAnimationFrame(frame)
  frame = 0
  paint()
}

function animate(now: number) {
  if (disposed || !visible || document.hidden || motionPreference?.matches) {
    stopMotion()
    return
  }
  const sinceGesture = now - lastGesture
  if (sinceGesture >= 850) {
    stopMotion()
    return
  }
  // A short rise, then a gentle return; no idle loop or random pixel flicker.
  const rise = Math.min(1, (now - started) / 140)
  const settle = 1 - Math.min(1, Math.max(0, sinceGesture - 120) / 730)
  if (now - lastPaint >= 32) {
    paint(rise * settle * settle)
    lastPaint = now
  }
  frame = requestAnimationFrame(animate)
}

function onScrollGesture() {
  if (!ready.value || !visible || document.hidden || motionPreference?.matches) return
  lastGesture = performance.now()
  if (!frame) {
    started = lastGesture
    lastPaint = 0
    frame = requestAnimationFrame(animate)
  }
}

function syncMotion() {
  if (document.hidden || motionPreference?.matches) stopMotion()
}

async function loadPixels() {
  if (pixels) return
  const image = new Image()
  image.src = imageSource
  await image.decode()
  const source = document.createElement('canvas')
  source.width = source.height = gridSize
  const context = source.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas unavailable')
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0, gridSize, gridSize)
  pixels = context.getImageData(0, 0, gridSize, gridSize).data
  driftCells = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // The inner 144×144 cells, including the face, are never altered.
      const edge = Math.min(x, y, gridSize - 1 - x, gridSize - 1 - y)
      const hash = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0
      if (edge >= 28 || hash % 9 !== 0 || pixels[(y * gridSize + x) * 4]! < 128) continue
      const distance = 1 + hash % 3
      driftCells.push({ x, y, dx: x < 28 ? -distance : x >= 172 ? distance : 0,
        dy: y < 28 ? -distance : y >= 172 ? distance : 0 })
    }
  }
}

async function draw() {
  const currentRequest = ++request
  failed.value = false
  try {
    await loadPixels()
    if (disposed || currentRequest !== request) return
    const el = canvas.value
    base ??= document.createElement('canvas')
    base.width = base.height = gridSize
    const context = base.getContext('2d')
    const shell = el?.closest('.site-page') as HTMLElement | null
    if (!el || !context || !shell) return
    const style = getComputedStyle(shell)
    const dark = shell.dataset.theme === 'dark'
    // Preserve photographic polarity in both themes: dark cells stay dark.
    ink = style.getPropertyValue(dark ? '--palette-dark-paper' : '--palette-ink').trim()
    paper = style.getPropertyValue(dark ? '--palette-dark-ink' : '--palette-paper').trim()
    const data = pixels!
    el.width = el.height = gridSize
    context.imageSmoothingEnabled = false
    for (let cell = 0; cell < gridSize * gridSize; cell++) {
      const offset = cell * 4
      context.fillStyle = data[offset]! < 128 ? ink : paper
      context.fillRect(cell % gridSize, Math.floor(cell / gridSize), 1, 1)
    }
    paint()
    ready.value = true
  } catch {
    if (!disposed && currentRequest === request) failed.value = true
  }
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', syncMotion)
  visibility = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    if (!visible) stopMotion()
  })
  if (canvas.value) visibility.observe(canvas.value.parentElement!)
  window.addEventListener('scroll', onScrollGesture, { passive: true })
  // Short About pages may not scroll; wheel/touch gestures still give feedback.
  window.addEventListener('wheel', onScrollGesture, { passive: true })
  window.addEventListener('touchmove', onScrollGesture, { passive: true })
  document.addEventListener('visibilitychange', syncMotion)
  observer = new MutationObserver(draw)
  const shell = canvas.value?.closest('.site-page')
  if (shell) observer.observe(shell, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] })
  draw()
})
onBeforeUnmount(() => {
  disposed = true
  stopMotion()
  visibility?.disconnect()
  motionPreference?.removeEventListener('change', syncMotion)
  window.removeEventListener('scroll', onScrollGesture)
  window.removeEventListener('wheel', onScrollGesture)
  window.removeEventListener('touchmove', onScrollGesture)
  document.removeEventListener('visibilitychange', syncMotion)
  observer?.disconnect()
})
</script>

<template>
  <figure class="pixel-portrait">
    <div class="portrait-frame" role="img" aria-label="Pixel portrait of Matt Policastro smiling in front of a stone wall">
      <img v-show="!ready" :src="imageSource" width="1600" height="1600" alt="" />
      <canvas v-show="ready" ref="canvas" width="200" height="200" aria-hidden="true" />
    </div>
    <figcaption v-if="failed" class="visually-hidden" role="status">Showing the original pixel image.</figcaption>
  </figure>
</template>

<style scoped>
.pixel-portrait { width: 100%; max-width: 20rem; margin: 0; }
.portrait-frame { aspect-ratio: 1; overflow: hidden; background: var(--theme-paper); }
.portrait-frame img, .portrait-frame canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
</style>
