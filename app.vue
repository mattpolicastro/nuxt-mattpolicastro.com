<script setup lang="ts">
// Global app shell — wraps every page with the navbar and footer.
const navOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

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
}

function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeSearch()
  }
}

// Close the mobile nav on route change.
const route = useRoute()
watch(() => route.path, () => { navOpen.value = false })

// First Growthbook test
const gb = useGrowthBook()
const featureFlag = ref(gb?.isOn('a_a-test'))
</script>

<template>
  <div id="app-shell">
    <!-- =====================================================
         Navbar
    ====================================================== -->
    <nav class="navbar navbar-expand-lg navbar-dark site-navbar sticky-top">
      <div class="container">
        <NuxtLink to="/" class="site-brand fw-semibold">
          Matt Policastro
        </NuxtLink>

        <button
          class="navbar-toggler"
          type="button"
          :aria-expanded="navOpen"
          aria-label="Toggle navigation"
          @click="navOpen = !navOpen"
        >
          <span class="navbar-toggler-icon" />
        </button>

        <div class="navbar-collapse collapse" :class="{ show: navOpen }">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li class="nav-item">
              <NuxtLink to="/" class="nav-link" active-class="active" exact>Home</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink to="/about" class="nav-link" active-class="active">About</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink to="/archives" class="nav-link" active-class="active">Archives</NuxtLink>
            </li>
            <li class="nav-item search-toggle-item">
              <button
                type="button"
                class="nav-link search-toggle-btn"
                aria-label="Toggle search"
                @click="toggleSearch"
              >
                <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.2.215.445.464.708.708l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.738-.254zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
              </button>
            </li>
            <li class="nav-item search-input-item" :class="{ 'search-active': searchOpen }">
              <form class="search-form" @submit.prevent="submitSearch">
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="search"
                  class="form-control form-control-sm search-input"
                  placeholder="Search posts…"
                  aria-label="Search"
                  @keydown="handleSearchKeydown"
                />
              </form>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- =====================================================
         Page content
    ====================================================== -->
    <main>
      <NuxtPage />
    </main>

    <!-- =====================================================
         Footer
    ====================================================== -->
    <footer class="py-4 border-top border-secondary border-opacity-25 mt-5">
      <BContainer>
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
      </BContainer>
    </footer>
  </div>
</template>

<style scoped>
.site-brand {
  font-size: 1rem; /* Bootstrap navbar-brand defaults to 1.25rem */
}

/* Search Toggle Animation */
.search-toggle-btn {
  background: none;
  border: none;
  padding: var(--bs-nav-link-padding-y) var(--bs-nav-link-padding-x);
  color: inherit;
  cursor: pointer;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.search-toggle-btn:hover,
.search-toggle-btn:focus,
.search-toggle-btn:active {
  outline: none;
  color: inherit;
  background-color: transparent;
  opacity: 0.7;
}

.search-input-item {
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  transition: max-width 0.3s ease, opacity 0.3s ease;
}

.search-input-item.search-active {
  max-width: 200px;
  opacity: 1;
}

.search-form {
  display: flex;
}

.search-input {
  min-width: 0;
}

/* Adjust navbar layout on larger screens */
@media (min-width: 992px) {
  .search-input-item {
    margin-left: 0.5rem;
  }
}
</style>
