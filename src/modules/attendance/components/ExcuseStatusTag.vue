<script setup lang="ts">
import type { ExcuseStatus } from '../types'

const props = defineProps<{ status: ExcuseStatus | null }>()

const config: Record<ExcuseStatus, { label: string; classes: string; icon: string }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-warning text-warning-content border-warning-border',
    icon: 'pi pi-clock',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-success text-success-content border-success-border',
    icon: 'pi pi-check-circle',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-danger text-danger-content border-danger-border',
    icon: 'pi pi-times-circle',
  },
  none: {
    label: 'None',
    classes: 'bg-zinc-100 text-zinc-400 border-zinc-200',
    icon: 'pi pi-minus',
  },
}
</script>

<template>
  <span
    v-if="props.status"
    :class="[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
      config[props.status].classes,
    ]"
  >
    <i :class="config[props.status].icon" style="font-size: 0.65rem" />
    {{ config[props.status].label }}
  </span>
  <span v-else class="text-zinc-400 text-xs">—</span>
</template>
