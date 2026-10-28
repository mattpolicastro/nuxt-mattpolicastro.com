<script setup lang="ts">
import type { FeedItem } from './feed/types'
const props = defineProps<{ items: FeedItem[] }>()
const labels: Record<string, string> = {
  push: 'Pushed', pr_merged: 'Merged PR', release: 'Released', issue_opened: 'Opened issue',
}
function date(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

interface Row { item: FeedItem, commits: string[] }

function subjects(item: FeedItem): string[] {
  return [item.title ?? '', ...item.content.split('\n').slice(1).map(l => l.replace(/^• /, ''))].filter(Boolean)
}

/** Merge consecutive same-day pushes into one row with deduped commit subjects. */
const rows = computed(() => {
  const out: Row[] = []
  for (const item of props.items) {
    const prev = out.at(-1)
    if (item.type === 'push' && prev?.item.type === 'push' && prev.item.date.slice(0, 10) === item.date.slice(0, 10)) {
      prev.commits = [...new Set([...prev.commits, ...subjects(item)])]
      continue
    }
    out.push({ item, commits: item.type === 'push' ? [...new Set(subjects(item))] : [] })
  }
  return out
})
</script>

<template>
  <ul class="github-activity list-unstyled mb-0">
    <li v-for="{ item, commits } in rows" :key="item.url" class="github-event" :class="`github-event--${item.type}`">
      <div class="event-meta">
        <FeedGlyph :type="item.type" />
        <span>{{ labels[item.type] ?? 'Updated' }}</span>
        <time :datetime="item.date">{{ date(item.date) }}</time>
      </div>
      <a :href="item.url" target="_blank" rel="noopener noreferrer" class="event-title">{{ item.title || item.content }}</a>
      <details v-if="commits.length > 1" class="push-summary">
        <summary>{{ commits.length }} commits</summary>
        <ul class="list-unstyled mb-0">
          <li v-for="(subject, i) in commits" :key="i">{{ subject }}</li>
        </ul>
      </details>
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
.github-event--push .event-title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.push-summary { font-size: 0.75rem; opacity: 0.7; margin: 0.35rem 0 0; letter-spacing: var(--tracking-body); overflow-wrap: anywhere; }
.push-summary summary { cursor: pointer; width: fit-content; }
.push-summary li { padding: 0.15rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
