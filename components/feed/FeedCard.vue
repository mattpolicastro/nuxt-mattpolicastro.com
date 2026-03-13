<script setup lang="ts">
import type { FeedItem } from './types'

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

const typeIcon: Record<string, string> = {
  skeet: '💬',
  quote_post: '💬',
  pr_merged: '🔀',
  release: '🚀',
  blog_post: '📝',
}

const icon = computed(() => typeIcon[props.item.type] ?? '•')

/** True when the URL is an internal route (blog posts). */
const isInternal = computed(() => props.item.url.startsWith('/'))
</script>

<template>
  <article class="glass-card p-3 mb-3">
    <div class="d-flex align-items-start gap-3">
      <!-- Platform icon -->
      <span class="fs-5 flex-shrink-0" role="img" :aria-label="item.type">
        {{ icon }}
      </span>

      <div class="flex-grow-1 min-w-0">
        <!-- Header row: badge + timestamp -->
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span :class="badgeClass">
            {{ platformLabel[item.platform] ?? item.platform }}
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
            v-if="item.type !== 'skeet' && item.type !== 'quote_post'"
            class="text-muted small fst-italic"
          >
            {{ item.type.replace('_', ' ') }}
          </span>
        </div>

        <!-- Optional title (PRs, releases, blog posts) -->
        <p v-if="item.title" class="fw-semibold mb-1 text-dark">
          {{ item.title }}
        </p>

        <!-- Content body -->
        <p class="mb-2 small text-secondary" style="white-space: pre-wrap;">
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
              class="feed-image rounded"
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
            class="rounded"
            style="max-height: 200px; max-width: 100%;"
          />
          <span class="feed-play-badge">▶</span>
        </a>

        <!-- Quote post block -->
        <blockquote v-if="item.quote" class="feed-quote mb-2">
          <p class="small text-secondary mb-1" style="white-space: pre-wrap;">
            {{ item.quote.text }}
          </p>
          <a
            :href="item.quote.url"
            target="_blank"
            rel="noopener noreferrer"
            class="small text-muted"
          >
            — {{ item.quote.author }}
          </a>
        </blockquote>

        <!-- Link: internal routes use NuxtLink, external open in new tab -->
        <NuxtLink v-if="isInternal" :to="item.url" class="small">
          Read →
        </NuxtLink>
        <a
          v-else
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="small"
        >
          View →
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.feed-image {
  max-height: 200px;
  max-width: 100%;
  object-fit: cover;
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

.feed-quote {
  border-left: 3px solid rgba(255, 255, 255, 0.15);
  padding: 0.5rem 0.75rem;
  margin: 0;
  border-radius: 0 0.25rem 0.25rem 0;
  background: rgba(255, 255, 255, 0.04);
}
</style>
