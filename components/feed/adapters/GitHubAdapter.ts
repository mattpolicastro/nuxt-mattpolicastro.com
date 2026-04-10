import type { FeedAdapter, FeedItem } from '../types'

// ============================================================
// GitHub feed adapter — reads from local JSONL archive
// Archive is populated by scripts/sync-feeds.js (hourly in CI)
// ============================================================

export class GitHubAdapter implements FeedAdapter {
  readonly name = 'GitHub'

  async fetch(): Promise<FeedItem[]> {
    if (!import.meta.server) return []
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const archivePath = path.resolve('data/github.jsonl')
      const raw = fs.readFileSync(archivePath, 'utf-8')
      return raw
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as FeedItem)
    } catch (err) {
      console.warn('[GitHubAdapter] Failed to read archive:', err)
      return []
    }
  }
}
