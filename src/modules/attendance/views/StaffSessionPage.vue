<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { attendanceApi } from '../api'
import type { Engagement } from '../types'
import SessionAttendanceTable from '../components/SessionAttendanceTable.vue'
import QrCodeDisplay from '../components/QrCodeDisplay.vue'

const route = useRoute()
const router = useRouter()
const engagementId = computed(() => Number(route.params.engagementId))

const engagement = ref<Engagement | null>(null)
const showQr = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await attendanceApi.mySessions({ page: 1, per_page: 100 })
    engagement.value = res.data.find(e => e.id === engagementId.value) ?? null
  } catch (e: any) {
    error.value = e.message || 'Failed to load session'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-4">
    <div class="flex items-center gap-3 mb-2">
      <button @click="router.back()"
        class="cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition">
        <i class="pi pi-arrow-left text-xs" />
      </button>
      <h1 class="text-lg font-semibold text-zinc-800">Session Details</h1>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 3" :key="n" class="h-16 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <template v-else-if="engagement">
      <!-- Session header -->
      <div class="rounded-xl border border-zinc-200 bg-white p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-widest text-zinc-400 mb-1">
              {{ engagement.display_context }}
            </p>
            <h2 class="text-lg font-semibold text-zinc-800">{{ engagement.display_title }}</h2>
            <p class="text-sm text-zinc-500 mt-1">
              <i class="pi pi-user mr-1" />{{ engagement.staff_name }}
              <span class="mx-2 text-zinc-300">·</span>
              <i class="pi pi-clock mr-1" />{{ engagement.scheduled_hours }}h
            </p>
          </div>
          <button @click="showQr = !showQr"
            :class="['cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition',
              showQr ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50']">
            <i class="pi pi-qrcode" />
            {{ showQr ? 'Hide QR' : 'Show QR' }}
          </button>
        </div>
      </div>

      <!-- QR code -->
      <QrCodeDisplay v-if="showQr" :engagement-id="engagement.id" />

      <!-- Roster -->
      <div class="space-y-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">Attendance</p>
        <SessionAttendanceTable :engagement-id="engagement.id" />
      </div>
    </template>
  </div>
</template>