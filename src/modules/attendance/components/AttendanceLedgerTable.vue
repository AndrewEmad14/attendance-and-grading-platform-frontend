<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { attendanceApi } from '../api'
import type { LedgerEntry } from '../types'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'
import ExcuseStatusTag from './ExcuseStatusTag.vue'

const props = defineProps<{ studentId: number }>()
const router = useRouter()

const entries = ref<LedgerEntry[]>([])
const tableLoading = ref(false)
const tableError = ref<string | null>(null)
const page = ref(1)
const PAGE_SIZE = 8

// Filters
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const status = ref<'all' | 'present' | 'absent'>('all')

// Debounced search
const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout>
watch(search, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedSearch.value = v }, 400)
})

const totalPages = computed(() => Math.max(1, Math.ceil(entries.value.length / PAGE_SIZE)))
const pagedEntries = computed(() => entries.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

async function loadEntries() {
  tableLoading.value = true
  tableError.value = null
  try {
    const params: Record<string, string> = {}
    if (debouncedSearch.value) params.search = debouncedSearch.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    if (status.value !== 'all') params.status = status.value

    const res = await attendanceApi.studentLedger(props.studentId, params)
    entries.value = res.data.entries
    page.value = 1
  } catch (e: any) {
    tableError.value = e.message || 'Failed to load entries'
  } finally {
    tableLoading.value = false
  }
}

onMounted(loadEntries)
watch([debouncedSearch, dateFrom, dateTo, status], loadEntries)

const formatDate = (iso: string) => new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
const formatTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<template>
  <div class="space-y-3">
    <!-- Error -->
    <div v-if="tableError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ tableError }}
    </div>

    <!-- Row 1: status filters + excuse link -->
    <div class="flex flex-wrap gap-2 items-center">
      <button v-for="opt in (['all', 'present', 'absent'] as const)" :key="opt" @click="status = opt" :class="['cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize',
        status === opt
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
          : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50']">
        {{ opt }}
      </button>
      <RouterLink :to="{ name: 'MyExcuses' }"
        class="ml-auto cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition">
        <i class="pi pi-inbox" /> View My Excuses
      </RouterLink>
    </div>

    <!-- Row 2: date range + search -->
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
        <div v-for="i in PAGE_SIZE" :key="i" class="h-12 rounded-lg bg-zinc-100 animate-pulse" />
      </div>
    </div>

    <!-- Table -->
    <template v-else>
      <div class="overflow-x-auto rounded-xl border border-zinc-200">
        <table class="w-full text-sm">
          <thead
            class="bg-zinc-50 border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <tr>
              <th v-for="h in ['Date', 'Session', 'Instructor', 'Status', 'Excuse', 'Deduction', '']" :key="h"
                :class="['px-4 py-3', h === 'Deduction' ? 'text-right' : '']">{{ h }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <template v-if="pagedEntries.length">
              <tr v-for="entry in pagedEntries" :key="entry.engagement_id" class="hover:bg-zinc-50 transition-colors">
                <td class="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  <p>{{ formatDate(entry.date) }}</p>
                  <p v-if="entry.arrived_at" class="text-zinc-400">In: {{ formatTime(entry.arrived_at) }}</p>
                </td>
                <td class="px-4 py-3 max-w-45">
                  <p class="font-medium text-zinc-800 truncate" :title="entry.name">{{ entry.name }}</p>
                  <p class="text-xs text-zinc-400 capitalize">{{ entry.engagement_type.replace('_', ' ') }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-zinc-500 max-w-35 truncate"
                  :title="entry.engagement_instructor || undefined">
                  {{ entry.engagement_instructor || '—' }}
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
                <td class="px-4 py-3 text-right">
                  <button
                    v-if="entry.absence_status === 'absent' && (!entry.excuse_status || entry.excuse_status === 'none')"
                    @click="router.push({ name: 'NewExcuseRequest', query: { engagement_id: String(entry.engagement_id) } })"
                    class="cursor-pointer px-2.5 py-1 rounded text-xs font-medium text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition">
                    Create Excuse
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="7" class="px-4 text-center text-sm text-zinc-400 h-120">
                No attendance records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-zinc-500">
        <button :disabled="page === 1" @click="page--"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-left" />
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button :disabled="page === totalPages" @click="page++"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-right" />
        </button>
      </div>
    </template>
  </div>
</template>