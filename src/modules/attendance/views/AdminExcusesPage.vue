<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { attendanceApi } from '../services/attendanceApi'
import type { ExcuseRequest, ExcuseStatus } from '../types'
import type { PaginatedMeta } from '../types'
import ExcuseStatusTag from '../components/ExcuseStatusTag.vue'

const excuses = ref<ExcuseRequest[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref<number | null>(null)

const filterStatus = ref<ExcuseStatus | ''>('')

async function load(p = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.adminExcuses({
      page: p,
      per_page: 15,
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
    })
    excuses.value = res.data
    meta.value = res.meta
    page.value = p
  } catch (e: any) {
    error.value = e.message || 'Failed to load excuses'
  } finally {
    loading.value = false
  }
}

async function approve(id: number) {
  actionLoading.value = id
  try {
    await attendanceApi.approveExcuse(id)
    await load(page.value)
  } catch (e: any) {
    error.value = e.message
  } finally {
    actionLoading.value = null
  }
}

async function reject(id: number) {
  actionLoading.value = id
  try {
    await attendanceApi.rejectExcuse(id)
    await load(page.value)
  } catch (e: any) {
    error.value = e.message
  } finally {
    actionLoading.value = null
  }
}

onMounted(() => load(1))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-zinc-800">Excuse Requests</h1>

      <!-- Status filter -->
      <select
        v-model="filterStatus"
        @change="load(1)"
        class="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="h-20 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="!excuses.length" class="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-400">
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
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="excuse in excuses" :key="excuse.id" class="hover:bg-zinc-50 transition-colors">
            <td class="px-4 py-3 font-medium text-zinc-800">{{ excuse.student.name }}</td>
            <td class="px-4 py-3 text-zinc-500 text-xs">
              <p class="capitalize">{{ excuse.engagement.type.replace('_', ' ') }}</p>
              <p class="text-zinc-400">{{ formatDate(excuse.engagement.starts_at) }}</p>
            </td>
            <td class="px-4 py-3 text-xs text-zinc-400">{{ formatDate(excuse.created_at) }}</td>
            <td class="px-4 py-3"><ExcuseStatusTag :status="excuse.status" /></td>
            <td class="px-4 py-3 text-zinc-600 max-w-xs">
              <p class="line-clamp-2 text-xs">{{ excuse.reason }}</p>
              <a v-if="excuse.attachment_url" :href="excuse.attachment_url" target="_blank" class="text-xs text-indigo-500 hover:underline mt-0.5 flex items-center gap-1">
                <i class="pi pi-paperclip" /> Attachment
              </a>
            </td>
            <td class="px-4 py-3">
              <div v-if="excuse.status === 'pending'" class="flex items-center gap-2">
                <button
                  @click="approve(excuse.id)"
                  :disabled="actionLoading === excuse.id"
                  class="px-2.5 py-1 rounded text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition"
                >
                  <i v-if="actionLoading === excuse.id" class="pi pi-spin pi-spinner" />
                  <span v-else>Approve</span>
                </button>
                <button
                  @click="reject(excuse.id)"
                  :disabled="actionLoading === excuse.id"
                  class="px-2.5 py-1 rounded text-xs font-medium text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  <i v-if="actionLoading === excuse.id" class="pi pi-spin pi-spinner" />
                  <span v-else>Reject</span>
                </button>
              </div>
              <span v-else class="text-xs text-zinc-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between text-xs text-zinc-500">
      <button :disabled="page === 1" @click="load(page - 1)" class="px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
        <i class="pi pi-chevron-left" />
      </button>
      <span>Page {{ meta.current_page }} of {{ meta.last_page }}</span>
      <button :disabled="page === meta.last_page" @click="load(page + 1)" class="px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
        <i class="pi pi-chevron-right" />
      </button>
    </div>
  </div>
</template>