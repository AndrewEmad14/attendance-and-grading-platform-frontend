<script setup lang="ts">
import { ref, watch } from 'vue'
import Select from 'primevue/select'
import type { EngagementType } from '../types'

interface FilterState {
  cohortId: number | null
  type: EngagementType | null
  staffId: number | null
}

const emit = defineEmits<{
  (e: 'filter-change', payload: FilterState): void
}>()

const activeCohortId = ref<number | null>(null)
const activeType = ref<EngagementType | null>(null)
const activeStaffId = ref<number | null>(null)

const cohortOptions = ref<{ label: string; value: number }[]>([])
const instructorOptions = ref<{ label: string; value: number | null }[]>([{ label: 'All Instructors', value: null }])

import { api } from '@/utils/api'
import { onMounted } from 'vue'

onMounted(async () => {
  try {
    const res = await api.get<{ data: any[] }>('/cohorts?per_page=100')
    cohortOptions.value = res.data.map(c => ({
      label: `${c.track?.name || 'Track'} - Cohort ${c.number}`,
      value: c.id
    }))
  } catch (err) {
    console.error('Failed to load cohorts', err)
  }
})

watch(activeCohortId, async (newVal) => {
  // Reset dependent filters
  activeType.value = null
  activeStaffId.value = null

  if (!newVal) {
    instructorOptions.value = [{ label: 'All Instructors', value: null }]
    return
  }

  try {
    const res = await api.get<{ data: { data: any[] } }>(`/users/instructors?cohort_id=${newVal}&per_page=100`)
    instructorOptions.value = [
      { label: 'All Instructors', value: null },
      ...(res.data?.data || []).map((i: any) => ({
        label: i.name,
        value: i.staff_profile?.id || i.id
      }))
    ]
  } catch (err) {
    console.error('Failed to load instructors', err)
  }
})

const typeOptions = ref<{ label: string; value: EngagementType | null }[]>([
  { label: 'All Session Types', value: null },
  { label: 'Lectures', value: 'lecture' },
  { label: 'Labs', value: 'lab' },
  { label: 'Business Sessions', value: 'business_session' },
])

watch([activeCohortId, activeType, activeStaffId], () => {
  emit('filter-change', {
    cohortId: activeCohortId.value,
    type: activeType.value,
    staffId: activeStaffId.value,
  })
})
</script>

<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-50 p-4 border border-surface-200 rounded-xl w-full"
  >
    <div class="flex flex-col gap-1 w-full">
      <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider"
        >Filter By Cohort <span class="text-danger-content">*</span></label
      >
      <Select
        v-model="activeCohortId"
        :options="cohortOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Cohort..."
        class="w-full bg-white text-xs h-9 min-h-0 items-center"
      />
    </div>

    <div class="flex flex-col gap-1 w-full">
      <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider"
        >Filter By Type</label
      >
      <Select
        v-model="activeType"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="All Session Types"
        :disabled="!activeCohortId"
        class="w-full bg-white text-xs h-9 min-h-0 items-center"
      />
    </div>

    <div class="flex flex-col gap-1 w-full">
      <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider"
        >Filter By Instructor</label
      >
      <Select
        v-model="activeStaffId"
        :options="instructorOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="All Instructors"
        :disabled="!activeCohortId"
        class="w-full bg-white text-xs h-9 min-h-0 items-center"
      />
    </div>
  </div>
</template>
