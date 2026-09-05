<script setup lang="ts">
import type { FeedItem } from './feed/types'
defineProps<{ items: FeedItem[] }>()
const labels: Record<string, string> = {
  push: 'Pushed', pr_merged: 'Merged PR', release: 'Released', issue_opened: 'Opened issue',
}
function date(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
</script>

<template>
  <ul class="github-activity list-unstyled mb-0">
    <li v-for="item in items" :key="item.url" class="github-event" :class="`github-event--${item.type}`">
      <div class="event-meta">
        <FeedGlyph :type="item.type" />
        <span>{{ labels[item.type] ?? 'Updated' }}</span>
        <time :datetime="item.date">{{ date(item.date) }}</time>
      </div>
      <a :href="item.url" target="_blank" rel="noopener noreferrer" class="event-title">{{ item.title || item.content }}</a>
      <p v-if="item.type === 'push'" class="push-summary">{{ item.content }}</p>
    </li>
  </ul>
</template>

<style scoped>
.github-activity { margin-top: 1rem; }
.github-event { padding: 0.8rem 0; }
.github-event + .github-event { border-top: 1px solid color-mix(in srgb, var(--archive-ink) 15%, transparent); }
.event-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--archive-ink); margin-bottom: 0.4rem; }
.event-meta time { margin-left: auto; opacity: 0.7; }
.event-title { display: block; color: var(--archive-ink); font-size: 0.9rem; line-height: 1.5; overflow-wrap: anywhere; text-decoration-color: var(--palette-accent); }
.github-event--push .event-title { font-size: 0.8125rem; text-decoration: none; }
.github-event--push .event-title:hover { text-decoration: underline; }
.github-event--pr_merged .event-title { font-weight: 600; }
.github-event--release .event-title { font-family: var(--font-display); font-size: 1.65rem; font-weight: 400; letter-spacing: var(--tracking-heading); }
.github-event--issue_opened { padding-left: 0.8rem; border-left: 2px dotted var(--palette-accent); }
.push-summary { font-size: 0.75rem; opacity: 0.7; margin: 0.35rem 0 0; letter-spacing: var(--tracking-body); overflow-wrap: anywhere; }
</style>
