<template>
  <section class="chat-transcript" aria-label="Chat transcript">
    <ol class="chat-transcript__messages">
      <slot />
    </ol>
  </section>
</template>

<style scoped>
.chat-transcript {
  --chat-accent: var(--palette-accent, #f05d23);
  border: 1px solid color-mix(in srgb, var(--theme-ink, #18212b) 16%, transparent);
  background: color-mix(in srgb, var(--chat-accent) 5%, transparent);
  margin: 2rem 0;
  padding: clamp(1rem, 3vw, 1.5rem);
}

.chat-transcript__messages {
  display: grid;
  gap: 0.9rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
