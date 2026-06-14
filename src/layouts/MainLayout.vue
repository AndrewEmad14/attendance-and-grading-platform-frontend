<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { navigationConfig } from '@/router/navigation'
import MockIdentitySwitchWidget from '@/components/MockIdentitySwitchWidget.vue'
import ScrollToTop from '@/components/ScrollToTop.vue'

const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value }
const closeMobileMenu = () => { isMobileMenuOpen.value = false }

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => route.meta.title || 'Dashboard')

const userInitials = computed(() => {
  if (!auth.currentUser) return '??'
  return auth.currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Filter the navigation links seamlessly in real-time based on the active role
const allowedNavItems = computed(() => {
  return navigationConfig.filter((item) => auth.hasRole(item.roles))
})

// Quick cosmetic helper to format role strings nicely for the header profile view
const formatRole = (role: string) => {
  return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const isNavActive = (itemPath: string) => {
  // Prevent Gradebook (/grades) from highlighting when we are in Course Configuration (/grades/config)
  if (itemPath === '/grades' && route.path.startsWith('/grades/config')) {
    return false
  }
  // Prevent Branch Insights (/analytics) from highlighting when we are on At-Risk pages
  if (itemPath === '/analytics' && (route.path === '/analytics/at-risk' || route.path.endsWith('/at-risk'))) {
    return false
  }
  return route.path.startsWith(itemPath)
}

watch(() => route.path, () => {
  closeMobileMenu()
})

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="min-h-screen bg-surface-50 flex overflow-hidden">
    <!-- Backdrop for mobile -->
    <div
      v-if="isMobileMenuOpen"
      @click="closeMobileMenu"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-pointer"
    ></div>

    <!-- Sidebar / Drawer -->
    <aside
      :class="[
        'w-64 bg-surface-900 text-surface-100 flex flex-col border-r border-surface-800 shrink-0 h-screen fixed lg:sticky top-0 z-50 transition-transform duration-300 ease-in-out',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <div class="h-16 flex items-center justify-between px-6 border-b border-surface-800 gap-2">
        <div class="flex items-center gap-2">
          <i class="pi pi-graduation-cap text-primary text-xl"></i>
          <span class="font-bold text-lg tracking-wide text-white">ITI Portal</span>
        </div>
        <button class="lg:hidden text-surface-400 hover:text-white cursor-pointer" @click="closeMobileMenu">
          <i class="pi pi-times text-xl"></i>
        </button>
      </div>
      <nav class="flex-1 p-4 overflow-y-auto space-y-3">
        <RouterLink v-for="item in allowedNavItems" :key="item.path" :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer" :class="isNavActive(item.path)
            ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20'
            : 'text-surface-400 hover:bg-surface-800 hover:text-white'
            ">
          <i :class="[item.icon, 'text-base']"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="p-4 border-t border-surface-800 text-xs text-surface-500 text-center">
        <MockIdentitySwitchWidget class="mb-4" />
        v1.0.0 Stable Build
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <header
        class="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 sm:px-8 shadow-xs shrink-0 z-30">
        
        <div class="flex items-center gap-3">
          <button class="lg:hidden text-surface-600 hover:text-surface-900 cursor-pointer" @click="toggleMobileMenu">
            <i class="pi pi-bars text-xl"></i>
          </button>
          <h1 class="text-xl font-bold text-surface-800 tracking-tight truncate">
            {{ pageTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <!-- Logged in: profile link + avatar + logout -->
          <template v-if="auth.currentUser">
            <RouterLink to="/profile"
              class="cursor-pointer flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div class="text-right hidden sm:block">
                <div class="text-sm font-semibold text-surface-800 leading-tight">
                  {{ auth.currentUser.name }}
                </div>
                <div class="text-xs text-surface-500 font-medium mt-0.5">
                  {{ formatRole(auth.currentUser.role) }}
                </div>
              </div>
              <div class="avatar placeholder">
                <div
                  class="bg-primary text-white w-10 h-10 rounded-full font-bold text-sm tracking-wider shadow-inner flex items-center justify-center">
                  <span>{{ userInitials }}</span>
                </div>
              </div>
            </RouterLink>

            <button type="button"
              class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-surface-500 hover:bg-surface-100 hover:text-surface-800 transition-colors"
              @click="handleLogout">
              <i class="pi pi-sign-out"></i>
              <span class="hidden sm:inline">Logout</span>
            </button>
          </template>

          <!-- Logged out: sign-in link -->
          <template v-else>
            <RouterLink to="/login"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">
              <i class="pi pi-sign-in"></i>
              <span>Sign In</span>
            </RouterLink>
          </template>
        </div>
      </header>

      <main class="flex-1 p-0 overflow-y-auto relative bg-surface-50">
        <div class="p-4 sm:p-6 lg:p-8">
          <RouterView />
        </div>
        <ScrollToTop />
      </main>
    </div>
  </div>
</template>
