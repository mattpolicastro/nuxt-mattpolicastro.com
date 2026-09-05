<script setup lang="ts">
// Global app shell — wraps every page with the navbar and footer.
const navOpen = ref(false)
const navToggle = ref<HTMLButtonElement | null>(null)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const searchToggle = ref<HTMLButtonElement | null>(null)
const theme = ref<'light' | 'dark'>('light')
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark'
  }
})

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}

function closeNavigation() {
  if (!navOpen.value) return
  navOpen.value = false
  searchOpen.value = false
  navToggle.value?.focus()
}

function submitSearch() {
  if (searchQuery.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
    searchQuery.value = ''
    searchOpen.value = false
    navOpen.value = false
  }
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    nextTick(() => searchInput.value?.focus())
  }
}

function closeSearch() {
  searchOpen.value = false
  nextTick(() => searchToggle.value?.focus())
}

// Close the mobile nav on route change.
const route = useRoute()
watch(() => route.path, () => { navOpen.value = false; searchOpen.value = false })
</script>

<template>
  <div id="app-shell" class="site-page" :data-theme="theme" data-palette="spruce" :data-bs-theme="theme">
    <CellularBackground />
    <!-- =====================================================
         Navbar
    ====================================================== -->
    <nav class="navbar navbar-expand-lg site-navbar sticky-top" @keydown.esc="closeNavigation">
      <div class="container">
        <NuxtLink to="/" class="site-brand fw-semibold">
          Matt Policastro
        </NuxtLink>

        <button
          ref="navToggle"
          class="navbar-toggler"
          type="button"
          :aria-expanded="navOpen"
          :aria-label="navOpen ? 'Close navigation' : 'Open navigation'"
          aria-controls="site-navigation"
          @click="navOpen = !navOpen"
        >
          <ControlGlyph :type="navOpen ? 'close' : 'menu'" />
        </button>

        <div id="site-navigation" class="navbar-collapse collapse" :class="{ show: navOpen }">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li class="nav-item">
              <NuxtLink to="/about" class="nav-link menu-link" active-class="active"><span>About</span><NavGlyph class="d-lg-none" type="about" /></NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink to="/archives" class="nav-link menu-link" active-class="active"><span>Archives</span><NavGlyph class="d-lg-none" type="archives" /></NuxtLink>
            </li>
            <li class="nav-item search-toggle-item" :class="{ 'search-is-open': searchOpen }">
              <Transition name="search-trigger">
              <button
                v-if="!searchOpen"
                ref="searchToggle"
                type="button"
                class="nav-link search-toggle-btn"
                aria-label="Toggle search"
                :aria-expanded="searchOpen"
                aria-controls="nav-search-form"
                @click="toggleSearch"
              >
                <span class="mobile-control-label d-lg-none">Search</span>
                <ControlGlyph type="search" />
              </button>
              </Transition>
              <Transition name="search-field">
              <form v-if="searchOpen" id="nav-search-form" class="search-form" role="search" @submit.prevent="submitSearch" @keydown.esc.stop.prevent="closeSearch">
                <button type="submit" class="search-field-button" aria-label="Search posts"><ControlGlyph type="search" /></button>
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="search"
                  class="search-input"
                  placeholder="Search posts…"
                  aria-label="Search"
                />
                <button type="button" class="search-field-button" aria-label="Close search" @click="closeSearch"><ControlGlyph type="close" /></button>
              </form>
              </Transition>
            </li>
            <li class="nav-item">
              <a href="/rss.xml" class="nav-link menu-link" aria-label="RSS feed" title="RSS feed">
                <span class="d-lg-none">RSS feed</span><NavGlyph type="rss" />
              </a>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link theme-toggle-btn"
                :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
                :title="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
                @click="toggleTheme"
              >
                <span class="mobile-control-label d-lg-none">{{ theme === 'light' ? 'Switch to dark' : 'Switch to light' }}</span>
                <ControlGlyph :type="theme === 'light' ? 'moon' : 'sun'" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- =====================================================
         Page content
    ====================================================== -->
    <main role="main">
      <NuxtPage />
    </main>

    <!-- =====================================================
         Footer
    ====================================================== -->
    <footer class="site-footer py-4 border-top border-secondary border-opacity-25 mt-5">
      <div class="container">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <p class="text-muted small mb-0">
            <!-- TODO: Update year / license preference -->
            © {{ new Date().getFullYear() }} Matt Policastro
          </p>
          <div class="d-flex gap-3">
            <!-- TODO: Replace with your actual profile URLs -->
            <a
              href="https://bsky.app/profile/mattpolicastro.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted small"
            >
              Bluesky
            </a>
            <a
              href="https://github.com/mattpolicastro"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted small"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.menu-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

@media (max-width: 991.98px) {
  #site-navigation .navbar-nav {
    align-items: flex-end;
    padding: 0.75rem 0;
  }

  #site-navigation .nav-item {
    max-width: 100%;
  }

  .menu-link {
    gap: 0.625rem;
    justify-content: flex-end;
    text-align: right;
    min-height: 44px;
  }

  .site-navbar .menu-link,
  .site-navbar .search-toggle-btn,
  .site-navbar .theme-toggle-btn {
    padding-inline-end: 12px;
  }

  .search-toggle-btn,
  .theme-toggle-btn {
    min-width: 44px;
    min-height: 44px;
    gap: 0.625rem;
    flex-shrink: 0;
  }

  .mobile-control-label {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 400;
    letter-spacing: -0.015em;
    white-space: nowrap;
  }
}

.navbar-toggler {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 12px;
  border: 0;
  background: transparent;
  color: var(--theme-ink);
  box-shadow: none;
}

.navbar-toggler:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (min-width: 992px) {
  .navbar-toggler {
    display: none;
  }
}

.search-toggle-btn {
  position: absolute;
  inset: 0 0 0 auto;
  background: none;
  border: none;
  padding: var(--bs-nav-link-padding-y) var(--bs-nav-link-padding-x);
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.search-toggle-item {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  transition: width 180ms ease;
}

@media (max-width: 991.98px) {
  .search-toggle-item { width: 6rem; }
}

.search-toggle-item.search-is-open {
  width: min(20rem, calc(100vw - 3rem));
}

.search-form {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--theme-ink) 35%, transparent);
  background: var(--theme-paper);
  color: var(--theme-ink);
}

.search-form:focus-within {
  border-color: currentColor;
}

.search-field-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px;
  height: 42px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.search-input {
  flex: 1;
  width: 0;
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 1rem;
  letter-spacing: var(--tracking-body);
  padding: 0.5rem 0;
  outline: none;
}

.search-input::placeholder { color: currentColor; opacity: 0.65; }
.search-input::-webkit-search-cancel-button { -webkit-appearance: none; }
.search-field-button:focus-visible,
.search-toggle-btn:focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }

.search-field-enter-active,
.search-field-leave-active {
  transition: opacity 180ms ease, clip-path 180ms ease;
}
.search-field-enter-from,
.search-field-leave-to { opacity: 0; clip-path: inset(0 0 0 100%); }
.search-field-enter-to,
.search-field-leave-from { opacity: 1; clip-path: inset(0); }
.search-field-leave-active { pointer-events: none; }
.search-trigger-enter-active,
.search-trigger-leave-active { transition: opacity 120ms ease; }
.search-trigger-enter-from,
.search-trigger-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .search-toggle-item,
  .search-field-enter-active,
  .search-field-leave-active,
  .search-trigger-enter-active,
  .search-trigger-leave-active { transition: none; }
}

</style>
