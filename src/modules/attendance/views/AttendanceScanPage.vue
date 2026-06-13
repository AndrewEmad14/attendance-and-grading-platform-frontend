<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { attendanceApi } from '../api'
import type { CheckInResult } from '../types'

const route = useRoute()
const router = useRouter()

const result = ref<CheckInResult | null>(null)
const loading = ref(true)
const fatalError = ref<string | null>(null)

const outcomeConfig: Record<CheckInResult['outcome'], { icon: string; color: string; title: string }> = {
  checked_in: { icon: 'pi pi-sign-in', color: 'text-success-content bg-success border-success-border', title: 'Checked In' },
  checked_out: { icon: 'pi pi-sign-out', color: 'text-success-content bg-success border-success-border', title: 'Checked Out' },
  idempotent: { icon: 'pi pi-info-circle', color: 'text-info-content bg-info border-info-border', title: 'Already Recorded' },
  rejected: { icon: 'pi pi-times-circle', color: 'text-danger-content bg-danger border-danger-border', title: 'Rejected' },
  not_found: { icon: 'pi pi-question-circle', color: 'text-zinc-500 bg-zinc-50 border-zinc-200', title: 'Session Not Found' },
  session_ended: { icon: 'pi pi-clock', color: 'text-warning-content bg-warning border-warning-border', title: 'Session Ended' },
}

async function run() {
  loading.value = true
  fatalError.value = null

  const engagementId = Number(route.params.engagementId)
  const token = route.query.token as string | undefined

  if (!engagementId || !token) {
    fatalError.value = 'Invalid QR code — missing session or token information.'
    loading.value = false
    return
  }

  try {
    const res = await attendanceApi.scan(engagementId, token)
    result.value = res.data
  } catch (e: any) {
    fatalError.value = e.message || 'Check-in failed.'
  } finally {
    loading.value = false
  }
}

onMounted(run)

const formatTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center gap-6">
    <!-- Loading -->
    <template v-if="loading">
      <div class="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center">
        <i class="pi pi-spin pi-spinner text-2xl text-zinc-400" />
      </div>
      <p class="text-sm text-zinc-500">Checking in…</p>
    </template>

    <!-- Fatal error (no token, network failure) -->
    <template v-else-if="fatalError">
      <div class="w-20 h-20 rounded-full flex items-center justify-center border text-danger-content bg-danger border-danger-border">
        <i class="pi pi-times-circle text-3xl" />
      </div>
      <div>
        <h1 class="text-lg font-semibold text-zinc-800">Check-In Failed</h1>
        <p class="text-sm text-zinc-500 mt-1">{{ fatalError }}</p>
      </div>
    </template>

    <!-- Result -->
    <template v-else-if="result">
      <div
        :class="['w-20 h-20 rounded-full flex items-center justify-center border', outcomeConfig[result.outcome].color]">
        <i :class="[outcomeConfig[result.outcome].icon, 'text-3xl']" />
      </div>
      <div>
        <h1 class="text-lg font-semibold text-zinc-800">{{ outcomeConfig[result.outcome].title }}</h1>
        <p class="text-sm text-zinc-500 mt-1">{{ result.message }}</p>
      </div>

      <div v-if="result.record"
        class="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left text-sm space-y-1.5">
        <div class="flex justify-between">
          <span class="text-zinc-400">Arrived</span>
          <span class="font-medium text-zinc-800">{{ formatTime(result.record.arrived_at) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-400">Left</span>
          <span class="font-medium text-zinc-800">{{ formatTime(result.record.left_at) }}</span>
        </div>
      </div>
    </template>

    <button @click="router.push({ name: 'MyAttendanceLedger' })"
      class="cursor-pointer mt-2 px-4 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition">
      Go to My Attendance
    </button>
  </div>
</template>
