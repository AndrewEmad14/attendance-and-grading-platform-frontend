<script setup lang="ts">
import ContentCard from '@/components/structural/ContentCard.vue'
import type { Cohort, Track } from '@/modules/cohorts/types'

defineProps<{
  track: Track
  cohorts: Cohort[]
  loading: boolean
  togglingId: number | null
}>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', cohort: Cohort): void
  (e: 'toggle-status', cohort: Cohort): void
  (e: 'manage-admins', cohort: Cohort): void
}>()
</script>

<template>
  <ContentCard :title="`Cohorts — ${track.name}`" subtitle="At most one active cohort per track.">
    <template #headerAction>
      <button
        @click="emit('create')"
        class="px-3 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2"
      >
        <i class="pi pi-plus text-[10px]"></i>
        New Cohort
      </button>
    </template>

    <div v-if="loading" class="py-8 flex items-center justify-center text-surface-400">
      <i class="pi pi-spin pi-spinner text-xl"></i>
    </div>

    <div v-else-if="cohorts.length === 0" class="py-8 text-center text-sm text-surface-400 italic">
      No cohorts under this track yet.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="cohort in cohorts"
        :key="cohort.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-surface-200 bg-white p-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="font-bold text-surface-900 text-sm">Intake #{{ cohort.number }}</span>

          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            :class="
              cohort.is_active ? 'bg-success/10 text-success' : 'bg-surface-100 text-surface-500'
            "
          >
            {{ cohort.is_active ? 'Active' : 'Inactive' }}
          </span>

          <span v-if="cohort.students_count !== undefined" class="text-xs text-surface-500">
            <i class="pi pi-users text-[10px] mr-1"></i>{{ cohort.students_count }}
          </span>

          <span v-if="cohort.admins?.length" class="text-xs text-surface-500 truncate">
            <i class="pi pi-user text-[10px] mr-1"></i>{{ cohort.admins.length }} admin(s)
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="emit('manage-admins', cohort)"
            class="px-2.5 py-1.5 rounded text-xs font-medium text-surface-700 border border-surface-200 hover:bg-surface-50 transition-colors flex items-center gap-1.5"
          >
            <i class="pi pi-user-edit text-[10px]"></i>
            Admins
          </button>

          <button
            @click="emit('edit', cohort)"
            class="px-2.5 py-1.5 rounded text-xs font-medium text-surface-700 border border-surface-200 hover:bg-surface-50 transition-colors"
          >
            Edit
          </button>

          <button
            @click="emit('toggle-status', cohort)"
            :disabled="togglingId === cohort.id"
            class="px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="
              cohort.is_active
                ? 'text-danger border border-danger/30 hover:bg-danger/5'
                : 'text-white bg-primary hover:bg-primary/90'
            "
          >
            <i v-if="togglingId === cohort.id" class="pi pi-spin pi-spinner text-[10px]"></i>
            {{ cohort.is_active ? 'Deactivate' : 'Activate' }}
          </button>
        </div>
      </div>
    </div>
  </ContentCard>
</template>
