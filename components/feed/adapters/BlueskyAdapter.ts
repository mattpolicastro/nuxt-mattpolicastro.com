import type { FeedAdapter, FeedItem } from '../types'

// ============================================================
// Bluesky public feed adapter
// Fetches posts from the AT Protocol public AppView API.
// Docs: https://docs.bsky.app/docs/api/app-bsky-feed-get-author-feed
// ============================================================

// TODO: Replace with your actual Bluesky handle.
const BLUESKY_HANDLE = 'mattpolicastro.com'

// Number of posts to pull per build. Increase if you want a longer feed.
const FETCH_LIMIT = 30

// AT Protocol public AppView base URL (no auth required for public profiles).
const BSKY_BASE = 'https://public.api.bsky.app'

// ---- Embed view interfaces ----

interface BskyEmbedRecordViewRecord {
  $type: 'app.bsky.embed.record#viewRecord'
  uri: string
  author: { handle: string; displayName?: string }
  value?: { text?: string }
}

interface BskyEmbedRecordView {
  $type: 'app.bsky.embed.record#view'
  record: BskyEmbedRecordViewRecord | { $type: string }
}

interface BskyImageView {
  thumb: string
  fullsize: string
  alt: string
}

interface BskyImagesEmbedView {
  $type: 'app.bsky.embed.images#view'
  images: BskyImageView[]
}

interface BskyVideoEmbedView {
  $type: 'app.bsky.embed.video#view'
  thumbnail?: string
  playlist: string
}

interface BskyEmbedRecordWithMediaView {
  $type: 'app.bsky.embed.recordWithMedia#view'
  record: BskyEmbedRecordView
  media: BskyImagesEmbedView | BskyVideoEmbedView | { $type: string }
}

type BskyEmbed =
  | BskyEmbedRecordView
  | BskyImagesEmbedView
  | BskyVideoEmbedView
  | BskyEmbedRecordWithMediaView
  | { $type: string }

interface BskyPost {
  uri: string
  cid: string
  author: { did: string; handle: string; displayName?: string }
  record: {
    $type: string
    text: string
    createdAt: string
    reply?: unknown
  }
  embed?: BskyEmbed
  indexedAt: string
  likeCount?: number
  replyCount?: number
  repostCount?: number
}

interface BskyFeedResponse {
  feed: Array<{ post: BskyPost; reason?: { $type: string } }>
  cursor?: string
}

// ---- Helpers ----

/** Convert a Bluesky AT URI (at://did:plc:.../...) into a bsky.app URL. */
function atUriToWebUrl(uri: string, handle: string): string {
  const rkey = uri.split('/').at(-1) ?? ''
  return `https://bsky.app/profile/${handle}/post/${rkey}`
}

/** Extract quote post metadata from the hydrated embed view, if present. */
function extractQuote(embed: BskyEmbed | undefined): FeedItem['quote'] | undefined {
  if (!embed) return undefined

  let recordView: BskyEmbedRecordView | undefined
  if (embed.$type === 'app.bsky.embed.record#view') {
    recordView = embed as BskyEmbedRecordView
  } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    recordView = (embed as BskyEmbedRecordWithMediaView).record
  }
  if (!recordView) return undefined

  const record = recordView.record
  if (record.$type !== 'app.bsky.embed.record#viewRecord') return undefined

  const viewRecord = record as BskyEmbedRecordViewRecord
  return {
    url: atUriToWebUrl(viewRecord.uri, viewRecord.author.handle),
    author: viewRecord.author.displayName
      ? `${viewRecord.author.displayName} (@${viewRecord.author.handle})`
      : `@${viewRecord.author.handle}`,
    text: viewRecord.value?.text ?? '',
  }
}

/** Extract image thumbnails from the embed, if present. */
function extractImages(embed: BskyEmbed | undefined): FeedItem['images'] | undefined {
  if (!embed) return undefined

  let imagesEmbed: BskyImagesEmbedView | undefined
  if (embed.$type === 'app.bsky.embed.images#view') {
    imagesEmbed = embed as BskyImagesEmbedView
  } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    const media = (embed as BskyEmbedRecordWithMediaView).media
    if (media.$type === 'app.bsky.embed.images#view') {
      imagesEmbed = media as BskyImagesEmbedView
    }
  }
  if (!imagesEmbed?.images.length) return undefined

  return imagesEmbed.images.map((img) => ({ url: img.thumb, alt: img.alt }))
}

/** Extract video thumbnail from the embed, if present. */
function extractVideo(embed: BskyEmbed | undefined, postUrl: string): FeedItem['video'] | undefined {
  if (!embed) return undefined

  let videoEmbed: BskyVideoEmbedView | undefined
  if (embed.$type === 'app.bsky.embed.video#view') {
    videoEmbed = embed as BskyVideoEmbedView
  } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    const media = (embed as BskyEmbedRecordWithMediaView).media
    if (media.$type === 'app.bsky.embed.video#view') {
      videoEmbed = media as BskyVideoEmbedView
    }
  }
  if (!videoEmbed) return undefined

  return {
    thumbnailUrl: videoEmbed.thumbnail,
    url: postUrl,
  }
}

// ---- Adapter ----

export class BlueskyAdapter implements FeedAdapter {
  readonly name = 'Bluesky'

  async fetch(): Promise<FeedItem[]> {
    try {
      const url = new URL(`${BSKY_BASE}/xrpc/app.bsky.feed.getAuthorFeed`)
      url.searchParams.set('actor', BLUESKY_HANDLE)
      url.searchParams.set('limit', String(FETCH_LIMIT))
      // posts_no_replies excludes reply posts at the API level; we also
      // check post.record.reply client-side as a belt-and-suspenders guard.
      url.searchParams.set('filter', 'posts_no_replies')

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.warn(`[BlueskyAdapter] HTTP ${response.status} from ${url}`)
        return []
      }

      const data = (await response.json()) as BskyFeedResponse

      return data.feed
        .filter(({ reason, post }) => !reason && !post.record.reply) // skip reposts and replies
        .map(({ post }): FeedItem => {
          const postUrl = atUriToWebUrl(post.uri, post.author.handle)
          const quote = extractQuote(post.embed)
          const images = extractImages(post.embed)
          const video = extractVideo(post.embed, postUrl)
          return {
            platform: 'bluesky',
            type: quote ? 'quote_post' : 'skeet',
            date: post.record.createdAt,
            content: post.record.text,
            url: postUrl,
            quote,
            images,
            video,
          }
        })
    } catch (err) {
      console.warn('[BlueskyAdapter] Failed to fetch feed:', err)
      return []
    }
  }
}
