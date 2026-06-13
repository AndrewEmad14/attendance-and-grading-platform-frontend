<script setup lang="ts">
import ContentCard from '@/components/structural/ContentCard.vue'
import type { Cohort } from '@/modules/cohorts/types'

defineProps<{
  cohorts: Cohort[]
  loading: boolean
  selectedCohortId: number | null
}>()

const emit = defineEmits<{
  (e: 'select', cohortId: number): void
}>()
</script>

<template>
  <ContentCard title="My Cohorts"
    subtitle="Cohorts you manage. Select one to configure its lab groups and business sessions.">
    <div v-if="loading" class="py-8 flex items-center justify-center text-surface-400">
      <i class="pi pi-spin pi-spinner text-xl"></i>
    </div>

    <div v-else-if="cohorts.length === 0" class="py-8 text-center text-sm text-surface-400 italic">
      No cohorts assigned to you yet.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <div v-for="cohort in cohorts" :key="cohort.id" @click="emit('select', cohort.id)"
        class="cursor-pointer rounded-lg border p-4 transition-all" :class="selectedCohortId === cohort.id
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
          ">
        <div class="flex items-center justify-between gap-2">
          <h4 class="font-bold text-surface-900 text-sm tracking-tight">
            {{ cohort.track?.name ? `${cohort.track.name} — ` : '' }}Intake #{{ cohort.number }}
          </h4>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0" :class="cohort.is_active ? 'bg-success/10 text-success-content' : 'bg-surface-100 text-surface-500'
            ">
            {{ cohort.is_active ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div v-if="cohort.students_count !== undefined" class="mt-2 text-xs text-surface-500">
          <i class="pi pi-users text-[10px] mr-1"></i>{{ cohort.students_count }} students
        </div>
      </div>
    </div>
  </ContentCard>
</template>
