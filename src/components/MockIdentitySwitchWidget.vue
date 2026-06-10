<script setup lang="ts">
import { useAuthStore, type UserRole } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="fixed bottom-4 right-4 bg-surface-900 border border-surface-700 p-3 rounded-lg shadow-xl text-white z-50 flex flex-col gap-2 max-w-xs">
    <div class="text-xs font-bold uppercase tracking-wider text-surface-400">
      Dev Sandbox Identity
    </div>
    
    <div class="text-sm">
      Active: <span class="text-primary font-semibold">{{ auth.currentUser?.name }}</span> 
      <div class="text-xs text-surface-400">Role: {{ auth.currentUser?.role }}</div>
    </div>

    <div class="grid grid-cols-2 gap-1 mt-1">
      <button 
        @click="auth.loginAs('branch_manager'); $router.go(0)" 
        class="btn btn-xs btn-outline text-white"
        :class="{ 'btn-active btn-primary': auth.userRole === 'branch_manager' }"
      >
        Manager
      </button>
      <button 
        @click="auth.loginAs('track_admin'); $router.go(0)" 
        class="btn btn-xs btn-outline text-white"
        :class="{ 'btn-active btn-primary': auth.userRole === 'track_admin' }"
      >
        Admin
      </button>
      <button 
        @click="auth.loginAs('instructor'); $router.go(0)" 
        class="btn btn-xs btn-outline text-white"
        :class="{ 'btn-active btn-primary': auth.userRole === 'instructor' }"
      >
        Instructor
      </button>
      <button 
        @click="auth.loginAs('student'); $router.go(0)" 
        class="btn btn-xs btn-outline text-white"
        :class="{ 'btn-active btn-primary': auth.userRole === 'student' }"
      >
        Student
      </button>
    </div>
  </div>
</template>