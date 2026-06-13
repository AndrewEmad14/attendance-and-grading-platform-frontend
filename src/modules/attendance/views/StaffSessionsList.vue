<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Engagement } from '../types'
import MySessionsList from '../components/MySessionsList.vue'

const router = useRouter()

function onSelect(session: Engagement) {
  router.push({ name: 'SessionAttendance', params: { engagementId: session.id } })
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-8 space-y-4">
    <h1 class="text-xl font-semibold text-zinc-800">Sessions</h1>
    <MySessionsList @select="onSelect" />
  </div>
</template>
