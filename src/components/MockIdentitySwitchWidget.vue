<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, type UserRole } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const internalLoading = ref(false)

async function handleIdentitySwitch(role: UserRole) {
  internalLoading.value = true
  try {
    // 1. Await the full round-trip network response safely
    const testCredentials: Record<UserRole, string> = {
      branch_manager: 'branch@example.com',
      track_admin: 'admin@example.com', // Track Admin for Cohort 1
      instructor: 'dexter.erdman@example.net', // Instructor for Abbie's Lab Group
      student: 'adeline.hansen@example.org', // Abbie Dietrich
    }
    await auth.login({
      email: testCredentials[role],
      password: 'password',
    })

    // 2. Clear out any hanging application operational errors
    auth.error = null

    // 3. Handle the navigation recovery route mechanics
    if (route.name === 'Unauthorized') {
      // If stuck on the 403 page, send them back to the entry gateway location
      await router.push('/')
    } else {
      // Otherwise, dynamic components re-evaluate instantly, but a soft routing refresh forces guard re-checks
      await router.replace(route.fullPath)
    }
  } catch (err) {
    console.error('Sandbox login transition error dropped:', err)
  } finally {
    internalLoading.value = false
  }
}
</script>

<template>
  <div
    class=" bg-surface-900 border border-surface-700 p-3 rounded-lg shadow-xl text-white z-50 flex flex-col gap-2 max-w-xs">
    <div class="text-xs font-bold uppercase tracking-wider text-surface-400 flex justify-between items-center">
      <span>Dev Sandbox Identity</span>
      <span v-if="internalLoading || auth.loading" class="loading loading-spinner loading-xs text-primary"></span>
    </div>

    <div class="text-sm">
      Active:
      <span class="text-primary font-semibold">{{ auth.currentUser?.name || 'Guest' }}</span>
      <div class="text-xs text-surface-400">Role: {{ auth.currentUser?.role || 'None' }}</div>
    </div>

    <div class="grid grid-cols-2 gap-1 mt-1">
      <button @click="handleIdentitySwitch('branch_manager')" :disabled="internalLoading"
        class="btn btn-xs btn-outline text-white"
        :class="{ 'btn-active btn-primary': auth.userRole === 'branch_manager' }">
        Manager
      </button>
      <button @click="handleIdentitySwitch('track_admin')" :disabled="internalLoading"
        class="btn btn-xs btn-outline text-white"
        :class="{ 'btn-active btn-primary': auth.userRole === 'track_admin' }">
        Admin
      </button>
      <button @click="handleIdentitySwitch('instructor')" :disabled="internalLoading"
        class="btn btn-xs btn-outline text-white" :class="{ 'btn-active btn-primary': auth.userRole === 'instructor' }">
        Instructor
      </button>
      <button @click="handleIdentitySwitch('student')" :disabled="internalLoading"
        class="btn btn-xs btn-outline text-white" :class="{ 'btn-active btn-primary': auth.userRole === 'student' }">
        Student
      </button>
    </div>
  </div>
</template>
