<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { attendanceApi } from '../api'
import type { AttendanceLedger } from '../types'
import AttendanceBalanceCard from '../components/AttendanceBalanceCard.vue'
import AttendanceStatusBadge from '../components/AttendanceStatusBadge.vue'
import ExcuseStatusTag from '../components/ExcuseStatusTag.vue'

const auth = useAuthStore()
const ledger = ref<AttendanceLedger | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  if (!auth.currentUser!.id) return
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.studentLedger(auth.currentUser!.id)
    ledger.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Failed to load ledger'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

// Assumed max balance — adjust once you have the field from backend
const MAX_BALANCE = 10
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-zinc-800">My Attendance</h1>
      <button
        @click="load"
        class="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition"
      >
        <i class="pi pi-refresh" /> Refresh
      </button>
    </div>

    <!-- Balance card -->
    <AttendanceBalanceCard
      v-if="ledger"
      :balance="ledger.student.current_balance"
      :max="MAX_BALANCE"
      :student-name="ledger.student.name"
    />
    <div v-else-if="loading" class="h-24 rounded-xl bg-zinc-100 animate-pulse" />

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Ledger table -->
    <div v-if="ledger?.entries.length" class="overflow-x-auto rounded-xl border border-zinc-200">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th
              class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
            >
              Session
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
            >
              Date
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
            >
              Status
            </th>
            <th
              class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
            >
              Excuse
            </th>
            <th
              class="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
            >
              Deduction
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr
            v-for="entry in ledger.entries"
            :key="entry.engagement_id"
            class="hover:bg-zinc-50 transition-colors"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-zinc-800">{{ entry.name }}</p>
              <p class="text-xs text-zinc-400 capitalize">
                {{ entry.engagement_type.replace('_', ' ') }}
              </p>
            </td>
            <td class="px-4 py-3 text-zinc-500 text-xs">
              <p>{{ formatDate(entry.date) }}</p>
              <p v-if="entry.arrived_at" class="text-zinc-400">
                In: {{ formatTime(entry.arrived_at) }}
              </p>
            </td>
            <td class="px-4 py-3">
              <AttendanceStatusBadge :status="entry.absence_status" />
            </td>
            <td class="px-4 py-3">
              <ExcuseStatusTag :status="entry.excuse_status" />
            </td>
            <td class="px-4 py-3 text-right">
              <span :class="entry.deduction > 0 ? 'text-red-600 font-semibold' : 'text-zinc-400'">
                {{ entry.deduction > 0 ? `-${entry.deduction}h` : '—' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="!loading && ledger"
      class="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-400"
    >
      No attendance records yet.
    </div>
  </div>
</template>
