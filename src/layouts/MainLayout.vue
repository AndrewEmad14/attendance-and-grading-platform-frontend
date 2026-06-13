<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { navigationConfig } from '@/router/navigation'

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

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="min-h-screen bg-surface-50 flex">
    <aside
      class="w-64 bg-surface-900 text-surface-100 flex flex-col border-r border-surface-800 shrink-0 sticky top-0 h-screen">
      <div class="h-16 flex items-center px-6 border-b border-surface-800 gap-2">
        <i class="pi pi-graduation-cap text-primary text-xl"></i>
        <span class="font-bold text-lg tracking-wide text-white">AcademyOS</span>
      </div>
      <nav class="flex-1 p-4 overflow-y-auto space-y-3">
        <RouterLink v-for="item in allowedNavItems" :key="item.path" :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200" :class="isNavActive(item.path)
            ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20'
            : 'text-surface-400 hover:bg-surface-800 hover:text-white'
            ">
          <i :class="[item.icon, 'text-base']"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="p-4 border-t border-surface-800 text-xs text-surface-500 text-center">
        v1.0.0 Stable Build
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-8 shadow-xs shrink-0">
        <h1 class="text-xl font-bold text-surface-800 tracking-tight">
          {{ pageTitle }}
        </h1>

        <div class="flex items-center gap-4">
          <!-- Logged in: profile link + avatar + logout -->
          <template v-if="auth.currentUser">
            <RouterLink to="/profile" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-surface-500 hover:bg-surface-100 hover:text-surface-800 transition-colors"
              @click="handleLogout">
              <i class="pi pi-sign-out"></i>
              <span class="hidden sm:inline">Logout</span>
            </button>
          </template>

          <!-- Logged out: sign-in link -->
          <template v-else>
            <RouterLink to="/login"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
              <i class="pi pi-sign-in"></i>
              <span>Sign In</span>
            </RouterLink>
          </template>
        </div>
      </header>

      <main class="flex-1 p-8 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
