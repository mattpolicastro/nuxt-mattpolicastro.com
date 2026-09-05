<script setup lang="ts">
import timeline from '~/data/life-timeline.json'

const threads: Record<string, { label: string; connection: string }> = timeline.threads
// Keep the editable data chronological; present a newest-first copy.
const activeFilter = ref('all')
const entries = computed(() => [...timeline.entries].reverse().filter(entry =>
  activeFilter.value === 'all' || entry.thread === activeFilter.value,
))
</script>

<template>
  <section class="life-timeline" aria-labelledby="life-timeline-heading">
    <h2 id="life-timeline-heading">{{ timeline.title }}</h2>
    <div class="timeline-filters" role="group" aria-label="Filter timeline by type">
      <button type="button" class="timeline-filter" :class="{ 'is-active': activeFilter === 'all' }" :aria-pressed="activeFilter === 'all'" @click="activeFilter = 'all'">All</button>
      <button v-for="(thread, id) in threads" :key="id" type="button" class="timeline-filter"
        :class="{ 'is-active': activeFilter === id }" :style="{ borderStyle: thread.connection }"
        :aria-pressed="activeFilter === id" @click="activeFilter = String(id)">
        <TimelineGlyph :thread="String(id)" />
        {{ thread.label }}
      </button>
    </div>
    <ArchiveCluster>
        <div class="timeline-entries">
          <article
            v-for="entry in entries" :id="`life-${entry.id}`" :key="entry.id"
            class="archive-entry specimen-card timeline-entry"
            :class="{ 'timeline-entry--featured': entry.featured }"
            :data-platform="entry.thread"
          >
            <div class="timeline-date">
              <span class="timeline-type" :aria-label="threads[entry.thread]?.label"><TimelineGlyph :thread="entry.thread" /></span>
              <span v-if="entry.date">{{ entry.date }}</span>
            </div>
            <h3>{{ entry.title }}</h3>
            <p v-if="entry.body">{{ entry.body }}</p>
          </article>
        </div>
    </ArchiveCluster>
    <p v-if="!entries.length" role="status">No milestones of this type yet.</p>
  </section>
</template>

<style scoped>
.life-timeline { margin-top: clamp(3rem, 7vw, 6rem); color: var(--theme-ink); }
.life-timeline h2, .life-timeline h3 { font-family: var(--font-display); font-weight: 400; color: inherit; letter-spacing: 0; }
.life-timeline h2 { font-size: clamp(2.5rem, 5vw, 3.5rem); margin: 0 0 1.5rem; }
.timeline-filters { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 2rem; }
.timeline-filter { position: relative; background: transparent; color: var(--theme-ink); border: 1.5px solid color-mix(in srgb, var(--theme-ink) 50%, transparent); border-radius: 0; padding: .42rem .78rem; font-size: .875rem; font-weight: 650; cursor: pointer; }
.timeline-filter:hover { border-color: var(--palette-accent); }
.timeline-filter.is-active { background: var(--theme-ink); color: var(--theme-paper); border-color: var(--theme-ink); }
.timeline-filter.is-active::after { content: ''; position: absolute; top: -.15rem; right: -.15rem; width: .24rem; height: .24rem; background: var(--palette-accent); }
.timeline-filter:focus-visible { outline: 2px solid var(--palette-accent); outline-offset: 3px; }
.timeline-date { display: flex; align-items: center; gap: .6rem; }
.timeline-type { display: inline-flex; color: var(--palette-accent); }
.timeline-filter { display: inline-flex; align-items: center; gap: .5rem; }
.timeline-entries { display: flex; flex-wrap: wrap; gap: 1.75rem 7%; align-items: flex-start; }
.timeline-entry { flex: 0 0 44%; min-width: 0; scroll-margin-top: 6rem; }
.timeline-entry:nth-child(2n) { flex-basis: 49%; margin-top: 2rem; }
.timeline-entry:nth-child(4n + 3) { margin-left: 5%; flex-basis: 49%; }
.timeline-entry:nth-child(4n) { flex-basis: 39%; margin-top: 3rem; }
.timeline-entry.timeline-entry--featured { flex-basis: 100%; margin-left: 0; }
.timeline-date { font-size: .8rem; line-height: 1.4; margin-bottom: .75rem; }
.timeline-entry h3 { font-size: 1.85rem; line-height: 1.1; margin: 0; overflow-wrap: anywhere; }
.timeline-entry--featured h3 { font-size: 2.25rem; }
.timeline-entry p { font-size: 1rem; line-height: 1.6; letter-spacing: -.015em; margin: .75rem 0 0; overflow-wrap: anywhere; }
@media (max-width: 575.98px) {
  .timeline-entries .timeline-entry { flex-basis: 100%; margin: 0; }
  .timeline-entries .timeline-entry:nth-child(2n) { margin-left: 7%; flex-basis: 93%; }
}
</style>
