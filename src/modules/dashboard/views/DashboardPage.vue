<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/stores/auth'

import BranchManagerDashboardView from '../views/BranchManagerDashboardView.vue'
import TrackAdminDashboardView from '../views/TrackAdminDashboardView.vue'
import InstructorDashboardView from '../views/InstructorDashboardView.vue'
import StudentDashboardView from '../views/StudentDashboardView.vue'

const auth = useAuthStore()

const config: Record<UserRole, { view: unknown; subtitle: string }> = {
  branch_manager: {
    view: BranchManagerDashboardView,
    subtitle: 'Branch-wide overview and drill-down into any track.',
  },
  track_admin: {
    view: TrackAdminDashboardView,
    subtitle: "Manage your track's active cohort end to end.",
  },
  instructor: {
    view: InstructorDashboardView,
    subtitle: 'Everything scoped to your assigned sessions.',
  },
  student: {
    view: StudentDashboardView,
    subtitle: 'Your grades, attendance, and submissions in one place.',
  },
}

const active = computed(() => {
  const role = auth.userRole
  return role ? config[role] : null
})

const greeting = computed(() => `Welcome back, ${auth.currentUser?.name ?? 'there'}`)
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-2xl font-bold text-surface-900 tracking-tight">
        {{ greeting }}
      </h2>
      <p v-if="active" class="text-sm text-surface-500 mt-1">
        {{ active.subtitle }}
      </p>
    </header>

    <component :is="active.view" v-if="active" />
    <div v-else class="h-64 flex items-center justify-center text-surface-500 text-sm">
      Unable to resolve a dashboard for your role.
    </div>
  </div>
</template>
