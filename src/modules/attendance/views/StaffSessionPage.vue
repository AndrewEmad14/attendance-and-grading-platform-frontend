<script setup lang="ts" const qrFullscreen=ref(false)>
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
const qrFullscreen = ref(false)
const isSessionActive = computed(() =>
  engagement.value ? new Date() < new Date(engagement.value.ends_at) : false
)
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

    <div v-else-if="error" class="rounded-lg border border-danger-border bg-danger p-4 text-sm text-danger-content">
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
            <p class="text-xs text-zinc-400 mt-1">
              <i class="pi pi-calendar mr-1" />
              {{ new Date(engagement.starts_at).toLocaleDateString([], {
                weekday: 'short', month: 'short', day:
                  'numeric'
              }) }}
              <span class="mx-1.5 text-zinc-300">·</span>
              {{ new Date(engagement.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              <span class="mx-1 text-zinc-300">→</span>
              {{ new Date(engagement.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </div>
          <button v-if="isSessionActive" @click="showQr = !showQr"
            :class="['cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition',
              showQr ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50']">
            <i class="pi pi-qrcode" />
            {{ showQr ? 'Hide QR' : 'Show QR' }}
          </button>
          <span v-else class="text-xs text-zinc-400 border border-zinc-200 px-3 py-1.5 rounded-lg">
            Session Ended
          </span>
        </div>
      </div>
      <!-- QR code -->
      <div v-if="showQr" class="relative">
        <QrCodeDisplay :engagement-id="engagement.id" />
        <button @click="qrFullscreen = true"
          class="cursor-pointer absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 transition">
          <i class="pi pi-expand" /> Fullscreen
        </button>
      </div>

      <!-- QR Fullscreen overlay -->
      <Teleport to="body">
        <div v-if="qrFullscreen"
          class="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-6 min-h-screen"
          @click="qrFullscreen = false">
          <p class="text-white text-sm font-medium tracking-wide">{{ engagement.display_title }}</p>
          <div class="bg-white rounded-2xl p-10 w-full max-w-sm" @click.stop>
            <QrCodeDisplay :engagement-id="engagement.id" />
          </div>
          <button @click="qrFullscreen = false"
            class="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white border border-white/30 hover:bg-white/10 transition">
            <i class="pi pi-times" /> Close
          </button>
        </div>
      </Teleport>
      <!-- Roster -->
      <div class="space-y-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">Attendance</p>
        <SessionAttendanceTable :engagement-id="engagement.id" />
      </div>
    </template>
  </div>
</template>