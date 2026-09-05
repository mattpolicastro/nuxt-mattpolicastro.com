<script setup lang="ts">
useHead({ title: 'About — Matt Policastro' })
</script>

<template>
  <div class="container page-wrap py-5">
    <div class="row justify-content-center">
      <div class="col-lg-7">
        <h1 class="page-heading">Trying & Learning.</h1>

        <div class="prose">
          <!-- TODO: Replace with your actual bio -->
          <p>
            Hi, I’m Matt Policastro. I've been working in digital environments for most of my professional career, running experiments and and answering questions. But I’m a tinkerer at heart. I simply enjoy building interesting things, digital and otherwise.
          </p>

          <p>
            This website is a loose archive for whatever I’ve had on my mind and want to record for posterity.
          </p>

          <!-- <h2>Work</h2> -->
          <p>
            <!-- TODO: Add employment / project history -->
          </p>

          <h2>Elsewhere</h2>
          <p>
            The best way to reach me is on
            <a href="https://bsky.app/profile/mattpolicastro.com" target="_blank" rel="noopener noreferrer">Bluesky</a>
            or via <a href="https://github.com/mattpolicastro" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>

          <h2>Colophon</h2>
          <p>
            Built with <a href="https://nuxt.com" target="_blank" rel="noopener noreferrer">Nuxt</a>,
            <a href="https://content.nuxt.com" target="_blank" rel="noopener noreferrer">Nuxt Content</a>,
            and <a href="https://bootstrap-vue-next.github.io/bootstrap-vue-next/" target="_blank" rel="noopener noreferrer">BootstrapVueNext</a>.
            Deployed to GitHub Pages.
            Posts have an <a href="/rss.xml">RSS feed</a>.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap {
  padding-top: clamp(4.5rem, 10vw, 7rem) !important;
}
</style>
