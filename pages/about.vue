<script setup lang="ts">
useHead({ title: 'About — Matt Policastro' })
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-7">

        <h1 class="display-5 fw-bold mb-4">About</h1>

        <div class="prose">
          <!-- TODO: Replace with your actual bio -->
          <p>
            Hi, I’m Matt Policastro. Most of my professional work is in running complex experiments and analyses in digital environments, but I’m a tinkerer at heart. I simply enjoy building interesting things, digital and otherwise.
          </p>

          <p>
            This website is mostly a journal for whatever I’ve had on my mind as of late and want to record for posterity. Posts appear in the feed on the homepage alongside my activity on Bluesky and GitHub.
          </p>

          <!-- <h2>Work</h2> -->
          <p>
            <!-- TODO: Add employment / project history -->
          </p>

          <h2>Contact</h2>
          <p>
            The best way to reach me is on
            <a href="https://bsky.app/profile/mattpolicastro.com" target="_blank" rel="noopener noreferrer">Bluesky</a>
            or via <a href="https://github.com/mattpolicastro" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>

          <h2>This site</h2>
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
