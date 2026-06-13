<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCalendarTimeline } from '../composables/useCalendarTimeline'
import { updateEngagement } from '../services/schedulingService'
import type { Engagement } from '../types'
import TimelineCalendar from './TimelineCalendar.vue'
import SchedulingFilters from './SchedulingFilters.vue'
import EngagementFormModal from './EngagementFormModal.vue'
import ContentCard from '@/components/structural/ContentCard.vue'

const {
  engagements,
  paginationMeta,
  isLoading,
  error,
  loadTimeline,
  changePage,
  bookSession,
  cancelSession,
} = useCalendarTimeline()

const isModalOpen = ref(false)
const targetEditRecord = ref<Engagement | null>(null)

// Current filtration layer tracking metrics
const filterState = ref<{ type: string | null; staffId: number | null }>({
  type: null,
  staffId: null,
})

async function syncTimelineMatrix() {
  await loadTimeline({
    type: filterState.value.type || undefined,
    staffId: filterState.value.staffId || undefined,
  })
}

watch(
  [() => filterState],
  async () => {
    await syncTimelineMatrix()
  },
  { deep: true, immediate: true },
)

function openCreateModal() {
  targetEditRecord.value = null
  isModalOpen.value = true
}

function openEditModal(record: Engagement) {
  targetEditRecord.value = record
  isModalOpen.value = true
}

async function handleSaveEngagement(payload: any) {
  isLoading.value = true
  try {
    if (payload.id) {
      // Execute the PATCH call directly for scheduling shifts
      await updateEngagement(payload.id, payload)
      await syncTimelineMatrix()
    } else {
      await bookSession(payload)
    }
    isModalOpen.value = false
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function handleCancel(id: number) {
  if (confirm('Are you sure you want to cancel this engagement booking slot?')) {
    await cancelSession(id)
  }
}

function handleFilterChange(newFilters: any) {
  filterState.value = newFilters
}
</script>

<template>
  <div class="space-y-4 w-full">
    <SchedulingFilters @filter-change="handleFilterChange" />

    <ContentCard
      title="Cohort Timeline Matrix"
      subtitle="Manage scheduled allocations and session parameters for the active tracking window"
    >
      <template #headerAction>
        <button
          type="button"
          @click="openCreateModal"
          class="btn btn-sm bg-primary text-white hover:bg-primary-hover border-none"
        >
          <i class="pi pi-plus text-xs mr-1"></i> Book Session
        </button>
      </template>

      <div v-if="isLoading" class="flex justify-center py-6">
        <i class="pi pi-spin pi-spinner text-surface-400 text-xl"></i>
      </div>

      <div v-else-if="error" class="p-3 bg-danger/10 text-danger rounded-lg text-xs">
        {{ error }}
      </div>

      <TimelineCalendar
        v-else
        :engagements="engagements"
        :meta="paginationMeta"
        :show-actions="true"
        @cancel="handleCancel"
        @edit="openEditModal"
        @page-change="changePage"
      >
      </TimelineCalendar>
    </ContentCard>

    <EngagementFormModal
      v-model:visible="isModalOpen"
      :engagement="targetEditRecord"
      @save="handleSaveEngagement"
    />
  </div>
</template>
