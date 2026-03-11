<script setup lang="ts">
/**
 * SplatBackground.vue
 *
 * Renders a Gaussian splat scene as a full-bleed background canvas using
 * Three.js and @sparkjsdev/spark. Wrapped in <ClientOnly> by the parent
 * to avoid SSR issues — this component itself may safely import Three/Spark
 * at the module level because it will never run on the server.
 *
 * Props:
 *   splatUrl  — URL of the .splat / .ksplat file to load.
 *               TODO: Replace the default with an actual hosted splat file.
 *
 * CSS fallback:
 *   If the browser lacks WebGL2 support the canvas is hidden and the
 *   `.splat-fallback` class (defined in assets/scss/main.scss) is applied
 *   to the wrapper, giving a gradient background instead.
 */

import * as THREE from 'three'
// TODO: Confirm the exact Spark export names once @sparkjsdev/spark stabilises.
// The import below matches the API as of spark ^0.6; update if needed.
import { SplatMesh } from '@sparkjsdev/spark'

const props = withDefaults(
  defineProps<{
    /**
     * URL of the Gaussian splat file (.splat or .ksplat).
     * TODO: Replace with a real hosted splat URL, e.g.:
     *   "https://cdn.example.com/scenes/living-room.ksplat"
     */
    splatUrl?: string
  }>(),
  {
    splatUrl: '/splats/placeholder.ksplat', // TODO: replace with real URL
  }
)

// ---- Reactive state ----------------------------------------
const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const hasWebGL2 = ref(true)

// ---- Three.js internals (non-reactive to avoid Vue overhead) --
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let splatMesh: InstanceType<typeof SplatMesh> | null = null
let animFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null

// ---- WebGL2 detection --------------------------------------
function checkWebGL2(): boolean {
  const canvas = document.createElement('canvas')
  return !!(canvas.getContext('webgl2'))
}

// ---- Initialise Three.js scene -----------------------------
function initScene(canvas: HTMLCanvasElement, width: number, height: number) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  // TODO: Adjust camera position to frame your specific splat scene.
  camera.position.set(0, 1, 4)
  camera.lookAt(0, 0, 0)

  // Ambient light — splat meshes are self-lit, but keep for any helper meshes.
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
}

// ---- Load splat file ---------------------------------------
async function loadSplat(url: string) {
  if (!scene) return

  // TODO: Verify SplatMesh constructor options against the installed spark version.
  // The constructor may accept { url, scene } or similar — check the spark docs/source.
  splatMesh = new SplatMesh({ url })
  scene.add(splatMesh)
}

// ---- Render loop -------------------------------------------
function startRenderLoop() {
  function loop() {
    animFrameId = requestAnimationFrame(loop)

    // TODO: Add subtle camera drift / parallax here for a living-wallpaper feel.
    // e.g. camera.position.x = Math.sin(Date.now() * 0.0002) * 0.3

    if (splatMesh && 'update' in splatMesh) {
      // Some Spark versions require a per-frame update call.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(splatMesh as any).update()
    }

    renderer?.render(scene!, camera!)
  }
  loop()
}

// ---- Responsive resize -------------------------------------
function handleResize(width: number, height: number) {
  if (!renderer || !camera) return
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

// ---- Lifecycle ---------------------------------------------
onMounted(async () => {
  if (!checkWebGL2()) {
    hasWebGL2.value = false
    return
  }

  const canvas = canvasRef.value
  const wrapper = wrapperRef.value
  if (!canvas || !wrapper) return

  const { width, height } = wrapper.getBoundingClientRect()
  initScene(canvas, width, height)

  resizeObserver = new ResizeObserver(([entry]) => {
    const { width: w, height: h } = entry.contentRect
    handleResize(w, h)
  })
  resizeObserver.observe(wrapper)

  await loadSplat(props.splatUrl)
  startRenderLoop()
})

onBeforeUnmount(() => {
  if (animFrameId !== null) cancelAnimationFrame(animFrameId)
  resizeObserver?.disconnect()

  splatMesh?.removeFromParent()
  renderer?.dispose()

  renderer = null
  scene = null
  camera = null
  splatMesh = null
})

// Reload splat when the prop changes (e.g. navigating between pages).
watch(
  () => props.splatUrl,
  async (newUrl) => {
    if (splatMesh) {
      splatMesh.removeFromParent()
      splatMesh = null
    }
    await loadSplat(newUrl)
  }
)
</script>

<template>
  <!--
    The wrapper fills its nearest positioned ancestor.
    Place this component inside a `position: relative` container,
    or use `position: fixed` for a true full-page background.
  -->
  <div
    ref="wrapperRef"
    class="splat-background"
    :class="{ 'splat-fallback': !hasWebGL2 }"
    aria-hidden="true"
  >
    <canvas
      v-if="hasWebGL2"
      ref="canvasRef"
      class="splat-canvas"
    />
  </div>
</template>

<style scoped>
.splat-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.splat-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
