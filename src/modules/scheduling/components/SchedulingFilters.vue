<script setup lang="ts">
import { ref, watch } from 'vue'
import Select from 'primevue/select'
import type { EngagementType } from '../types'

interface FilterState {
  type: EngagementType | null
  staffId: number | null
}

const emit = defineEmits<{
  (e: 'filter-change', payload: FilterState): void
}>()

const activeType = ref<EngagementType | null>(null)
const activeStaffId = ref<number | null>(null)

const typeOptions = ref<{ label: string; value: EngagementType | null }[]>([
  { label: 'All Session Types', value: null },
  { label: 'Lectures', value: 'lecture' },
  { label: 'Labs', value: 'lab' },
  { label: 'Business Sessions', value: 'business_session' }
])

// Mock roster mapping (replace with a real staff endpoint fetch if available)
const instructorOptions = ref([
  { label: 'Test 1', value: null },
  { label: 'Test 2', value: 1 },
  { label: 'Test 3', value: 2 },
  { label: 'Test 4', value: 3 }
])

watch([activeType, activeStaffId], () => {
  emit('filter-change', {
    type: activeType.value,
    staffId: activeStaffId.value
  })
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-50 p-4 border border-surface-200 rounded-xl w-full">
    <div class="flex flex-col gap-1 w-full">
      <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Filter By Type</label>
      <Select 
        v-model="activeType" 
        :options="typeOptions" 
        optionLabel="label" 
        optionValue="value" 
        class="w-full bg-white text-xs h-9 min-h-0 items-center" 
      />
    </div>

    <div class="flex flex-col gap-1 w-full">
      <label class="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Filter By Instructor</label>
      <Select 
        v-model="activeStaffId" 
        :options="instructorOptions" 
        optionLabel="label" 
        optionValue="value" 
        class="w-full bg-white text-xs h-9 min-h-0 items-center" 
      />
    </div>
  </div>
</template>