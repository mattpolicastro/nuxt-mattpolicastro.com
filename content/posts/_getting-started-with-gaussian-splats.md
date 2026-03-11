---
title: Getting Started with Gaussian Splats in Three.js
date: "2025-03-08"
description: A practical introduction to rendering 3D Gaussian splats in a web browser using Three.js and the Spark library.
tags:
  - three.js
  - webgl
  - 3d
  - gaussian-splats
---

3D Gaussian Splatting has been one of the more exciting developments in real-time 3D rendering over the last couple of years. The results are photorealistic, the capture pipeline is accessible, and — as of late 2024 — it works in the browser at interactive frame rates.

This post walks through the basics of getting a splat rendering in Three.js using [`@sparkjsdev/spark`](https://sparkjs.dev).

## What are Gaussian splats?

Rather than representing a scene as a triangle mesh, Gaussian splatting models a scene as a large collection of 3D Gaussian "splats" — ellipsoidal blobs, each with a position, scale, rotation, opacity, and view-dependent colour. Rendered correctly, they can reconstruct the lighting and material appearance of the original scene in striking detail.

## Prerequisites

You'll need:

```bash
npm install three @sparkjsdev/spark
```

A `.ksplat` or `.splat` file — typically captured from a real-world scene using tools like [Luma AI](https://lumalabs.ai) or [Gaussian Splatting CUDA](https://github.com/graphdeco-inria/gaussian-splatting). A `.ksplat` is a compressed format specific to some loaders; check your loader's docs.

## Basic setup

```ts
import * as THREE from 'three'
import { SplatMesh } from '@sparkjsdev/spark'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 1, 4)

// Load the splat
// TODO: replace with your actual .ksplat URL
const splat = new SplatMesh({ url: '/your-scene.ksplat' })
scene.add(splat)

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
```

## Performance notes

Gaussian splats are sorted on the GPU by depth each frame. On a modern desktop GPU this is fast, but on mobile it can stall. A few things to keep in mind:

1. **Limit splat count.** Scenes with fewer than ~500k splats run comfortably at 60fps on integrated graphics.
2. **Set `pixelRatio` conservatively.** `Math.min(window.devicePixelRatio, 2)` is usually sufficient.
3. **Use `ClientOnly`.** Never attempt to import Three.js or Spark server-side — always guard with `<ClientOnly>` in Nuxt.

## Next steps

- Add orbit controls so visitors can explore the scene
- Fade in the canvas after the splat has loaded to avoid a flash of empty space
- TODO: link to the actual `SplatBackground.vue` once it's open-sourced

---

More on this topic as I experiment further. Questions welcome on [Bluesky](https://bsky.app/profile/mattpolicastro.bsky.social).
