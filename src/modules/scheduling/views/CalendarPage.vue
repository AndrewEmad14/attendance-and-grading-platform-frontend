<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import SchedulingAdminPanel from '../components/SchedulingAdminPanel.vue'
import InstructorTimelineView from '../components/InstructorTimelineView.vue'
import StudentTimelineView from '../components/StudentTimelineView.vue'
import UnauthorizedPage from '@/components/UnauthorizedPage.vue'

const auth = useAuthStore()
</script>

<template>
  <main class="p-6 max-w-7xl mx-auto w-full">

    <template v-if="auth.userRole === 'track_admin'">
      <SchedulingAdminPanel />
    </template>

    <template v-else-if="auth.userRole === 'instructor'">
      <InstructorTimelineView />
    </template>

    <template v-else-if="auth.userRole === 'student'">
      <StudentTimelineView />
    </template>

    <template v-else>
      <UnauthorizedPage />
    </template>
  </main>
</template>