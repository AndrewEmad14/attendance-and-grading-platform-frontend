<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { attendanceApi } from '../api'
import type { ExcuseRequest } from '../types'
import ExcuseRequestForm from '../components/ExcuseRequestForm.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
// Determine mode from route
const excuseId = route.params.id ? Number(route.params.id) : null
const isEdit = excuseId !== null
const engagementIdFromQuery = route.query.engagement_id ? Number(route.query.engagement_id) : null
const engagementLabelFromQuery = route.query.engagement_name
  ? `${route.query.engagement_name as string} — ${formatDate(route.query.engagement_date as string)}`
  : null

const excuse = ref<ExcuseRequest | null>(null)
const absentOptions = ref<{ id: number; name: string; date: string }[]>([])
const selectedEngagementId = ref<number | null>(engagementIdFromQuery)
const loading = ref(false)
const error = ref<string | null>(null)

const studentId = computed(() => auth.currentUser?.student_profile?.id)


onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    if (isEdit && excuseId) {
      excuse.value = (await attendanceApi.excuseRequest(excuseId)).data
    } else if (!engagementIdFromQuery && studentId.value) {
      // No engagement_id in query — load dropdown options
      absentOptions.value = (await attendanceApi.absentEngagements(studentId.value)).data
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load'
  } finally {
    loading.value = false
  }
})

function onDone() {
  router.push({ name: 'MyExcuses' })
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-8 space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="router.push({ name: 'MyExcuses' })"
        class="cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition">
        <i class="pi pi-arrow-left text-xs" />
      </button>
      <h1 class="text-lg font-semibold text-zinc-800">
        {{ isEdit ? 'Edit Excuse Request' : 'New Excuse Request' }}
      </h1>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-danger-border bg-danger p-4 text-sm text-danger-content">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 3" :key="n" class="h-12 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <template v-else>
      <!-- Engagement picker — only in create mode when no engagement_id in query -->
      <div v-if="!isEdit && !engagementIdFromQuery" class="space-y-1">
        <label class="block text-xs font-medium text-zinc-600">
          Session <span class="text-danger-content">*</span>
        </label>
        <div v-if="!absentOptions.length"
          class="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-400">
          No absent sessions without an existing excuse.
        </div>
        <select v-else v-model="selectedEngagementId"
          class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
          <option :value="null" disabled>Select a session…</option>
          <option v-for="opt in absentOptions" :key="opt.id" :value="opt.id">
            {{ opt.name }} — {{ formatDate(opt.date) }}
          </option>
        </select>
      </div>

      <!-- Form — shown in edit mode always, in create mode only when engagement is selected/provided -->
      <ExcuseRequestForm v-if="isEdit ? !!excuse : !!selectedEngagementId" :excuse="excuse ?? undefined"
        :engagement-id="selectedEngagementId ?? undefined" :engagement-label="engagementLabelFromQuery ?? undefined"
        @submitted="onDone" @cancel="router.push({ name: 'MyExcuses' })" />
    </template>
  </div>
</template>