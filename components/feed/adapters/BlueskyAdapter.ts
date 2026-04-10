import type { FeedAdapter, FeedItem } from '../types'

// ============================================================
// Bluesky feed adapter — reads from local JSONL archive
// Archive is populated by scripts/sync-feeds.js (hourly in CI)
// ============================================================

export class BlueskyAdapter implements FeedAdapter {
  readonly name = 'Bluesky'

  async fetch(): Promise<FeedItem[]> {
    if (!import.meta.server) return []
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const archivePath = path.resolve('data/bluesky.jsonl')
      const raw = fs.readFileSync(archivePath, 'utf-8')
      return raw
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as FeedItem)
    } catch (err) {
      console.warn('[BlueskyAdapter] Failed to read archive:', err)
      return []
    }
  }
}
