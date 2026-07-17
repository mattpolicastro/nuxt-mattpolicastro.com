// ============================================================
// Unified activity feed — shared types
// ============================================================

/** Supported platform identifiers. Add new entries here when adding adapters. */
export type FeedPlatform = 'bluesky' | 'github' | 'blog'

/** A single item in the unified activity feed. */
export interface FeedItem {
  /** Discriminator for rendering and badging. */
  platform: FeedPlatform

  /**
   * ISO 8601 date or datetime string.
   * Accepts both date-only ("2025-03-01") and full datetime ("2025-03-01T14:30:00Z").
   * Stored as a string so it survives JSON serialisation across the static build.
   * Note: date-only strings are parsed by Date() as midnight UTC, so relative
   * timestamps ("3 days ago") may be off by a few hours depending on timezone.
   */
  date: string

  /** Plain-text or short markdown summary suitable for feed display. */
  content: string

  /** Canonical URL for the item (post, PR, release, etc.). */
  url: string

  /**
   * Optional sub-type for richer rendering.
   * e.g. "pr_merged", "release", "skeet", "blog_post"
   */
  type: string

  /** Optional display title (used for PRs, releases, blog posts). */
  title?: string

  /** Populated when a Bluesky post is a quote post. */
  quote?: {
    url: string
    author: string
    text: string
  }

  /** Image attachments (Bluesky image embeds). */
  images?: Array<{ url: string; alt: string }>

  /** Video attachment (Bluesky video embed). Links back to the post since HLS isn't embeddable. */
  video?: {
    thumbnailUrl?: string
    url: string
  }

  /**
   * Manual curation flag for Bluesky posts (set via `npm run post -- feature <url>`).
   * When true, the post stays on the homepage feed beyond the recency window.
   * Has no effect on /archives, which always shows every item.
   */
  show?: boolean
}

// ============================================================
// Adapter interface
// ============================================================

/**
 * Every feed source must implement this interface.
 * `fetch()` is called at build time inside useAsyncData.
 *
 * To add a new platform:
 *  1. Create `components/feed/adapters/YourAdapter.ts`
 *  2. Implement `FeedAdapter`
 *  3. Register it in `composables/useFeed.ts`
 */
export interface FeedAdapter {
  /** Human-readable name for debugging / error messages. */
  readonly name: string

  /**
   * Fetch and normalise items from the external source.
   * Must return a stable, serialisable array (no class instances, no Date objects).
   * Should not throw — return [] on error and log a warning instead.
   */
  fetch(): Promise<FeedItem[]>
}
