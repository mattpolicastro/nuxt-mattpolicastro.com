import type { GrowthBook } from '@growthbook/growthbook'
import type { InjectionKey } from 'vue'

export const gbKey = Symbol('gb') as InjectionKey<GrowthBook | null>

/** Returns the GrowthBook instance provided by the client plugin, or null on SSR. */
export function useGrowthBook(): GrowthBook | null {
  return inject(gbKey, null)
}
