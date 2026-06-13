<script setup lang="ts">
import type { AttendanceStatus } from '../types'

const props = defineProps<{ status: AttendanceStatus }>()

const config: Record<AttendanceStatus, { label: string; classes: string }> = {
  present: { label: 'Present', classes: 'bg-success text-success-content border-success-border' },
  absent: { label: 'Absent', classes: 'bg-danger text-danger-content border-danger-border' },
  excused: { label: 'Excused', classes: 'bg-info text-info-content border-info-border' },
  upcoming: { label: 'Upcoming', classes: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
}
</script>

<template>
  <span
    :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', config[props.status].classes]">
    {{ config[props.status].label }}
  </span>
</template>
