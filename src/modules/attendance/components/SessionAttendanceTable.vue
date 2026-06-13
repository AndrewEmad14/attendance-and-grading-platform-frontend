<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { EngagementAttendanceEntry } from '../types.ts'
import { attendanceApi } from '../api.ts'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'
import ExcuseStatusTag from './ExcuseStatusTag.vue'

const props = defineProps<{ engagementId: number }>()

const roster = ref<EngagementAttendanceEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const stats = computed(() => ({
  present: roster.value.filter(r => r.attendance_status === 'present').length,
  absent: roster.value.filter(r => r.attendance_status === 'absent').length,
  excused: roster.value.filter(r => r.attendance_status === 'excused').length,
  total: roster.value.length,
}))

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.engagementAttendance(props.engagementId)
    roster.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Failed to load roster'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.engagementId, load)

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

import { computed } from 'vue'
</script>

<template>
  <div class="space-y-4">
    <!-- Stats row -->
    <div v-if="!loading && roster.length" class="grid grid-cols-3 gap-3">
      <div class="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
        <p class="text-2xl font-bold text-emerald-700">{{ stats.present }}</p>
        <p class="text-xs text-emerald-600 mt-0.5">Present</p>
      </div>
      <div class="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
        <p class="text-2xl font-bold text-red-700">{{ stats.absent }}</p>
        <p class="text-xs text-red-600 mt-0.5">Absent</p>
      </div>
      <div class="rounded-lg bg-sky-50 border border-sky-100 p-3 text-center">
        <p class="text-2xl font-bold text-sky-700">{{ stats.excused }}</p>
        <p class="text-xs text-sky-600 mt-0.5">Excused</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="n in 8" :key="n" class="h-10 rounded bg-zinc-100 animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Table -->
    <div v-else-if="roster.length" class="overflow-x-auto rounded-lg border border-zinc-200">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Student</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Arrived</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Left</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Excuse</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="entry in roster" :key="entry.student.id" class="hover:bg-zinc-50 transition-colors">
            <td class="px-4 py-2.5 font-medium text-zinc-800">{{ entry.student.name }}</td>
            <td class="px-4 py-2.5">
              <AttendanceStatusBadge :status="entry.attendance_status" />
            </td>
            <td class="px-4 py-2.5 text-zinc-500 tabular-nums">{{ formatTime(entry.arrived_at) }}</td>
            <td class="px-4 py-2.5 text-zinc-500 tabular-nums">{{ formatTime(entry.left_at) }}</td>
            <td class="px-4 py-2.5">
              <ExcuseStatusTag :status="entry.excuse_status" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-400">
      No roster data for this session.
    </div>
  </div>
</template>