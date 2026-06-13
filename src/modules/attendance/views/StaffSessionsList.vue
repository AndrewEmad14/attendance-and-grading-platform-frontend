<script setup lang="ts">
/**
 * StaffSessionsList — lightweight list-only view (no roster panel).
 * Useful as a standalone route or mobile fallback.
 * Navigates to StaffSessionPage with a selected ID via route params.
 */
import { useRouter } from 'vue-router'
import type { Engagement } from '../types'
import MySessionsList from '../components/MySessionsList.vue'

const router = useRouter()

function onSelect(session: Engagement) {
  // Adjust route name to match your router config
  router.push({ name: 'StaffSessionPage', params: { id: session.id } })
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-8 space-y-4">
    <h1 class="text-xl font-semibold text-zinc-800">Sessions</h1>
    <MySessionsList @select="onSelect" />
  </div>
</template>