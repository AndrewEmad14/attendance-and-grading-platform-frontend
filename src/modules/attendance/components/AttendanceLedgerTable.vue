<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { attendanceApi } from '../api'
import type { LedgerEntry, PaginatedMeta } from '../types'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'

const props = defineProps<{ studentId: number }>()

const entries = ref<LedgerEntry[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const tableLoading = ref(false)
const tableError = ref<string | null>(null)

// Filters
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const status = ref<'all' | 'present' | 'absent' | 'upcoming'>('all')

// Debounced search
const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout>
watch(search, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedSearch.value = v }, 400)
})

async function loadEntries(p = 1) {
  tableLoading.value = true
  tableError.value = null
  try {
    const params: Record<string, string> = { page: String(p), per_page: '15' }
    if (debouncedSearch.value) params.search = debouncedSearch.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    if (status.value !== 'all') params.status = status.value

    const res = await attendanceApi.studentLedger(props.studentId, params)
    entries.value = res.data
    meta.value = res.meta
    page.value = p
  } catch (e: any) {
    tableError.value = e.message || 'Failed to load entries'
  } finally {
    tableLoading.value = false
  }
}

onMounted(() => loadEntries(1))
watch([debouncedSearch, dateFrom, dateTo, status], () => loadEntries(1))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<template>
  <div class="space-y-3">
    <div v-if="tableError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ tableError }}
    </div>

    <!-- Status filters -->
    <div class="flex flex-wrap gap-2 items-center">
      <button v-for="opt in (['all', 'present', 'absent'] as const)" :key="opt" @click="status = opt" :class="['cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize',
        status === opt
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
          : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50']">
        {{ opt }}
      </button>
    </div>

    <!-- Date range + search -->
    <div class="flex flex-wrap gap-2 items-center">
      <input v-model="dateFrom" type="date"
        class="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      <span class="text-xs text-zinc-400">to</span>
      <input v-model="dateTo" type="date" :min="dateFrom"
        class="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      <div class="relative ml-auto">
        <i class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs" />
        <input v-model="search" type="text" placeholder="Search session name…"
          class="pl-7 pr-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      </div>
    </div>

    <!-- Table skeleton -->
    <div v-if="tableLoading" class="rounded-xl border border-zinc-200 overflow-hidden min-h-128">
      <div class="h-10 bg-zinc-50 border-b border-zinc-200" />
      <div class="space-y-px p-2">
        <div v-for="i in 15" :key="i" class="h-12 rounded-lg bg-zinc-100 animate-pulse" />
      </div>
    </div>

    <template v-else>
      <div class="overflow-x-auto rounded-xl border border-zinc-200">
        <table class="w-full text-sm">
          <thead
            class="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <tr>
              <th v-for="h in ['Date', 'Session', 'Instructor', 'Status', 'Deduction']" :key="h"
                :class="['px-4 py-3', h === 'Deduction' ? 'text-right' : '']">{{ h }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <template v-if="entries.length">
              <tr v-for="entry in entries" :key="entry.engagement_id" class="hover:bg-zinc-50 transition-colors">
                <td class="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  <p>{{ formatDate(entry.date) }}</p>
                  <p v-if="entry.arrived_at" class="text-zinc-400">In: {{ formatTime(entry.arrived_at) }}</p>
                </td>
                <td class="px-4 py-3 max-w-45">
                  <p class="font-medium text-zinc-800 truncate" :title="entry.name">{{ entry.name }}</p>
                  <p class="text-xs text-zinc-400 capitalize">{{ entry.engagement_type?.replace('_', ' ') ?? '' }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-zinc-500 max-w-35 truncate"
                  :title="entry.engagement_instructor || undefined">
                  {{ entry.engagement_instructor || '—' }}
                </td>
                <td class="px-4 py-3">
                  <AttendanceStatusBadge :status="entry.absence_status" />
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="entry.deduction < 0 ? 'text-red-600 font-semibold' : 'text-zinc-400'">
                    {{ entry.deduction < 0 ? entry.deduction : '—' }} </span>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="5" class="px-4 text-center text-sm text-zinc-400 h-120">
                No attendance records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between text-xs text-zinc-500">
        <button :disabled="page === 1" @click="loadEntries(page - 1)"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-left" style="font-size: 0.6rem;" />
        </button>
        <span>Page {{ meta.current_page }} of {{ meta.last_page }}</span>
        <button :disabled="page === meta.last_page" @click="loadEntries(page + 1)"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-right" style="font-size: 0.6rem;" />
        </button>
      </div>
    </template>
  </div>
</template>