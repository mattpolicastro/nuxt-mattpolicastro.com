<script setup lang="ts">
import type { FeedItem, FeedPlatform } from './types'
import FeedCard from './FeedCard.vue'

const props = defineProps<{
  items: FeedItem[]
  /** If set, only show items from this platform. */
  filterPlatform?: FeedPlatform
}>()

const filtered = computed(() => {
  if (!props.filterPlatform) return props.items
  return props.items.filter((i) => i.platform === props.filterPlatform)
})
</script>

<template>
  <div class="feed-list">
    <template v-if="filtered.length">
      <FeedCard
        v-for="item in filtered"
        :key="`${item.platform}-${item.date}-${item.url}`"
        :item="item"
      />
    </template>
    <div v-else class="text-muted fst-italic py-4 text-center">
      No activity yet.
    </div>
  </div>
</template>
