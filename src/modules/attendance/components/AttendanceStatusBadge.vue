<script setup lang="ts">
import type { AttendanceStatus } from '../types'

const props = defineProps<{ status: AttendanceStatus }>()

const config: Record<AttendanceStatus, { label: string; classes: string }> = {
  present: { label: 'Present', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  absent: { label: 'Absent', classes: 'bg-red-100 text-red-800 border-red-200' },
  excused: { label: 'Excused', classes: 'bg-sky-100 text-sky-800 border-sky-200' },
  upcoming: { label: 'Upcoming', classes: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
}
</script>

<template>
  <span
    :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', config[props.status].classes]">
    {{ config[props.status].label }}
  </span>
</template>
