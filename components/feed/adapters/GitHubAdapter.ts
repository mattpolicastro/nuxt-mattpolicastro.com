import type { FeedAdapter, FeedItem } from '../types'

// ============================================================
// GitHub public events adapter
// Fetches public events for a user and filters to PRs + releases.
// Docs: https://docs.github.com/en/rest/activity/events
// ============================================================

// TODO: Replace with your actual GitHub username.
const GITHUB_USERNAME = 'mattpolicastro'

// Number of events to pull (max 100 per GitHub API).
const FETCH_LIMIT = 100

// Pages of events to fetch (each page = up to 100 events).
// Keep low to stay within unauthenticated rate limits (60 req/hour).
const MAX_PAGES = 1

// TODO: Optionally add a GITHUB_TOKEN secret to your Actions environment
// to increase rate limits from 60 to 5000 requests/hour.
// Pass it as a runtime config value if needed.
const GITHUB_API_BASE = 'https://api.github.com'

// ---- GitHub event shapes (minimal) -------------------------

type GitHubEventType =
  | 'PullRequestEvent'
  | 'ReleaseEvent'
  | 'PushEvent'
  | string

interface GitHubPullRequestPayload {
  action: string
  pull_request: {
    html_url: string
    title: string
    merged: boolean
    state: string
  }
}

interface GitHubReleasePayload {
  action: string
  release: {
    html_url: string
    tag_name: string
    name: string | null
  }
}

interface GitHubEvent {
  id: string
  type: GitHubEventType
  actor: { login: string }
  repo: { name: string; url: string }
  payload: GitHubPullRequestPayload | GitHubReleasePayload | Record<string, unknown>
  created_at: string
}

// ---- Normalisation helpers ---------------------------------

function normalisePR(event: GitHubEvent): FeedItem | null {
  const payload = event.payload as GitHubPullRequestPayload
  // Only surface merged PRs; filter out opened/closed-without-merge noise.
  if (payload.action !== 'closed' || !payload.pull_request.merged) return null

  const pr = payload.pull_request
  return {
    platform: 'github',
    type: 'pr_merged',
    date: event.created_at,
    title: pr.title,
    content: `Merged PR in ${event.repo.name}: "${pr.title}"`,
    url: pr.html_url,
  }
}

function normaliseRelease(event: GitHubEvent): FeedItem | null {
  const payload = event.payload as GitHubReleasePayload
  if (payload.action !== 'published') return null

  const release = payload.release
  const displayName = release.name || release.tag_name
  return {
    platform: 'github',
    type: 'release',
    date: event.created_at,
    title: displayName,
    content: `Released ${displayName} in ${event.repo.name}`,
    url: release.html_url,
  }
}

// ---- Adapter -----------------------------------------------

export class GitHubAdapter implements FeedAdapter {
  readonly name = 'GitHub'

  async fetch(): Promise<FeedItem[]> {
    const items: FeedItem[] = []

    try {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = new URL(
          `${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/events/public`
        )
        url.searchParams.set('per_page', String(FETCH_LIMIT))
        url.searchParams.set('page', String(page))

        const headers: HeadersInit = {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          // TODO: Uncomment and set GITHUB_TOKEN secret in Actions env for higher rate limits.
          // Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }

        const response = await fetch(url.toString(), { headers })
        if (!response.ok) {
          console.warn(`[GitHubAdapter] HTTP ${response.status} from ${url}`)
          break
        }

        const events = (await response.json()) as GitHubEvent[]
        if (events.length === 0) break

        for (const event of events) {
          let item: FeedItem | null = null

          if (event.type === 'PullRequestEvent') {
            item = normalisePR(event)
          } else if (event.type === 'ReleaseEvent') {
            item = normaliseRelease(event)
          }
          // Intentionally ignoring PushEvent and all other event types.

          if (item) items.push(item)
        }
      }
    } catch (err) {
      console.warn('[GitHubAdapter] Failed to fetch events:', err)
    }

    return items
  }
}
