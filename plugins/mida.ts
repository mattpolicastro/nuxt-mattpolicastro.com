// Mida.so A/B testing — equivalent of the `mida-nextjs` <MidaScript> component.
// Injected server-side so the script lands in the prerendered <head>.
export default defineNuxtPlugin(() => {
  const { midaProjectKey } = useRuntimeConfig().public
  if (!midaProjectKey) return

  const cdnUrl = 'https://cdn.mida.so'

  useHead({
    link: [{ rel: 'preconnect', href: cdnUrl }],
    script: [
      { innerHTML: 'window.isSPA = true;' },
      { src: `${cdnUrl}/js/optimize.js?key=${midaProjectKey}`, async: true },
    ],
  })
})
