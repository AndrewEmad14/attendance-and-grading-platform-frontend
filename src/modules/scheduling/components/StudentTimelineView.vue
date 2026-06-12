<script setup lang="ts">
import { onMounted } from 'vue'
import { useCalendarTimeline } from '../composables/useCalendarTimeline'
import TimelineCalendar from './TimelineCalendar.vue'
import ContentCard from '@/components/structural/ContentCard.vue'

// cohortContext removed completely; we rely purely on token scoping
const { engagements, paginationMeta, isLoading, error, loadTimeline, changePage } = useCalendarTimeline()

onMounted(async () => {
  // Execute an open request. The backend scopes the returned records via the auth token.
  await loadTimeline()
})
</script>

<template>
  <div class="w-full">
    <ContentCard 
      title="My Academic Schedule" 
      subtitle="Personal ledger of upcoming lectures, group lab allocations, and cross-track sessions"
    >
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
        @page-change="changePage"
      />
    </ContentCard>
  </div>
</template>