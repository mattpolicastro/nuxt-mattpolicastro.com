<script setup lang="ts">
const props = withDefaults(defineProps<{
  speaker: string
  align?: 'start' | 'end'
}>(), {
  align: 'start',
})
</script>

<template>
  <li
    class="chat-message"
    :class="`chat-message--${props.align}`"
  >
    <span class="chat-message__speaker">{{ speaker }}</span>
    <div class="chat-message__body">
      <slot />
    </div>
  </li>
</template>

<style scoped>
.chat-message {
  border-left: 2px solid color-mix(in srgb, var(--theme-ink, #18212b) 22%, transparent);
  max-width: min(88%, 42rem);
  padding: 0.15rem 0 0.15rem 0.9rem;
}

.chat-message--end {
  border-left-color: transparent;
  border-right: 2px solid color-mix(in srgb, var(--theme-ink, #18212b) 22%, transparent);
  justify-self: end;
  padding: 0.15rem 0.9rem 0.15rem 0;
  text-align: right;
}

.chat-message__speaker {
  color: color-mix(in srgb, var(--theme-ink, #18212b) 66%, transparent);
  display: block;
  font-family: var(--font-family-monospace, ui-monospace, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
}

.chat-message__body :deep(p) {
  margin: 0;
}
</style>
