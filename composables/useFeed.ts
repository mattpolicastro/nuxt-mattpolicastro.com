import type { FeedItem } from '~/components/feed/types'
import { BlueskyAdapter } from '~/components/feed/adapters/BlueskyAdapter'
import { GitHubAdapter } from '~/components/feed/adapters/GitHubAdapter'

// ============================================================
// useFeed — unified activity feed composable
//
// Runs all registered adapters in parallel, folds in blog posts
// from Nuxt Content, and returns a single chronologically sorted
// array of FeedItems.
//
// To add a new external platform:
//  1. Create your adapter in components/feed/adapters/
//  2. Import it here and add it to the `adapters` array.
// ============================================================

const adapters = [
  new BlueskyAdapter(),
  new GitHubAdapter(),
  // TODO: Add more adapters here as needed.
  //   e.g. new MastodonAdapter(), new SubstackAdapter()
]

async function fetchAdapterItems(): Promise<FeedItem[]> {
  const results = await Promise.allSettled(adapters.map((a) => a.fetch()))

  const items: FeedItem[] = []
  for (const [i, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      items.push(...result.value)
    } else {
      console.warn(`[useFeed] Adapter "${adapters[i]!.name}" failed:`, result.reason)
    }
  }
  return items
}

/**
 * Vue composable — fetches all external adapter items and blog posts,
 * merges them into a single chronological stream, and bakes the result
 * into the static payload via useAsyncData.
 *
 * Usage:
 *   const { data: feedItems } = await useFeed()
 */
export function useFeed() {
  return useAsyncData<FeedItem[]>('unified-feed', async () => {
    const [adapterItems, posts] = await Promise.all([
      fetchAdapterItems(),
      queryCollection('posts').where('date', '<=', new Date().toISOString()).order('date', 'DESC').all(),
    ])

    // Cap Bluesky to the 30 most recent for the homepage feed
    const recentBsky = adapterItems
      .filter(i => i.platform === 'bluesky')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)
    const nonBsky = adapterItems.filter(i => i.platform !== 'bluesky')

    const blogItems: FeedItem[] = posts.map((post) => ({
      platform: 'blog' as const,
      type: 'blog_post',
      // Blog post dates are date-only strings; see FeedItem.date note in types.ts
      date: post.date,
      title: post.title,
      content: post.description ?? post.title,
      // Build date-based URL: /YYYY/MM/DD/slug
      // Split on '-' rather than parsing with Date to avoid UTC midnight offset issues.
      url: (() => {
        const [year = '', month = '', day = ''] = post.date.slice(0, 10).split('-')
        const slug = post.path.split('/').at(-1) ?? ''
        return `/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${slug}`
      })(),
    }))

    return [...recentBsky, ...nonBsky, ...blogItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, {
    // Use the pre-rendered payload on the client — never re-fetch live API data
    // during hydration, which would produce a different result from the static HTML.
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })
}
