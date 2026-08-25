// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Opt into Nuxt 4 behaviour on the 3.x release train.
  // Remove once Nuxt 4 ships as stable and you upgrade.
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2026-01-01',

  // Full static output — no SSR runtime needed
  ssr: true,
  nitro: {
    preset: 'github-pages',
    prerender: {
      crawlLinks: true,
      routes: ['/', '/about', '/archives', '/search', '/rss.xml'],
    },
  },

  // Modules
  modules: [
    '@nuxt/content',
    '@bootstrap-vue-next/nuxt',
    '@simpleanalytics/nuxt',
    '@nuxt/fonts',
  ],

  simpleAnalytics: {
    hostname: 'mattpolicastro.com',
    collectDnt: true,
  },

  runtimeConfig: {
    public: {
      growthbookClientKey: '', // override with NUXT_PUBLIC_GROWTHBOOK_CLIENT_KEY
      midaProjectKey: '', // override with NUXT_PUBLIC_MIDA_PROJECT_KEY
    },
  },

  // Bootstrap + custom SCSS
  css: ['~/assets/scss/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Make variables available in all components without manual imports.
          // additionalData is injected before every SCSS file.
          additionalData: `@use "~/assets/scss/_variables.scss" as *;`,
          // Bootstrap 5 uses @import internally and doesn't support the Sass
          // module system yet. Silence its deprecation warnings until Bootstrap 6.
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
        },
      },
    },
  },

  // Nuxt Content v3 config
  content: {
    // Collections are defined in content.config.ts
    build: {
      markdown: {
        highlight: {
          theme: 'github-dark',
        },
      },
    },
  },

  // BootstrapVueNext — tree-shaking friendly; components auto-imported
  bootstrapVueNext: {
    composables: true,
    css: false,
  },

  // TypeScript strict mode
  typescript: {
    strict: true,
    typeCheck: false, // enable to true for stricter CI; slows dev server
  },

  // App-level head defaults
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Matt Policastro',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Personal site and blog of Matt Policastro.' },
      ],
      link: [
        // RSS autodiscovery — lets feed readers find the feed automatically.
        { rel: 'alternate', type: 'application/rss+xml', title: 'Matt Policastro', href: '/rss.xml' },
      ],
    },
  },

  devtools: { enabled: true },
})
