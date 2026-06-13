<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { attendanceApi } from '../api'

const props = defineProps<{ engagementId: number }>()

const token = ref<string | null>(null)
const expiresAt = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const qrUrl = computed(() => {
  if (!token.value) return null
  const scanUrl = `${window.location.origin}/attendance/scan/${props.engagementId}?token=${encodeURIComponent(token.value)}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(scanUrl)}`
})

const expiryColor = computed(() => {
  if (secondsLeft.value > 60) return 'text-emerald-600'
  if (secondsLeft.value > 20) return 'text-amber-500'
  return 'text-red-600'
})

function startCountdown() {
  if (timer) clearInterval(timer)
  if (!expiresAt.value) return
  timer = setInterval(() => {
    const diff = Math.max(0, Math.floor((new Date(expiresAt.value!).getTime() - Date.now()) / 1000))
    secondsLeft.value = diff
    if (diff === 0) clearInterval(timer!)
  }, 1000)
}

async function fetchQr() {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.sessionQr(props.engagementId)
    token.value = res.data.token
    expiresAt.value = res.data.expires_at
    startCountdown()
  } catch (e: any) {
    error.value = e.message || 'Failed to load QR'
  } finally {
    loading.value = false
  }
}

onMounted(fetchQr)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <div class="flex flex-col items-center gap-4 p-6 rounded-xl border border-zinc-200 bg-white">
    <p class="text-xs uppercase tracking-widest text-zinc-400 font-medium">Session QR Code</p>

    <!-- Loading -->
    <div
      v-if="loading"
      class="w-48 h-48 rounded-lg bg-zinc-100 animate-pulse flex items-center justify-center"
    >
      <i class="pi pi-spin pi-spinner text-zinc-300 text-2xl" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center"
    >
      <i class="pi pi-exclamation-triangle block text-xl mb-1" />
      {{ error }}
    </div>

    <!-- QR -->
    <template v-else-if="qrUrl">
      <div class="relative">
        <img
          :src="qrUrl"
          alt="Session QR Code"
          class="w-48 h-48 rounded-lg"
          :class="{ 'opacity-30 grayscale': secondsLeft === 0 }"
        />
        <div v-if="secondsLeft === 0" class="absolute inset-0 flex items-center justify-center">
          <span class="text-xs font-semibold text-zinc-500 bg-white/90 px-2 py-1 rounded"
            >Expired</span
          >
        </div>
      </div>

      <div class="text-center">
        <p :class="['text-2xl font-bold tabular-nums', expiryColor]">
          {{ formatTime(secondsLeft) }}
        </p>
        <p class="text-xs text-zinc-400 mt-0.5">until expiry</p>
      </div>

      <button
        @click="fetchQr"
        class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 transition"
      >
        <i class="pi pi-refresh" /> Refresh
      </button>
    </template>
  </div>
</template>
