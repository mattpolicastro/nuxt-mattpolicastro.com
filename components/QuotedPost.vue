<script setup lang="ts">
import type { FeedItem } from './feed/types'
defineProps<{ quote: NonNullable<FeedItem['quote']> }>()
</script>

<template>
  <blockquote class="quoted-post" :cite="quote.url">
    <a :href="quote.url" target="_blank" rel="noopener noreferrer" class="quote-author">{{ quote.author }}</a>
    <p>{{ quote.text }}</p>
  </blockquote>
</template>

<style scoped>
.quoted-post {
  border-left: 2px dotted var(--palette-accent);
  background: color-mix(in srgb, var(--palette-accent) 6%, transparent);
  padding: 0.75rem;
  margin: 1rem 0;
  color: var(--theme-ink);
}
.quote-author { color: inherit; font-size: 0.75rem; font-weight: 600; overflow-wrap: anywhere; text-decoration-color: var(--palette-accent); }
.quoted-post p { margin: 0.4rem 0 0; font-size: 0.8125rem; line-height: 1.6; letter-spacing: var(--tracking-body); white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
