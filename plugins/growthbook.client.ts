import { GrowthBook } from '@growthbook/growthbook'
import { autoAttributesPlugin, growthbookTrackingPlugin } from '@growthbook/growthbook/plugins'
import { gbKey } from '~/composables/useGrowthBook'

export default defineNuxtPlugin((nuxtApp) => {
  const { growthbookClientKey } = useRuntimeConfig().public

  const gb = new GrowthBook({
    clientKey: growthbookClientKey as string,
    enableDevMode: true,
    plugins: [
      autoAttributesPlugin(),
      growthbookTrackingPlugin(),
    ],
    trackingCallback: (experiment, result) => {
      console.log(`[GrowthBook] Experiment "${experiment.key}" viewed. Result:`, result)
      window.sa_event?.('Experiment Viewed', {
        experimentKey: experiment.key,
        variationId: result.key,
      })
    },
  })

  // Non-blocking init — the reactive instance updates components once features load.
  gb.init({ streaming: true }).catch((err: unknown) => {
    console.error('[GrowthBook] init failed:', err)
  })

  // Track a page view on every completed navigation.
  nuxtApp.hook('page:finish', () => {
    const route = useRoute()
    gb.logEvent('Page View', { path: route.path })
  })

  nuxtApp.vueApp.provide(gbKey, gb)
})
