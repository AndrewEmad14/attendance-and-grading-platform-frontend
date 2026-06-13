<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { attendanceApi } from '../api'
import type { ExcuseRequest, ExcuseStatus, PaginatedMeta } from '../types'
import ExcuseStatusTag from '../components/ExcuseStatusTag.vue'

const router = useRouter()

const excuses = ref<ExcuseRequest[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

const filterStatus = ref<ExcuseStatus | ''>('pending')
const search = ref('')
const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout>

watch(search, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debouncedSearch.value = v }, 400)
})

watch([filterStatus, debouncedSearch], () => load(1))

async function load(p = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.adminExcuses({
      page: p,
      per_page: 15,
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
      ...(debouncedSearch.value.trim() ? { search: debouncedSearch.value.trim() } : {}),
    })
    excuses.value = res.data
    meta.value = res.meta
    page.value = p
  } catch (e: any) {
    error.value = e.message || 'Failed to load excuse requests'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })

function goToDetail(id: number) {
  router.push({ name: 'AdminExcuseDetail', params: { id } })
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <h1 class="text-xl font-semibold text-zinc-800">Excuse Requests</h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <div class="relative">
        <i class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs" />
        <input v-model="search" type="text" placeholder="Search student or reason…"
          class="pl-7 pr-3 py-1.5 rounded-lg border border-zinc-300 text-sm text-zinc-800 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 w-56" />
      </div>
      <select v-model="filterStatus"
        class="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <span v-if="meta" class="ml-auto text-xs text-zinc-400">{{ meta.total }} total</span>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 6" :key="n" class="h-16 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="!excuses.length"
      class="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-400">
      No excuse requests found.
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-zinc-200">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Student</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Session</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Submitted</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Reason</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="excuse in excuses" :key="excuse.id" @click="goToDetail(excuse.id)"
            class="cursor-pointer hover:bg-zinc-50 transition-colors">
            <td class="px-4 py-3 font-medium text-zinc-800">{{ excuse.student.name }}</td>
            <td class="px-4 py-3 text-xs">
              <p class="font-medium text-zinc-700 capitalize">
                {{ excuse.engagement.type?.replace('_', ' ') ?? excuse.engagement.name }}
              </p>
              <p class="text-zinc-400 mt-0.5">{{ formatDate(excuse.engagement.starts_at) }}</p>
            </td>
            <td class="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
              {{ formatDate(excuse.created_at) }}
            </td>
            <td class="px-4 py-3">
              <ExcuseStatusTag :status="excuse.status" />
            </td>
            <td class="px-4 py-3 max-w-xs">
              <p class="line-clamp-2 text-xs text-zinc-600">{{ excuse.reason }}</p>
              <span v-if="excuse.attachment_url" class="text-xs text-indigo-500 flex items-center gap-1 mt-0.5">
                <i class="pi pi-paperclip" /> Has attachment
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
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
  </div>
</template>