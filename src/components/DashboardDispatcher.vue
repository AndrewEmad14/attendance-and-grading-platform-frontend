<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

// Automatically redirect the user to their permitted homepage whenever the active role swaps
watchEffect(() => {
  if (!auth.isAuthenticated) return
  
  switch (auth.userRole) {
    case 'branch_manager':
      router.replace('/analytics')
      break
    case 'track_admin':
      router.replace('/cohorts')
      break
    case 'instructor':
      router.replace('/schedule')
      break
    case 'student':
      router.replace('/submissions')
      break
    default:
      router.replace('/unauthorized')
  }
})
</script>

<template>
  <div class="h-64 flex flex-col items-center justify-center gap-4 text-surface-500">
    <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
    <p class="text-sm font-medium">Resolving Dashboard View...</p>
  </div>
</template>