<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { attendanceApi } from '../api'
import type { ExcuseRequest, PaginatedMeta } from '../types'
import ExcuseStatusTag from '../components/ExcuseStatusTag.vue'

const excuses = ref<ExcuseRequest[]>([])
const meta = ref<PaginatedMeta | null>(null)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

async function load(p = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.myExcuses({ page: p, per_page: 15 })
    excuses.value = res.data
    meta.value = res.meta
    page.value = p
  } catch (e: any) {
    error.value = e.message || 'Failed to load excuses'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-zinc-800">My Excuse Requests</h1>
      <RouterLink :to="{ name: 'NewExcuseRequest' }"
        class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition">
        <i class="pi pi-plus" /> New Excuse
      </RouterLink>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="h-16 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <div v-else-if="!excuses.length"
      class="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-400">
      No excuse requests yet.
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-zinc-200">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Session</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Submitted</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Reason</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="excuse in excuses" :key="excuse.id" class="hover:bg-zinc-50 transition-colors">
            <td class="px-4 py-3">
              <p class="font-medium text-zinc-800 capitalize">{{ excuse.engagement.type.replace('_', ' ') }}</p>
              <p class="text-xs text-zinc-400">{{ formatDate(excuse.engagement.starts_at) }}</p>
            </td>
            <td class="px-4 py-3 text-xs text-zinc-400">{{ formatDate(excuse.created_at) }}</td>
            <td class="px-4 py-3 text-zinc-600 max-w-xs">
              <p class="line-clamp-2 text-xs">{{ excuse.reason }}</p>
            </td>
            <td class="px-4 py-3">
              <ExcuseStatusTag :status="excuse.status" />
            </td>
            <td class="px-4 py-3 text-right">
              <RouterLink v-if="excuse.status === 'pending'"
                :to="{ name: 'EditExcuseRequest', params: { excuseId: excuse.id } }"
                class="cursor-pointer px-2.5 py-1 rounded text-xs font-medium text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition">
                Edit
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
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
  </div>
</template>
