<script setup lang="ts">
import type { FeedItem } from './types'
import { isSocialQuip } from '~/utils/socialPresentation'

const props = defineProps<{
  item: FeedItem
}>()

/** Format ISO date string to a human-readable short form. */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Relative timestamp label (e.g. "3 days ago"). */
function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

const badgeClass = computed(() => `feed-badge feed-badge--${props.item.platform}`)

const platformLabel: Record<string, string> = {
  bluesky: 'Bluesky',
  github: 'GitHub',
  blog: 'Blog',
}

/** True when the URL is an internal route (blog posts). */
const isInternal = computed(() => props.item.url.startsWith('/'))

const linkLabel = computed(() => {
  const { platform, type, url } = props.item
  if (platform === 'blog') return 'Read post'
  if (platform === 'bluesky') return 'View on Bluesky'
  if (platform === 'github') {
    const labels: Record<string, string> = {
      pr_merged: 'View pull request',
      release: 'View release',
      issue_opened: 'View issue',
    }
    if (labels[type]) return labels[type]
    if (type === 'push') {
      if (/\/compare\//.test(url)) return 'View changes'
      if (/\/commit\//.test(url)) return 'View commit'
      if (/\/commits(?:\/|$|\?)/.test(url)) return 'View commits'
      return 'View repository'
    }
    return 'View on GitHub'
  }
  return 'View post'
})
</script>

<template>
  <article class="specimen-block specimen-card feed-card mb-4">
    <div class="min-w-0">
      <!-- Source, type, and timestamp -->
      <div class="specimen-meta feed-meta d-flex align-items-center gap-2 mb-3 flex-wrap">
        <FeedGlyph :type="item.type" />
          <span :class="badgeClass">
            {{ platformLabel[item.platform] ?? item.platform }}<span v-if="item.type === 'quote_post'"> · Quote</span>
          </span>
          <ClientOnly>
            <time
              :datetime="item.date"
              class="text-muted small"
              :title="formatDate(item.date)"
            >
              {{ relativeDate(item.date) }}
            </time>
            <template #fallback>
              <time :datetime="item.date" class="text-muted small">
                {{ formatDate(item.date) }}
              </time>
            </template>
          </ClientOnly>
          <span
            v-if="item.platform !== 'blog' && item.type !== 'skeet' && item.type !== 'quote_post'"
            class="text-muted small fst-italic"
          >
            {{ item.type.replace('_', ' ') }}
          </span>
      </div>

      <!-- Optional title (PRs, releases, blog posts) -->
      <p v-if="item.title" class="feed-title mb-1 text-dark">
        {{ item.title }}
      </p>

      <!-- Content body -->
      <p
        v-if="item.type !== 'blog_post' || item.content !== item.title"
        :class="[
          'feed-copy mb-3 text-secondary',
          { 'social-copy--quip': item.type === 'skeet' && isSocialQuip(item.content) },
          item.type === 'blog_post' ? '' : 'small',
        ]"
        style="white-space: pre-wrap;"
      >
        {{ item.content }}
      </p>

      <!-- Image attachments -->
      <div v-if="item.images?.length" class="d-flex flex-wrap gap-2 mb-2">
        <a
          v-for="(img, i) in item.images"
          :key="i"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            :src="img.url"
            :alt="img.alt || ''"
            class="feed-image"
          />
        </a>
      </div>

        <!-- Video thumbnail -->
      <a
        v-else-if="item.video"
        :href="item.video.url"
        target="_blank"
        rel="noopener noreferrer"
        class="d-inline-block mb-2 position-relative"
      >
          <img
            v-if="item.video.thumbnailUrl"
            :src="item.video.thumbnailUrl"
            alt="Video thumbnail"
            style="max-height: 200px; max-width: 100%;"
          />
          <span class="feed-play-badge">▶</span>
      </a>

        <!-- Quote post block -->
      <QuotedPost v-if="item.quote" :quote="item.quote" />
      <p v-else-if="item.type === 'quote_post'" class="text-muted small">Quoted post unavailable in the archive.</p>

        <!-- Link: internal routes use NuxtLink, external open in new tab -->
      <NuxtLink v-if="isInternal" :to="item.url" class="small">
        {{ linkLabel }} <span aria-hidden="true">→</span>
      </NuxtLink>
      <a
        v-else
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="small"
      >
        {{ linkLabel }} <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
</template>

<style scoped>
.feed-image {
  max-height: 200px;
  max-width: 100%;
  object-fit: cover;
}

.feed-card {
  position: relative;
}

.feed-meta {
  min-height: 1.25rem;
}

.feed-glyph {
  color: #d85a2b;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1;
}



.feed-title {
  color: #18212b !important;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
  line-height: 1.25;
}

.feed-copy {
  letter-spacing: var(--tracking-body);
  color: rgba(27, 40, 56, 0.76) !important;
  line-height: 1.6;
}

.feed-copy.social-copy--quip {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.5vw, 1.9rem);
  font-weight: 400;
  letter-spacing: var(--tracking-heading);
  line-height: 1.25;
  text-wrap: pretty;
}

.feed-card a {
  color: #1b2838;
  font-size: 0.76rem !important;
  font-weight: 650;
  letter-spacing: 0.01em;
  text-decoration-color: #f05d23;
  text-underline-offset: 0.28rem;
}

.feed-card a span {
  color: #f05d23;
  font-size: 0.95rem;
}


.feed-play-badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

</style>
