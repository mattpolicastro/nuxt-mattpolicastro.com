import type { FeedAdapter, FeedItem } from '../types'

// ============================================================
// GitHub feed adapter — reads from local JSONL archive
// Archive is populated by scripts/sync-feeds.js (hourly in CI)
// ============================================================

/** Collapse same-repo pushes on the same UTC day into one item. */
export function collapsePushes(items: FeedItem[]): FeedItem[] {
  const groups = new Map<string, FeedItem[]>()
  const out: FeedItem[] = []
  for (const item of items) {
    if (item.type !== 'push') { out.push(item); continue }
    const repo = item.url.replace('https://github.com/', '').split('/compare/')[0]
    const key = `${repo}|${item.date.slice(0, 10)}`
    const group = groups.get(key)
    if (group) { group.push(item) } else { groups.set(key, [item]); out.push(item) }
  }
  return out.map((item) => {
    if (item.type !== 'push') return item
    const repo = item.url.replace('https://github.com/', '').split('/compare/')[0]
    const group = groups.get(`${repo}|${item.date.slice(0, 10)}`)!
    if (group.length === 1) return item
    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date))
    const subjects = sorted.flatMap(p => [
      p.title ?? '',
      ...p.content.split('\n').slice(1).map(l => l.replace(/^• /, '')),
    ]).filter(Boolean)
    const latest = sorted.at(-1)!
    return {
      ...latest,
      title: subjects.at(-1),
      content: [
        `Pushed ${subjects.length} commits to ${repo}`,
        ...subjects.slice(0, -1).reverse().map(s => `• ${s}`),
      ].join('\n'),
      url: `https://github.com/${repo}/commits/main?since=${item.date.slice(0, 10)}&until=${item.date.slice(0, 10)}`,
    }
  })
}

export class GitHubAdapter implements FeedAdapter {
  readonly name = 'GitHub'

  async fetch(): Promise<FeedItem[]> {
    if (!import.meta.server) return []
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const archivePath = path.resolve('data/github.jsonl')
      const raw = fs.readFileSync(archivePath, 'utf-8')
      const items = raw
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as FeedItem)
      return collapsePushes(items)
    } catch (err) {
      console.warn('[GitHubAdapter] Failed to read archive:', err)
      return []
    }
  }
}
