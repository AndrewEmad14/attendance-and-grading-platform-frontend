<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Engagement } from '../types'
import { attendanceApi } from '../api'
import SessionListItem from './SessionListItem.vue'

const props = defineProps<{ selectedId?: number }>()
const emit = defineEmits<{ (e: 'select', session: Engagement): void }>()

const sessions = ref<Engagement[]>([])
const meta = ref<any>(null)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

async function load(p = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.mySessions({ page: p, per_page: 15 })
    sessions.value = res.data
    meta.value = res.meta
    page.value = p
  } catch (e: any) {
    error.value = e.message || 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div
        v-for="n in 5"
        :key="n"
        class="rounded-lg border border-zinc-200 bg-zinc-50 h-20 animate-pulse"
      />
    </template>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Empty -->
    <div
      v-else-if="!sessions.length"
      class="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-400"
    >
      No sessions found.
    </div>

    <!-- List -->
    <template v-else>
      <SessionListItem
        v-for="session in sessions"
        :key="session.id"
        :session="session"
        :active="session.id === props.selectedId"
        @select="emit('select', session)"
      />
    </template>

    <!-- Pagination -->
    <div
      v-if="meta && meta.last_page > 1"
      class="flex items-center justify-between pt-2 text-xs text-zinc-500"
    >
      <button
        :disabled="page === 1"
        @click="load(page - 1)"
        class="px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition"
      >
        <i class="pi pi-chevron-left" />
      </button>
      <span>Page {{ meta.current_page }} of {{ meta.last_page }}</span>
      <button
        :disabled="page === meta.last_page"
        @click="load(page + 1)"
        class="px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition"
      >
        <i class="pi pi-chevron-right" />
      </button>
    </div>
  </div>
</template>
