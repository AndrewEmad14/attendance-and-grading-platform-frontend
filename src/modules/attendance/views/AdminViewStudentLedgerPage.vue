<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { attendanceApi } from '../api'
import type { LedgerEntry, PaginatedMeta } from '../types'
import AttendanceBalanceCard from '../components/AttendanceBalanceCard.vue'
import AttendanceStatusBadge from '../components/AttendanceStatusBadge.vue'
import ExcuseStatusTag from '../components/ExcuseStatusTag.vue'

const route = useRoute()

const studentId = ref<number | ''>(route.params.id ? Number(route.params.id) : '')
const entries = ref<LedgerEntry[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

const MAX_BALANCE = 250

const totalDeducted = computed(() =>
  entries.value.reduce((sum, e) => (e.deduction < 0 ? sum + Math.abs(e.deduction) : sum), 0)
)

const currentBalance = computed(() => MAX_BALANCE - totalDeducted.value)

async function load(p = 1) {
  if (!studentId.value) return
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.studentLedger(Number(studentId.value), { page: String(p), per_page: '15' })
    entries.value = res.data
    meta.value = res.meta
    page.value = p
  } catch (e: any) {
    error.value = e.message || 'Failed to load ledger'
  } finally {
    loading.value = false
  }
}

if (studentId.value) load(1)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <h1 class="text-xl font-semibold text-zinc-800">Student Attendance Ledger</h1>

    <div v-if="!route.params.id" class="flex gap-3">
      <input v-model="studentId" type="number" placeholder="Enter student ID"
        class="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 w-48" />
      <button @click="load(1)" :disabled="!studentId || loading"
        class="px-4 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition">
        Load
      </button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-24 rounded-xl bg-zinc-100 animate-pulse" />
      <div class="h-64 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <template v-else-if="entries.length || meta">
      <AttendanceBalanceCard :balance="currentBalance" :max="MAX_BALANCE" :deducted="totalDeducted" />

      <div v-if="entries.length" class="overflow-x-auto rounded-xl border border-zinc-200">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Session</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Date</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Excuse</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Deduction
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-for="entry in entries" :key="entry.engagement_id" class="hover:bg-zinc-50 transition-colors">
              <td class="px-4 py-3">
                <p class="font-medium text-zinc-800">{{ entry.name }}</p>
                <p class="text-xs text-zinc-400 capitalize">{{ entry.engagement_type?.replace('_', ' ') ?? '' }}</p>
              </td>
              <td class="px-4 py-3 text-xs text-zinc-500">
                <p>{{ formatDate(entry.date) }}</p>
                <p v-if="entry.arrived_at" class="text-zinc-400">{{ formatTime(entry.arrived_at) }}</p>
              </td>
              <td class="px-4 py-3">
                <AttendanceStatusBadge :status="entry.absence_status" />
              </td>
              <td class="px-4 py-3">
                <ExcuseStatusTag :status="entry.excuse_status" />
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="entry.deduction < 0 ? 'text-red-600 font-semibold' : 'text-zinc-400'">
                  {{ entry.deduction < 0 ? entry.deduction : '—' }} </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-400">
        No entries for this student.
      </div>

      <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between text-xs text-zinc-500">
        <button :disabled="page === 1" @click="load(page - 1)"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-left" />
        </button>
        <span>Page {{ meta.current_page }} of {{ meta.last_page }}</span>
        <button :disabled="page === meta.last_page" @click="load(page + 1)"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-right" />
        </button>
      </div>
    </template>
  </div>
</template>