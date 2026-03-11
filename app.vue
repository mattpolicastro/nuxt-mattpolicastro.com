<script setup lang="ts">
// Global app shell — wraps every page with the navbar and footer.
const navOpen = ref(false)
const searchQuery = ref('')

function submitSearch() {
  if (searchQuery.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
    searchQuery.value = ''
    navOpen.value = false
  }
}

// Close the mobile nav on route change.
const route = useRoute()
watch(() => route.path, () => { navOpen.value = false })
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
            <li class="nav-item">
              <form class="d-flex" @submit.prevent="submitSearch">
                <input
                  v-model="searchQuery"
                  type="search"
                  class="form-control form-control-sm"
                  placeholder="Search posts…"
                  aria-label="Search"
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
</style>
