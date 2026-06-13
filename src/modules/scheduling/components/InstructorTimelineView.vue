<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCalendarTimeline } from '../composables/useCalendarTimeline'
import { useAuthStore } from '@/stores/auth.ts'

import TimelineCalendar from './TimelineCalendar.vue'
import StatCard from '@/components/structural/StatCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'
import ContentCard from '@/components/structural/ContentCard.vue'

const auth = useAuthStore()
const { engagements, paginationMeta, isLoading, error, loadTimeline, changePage } =
  useCalendarTimeline()

const totalHours = computed(() => {
  return engagements.value.reduce((sum, item) => sum + item.scheduled_hours, 0)
})

onMounted(async () => {
  if (auth.currentUser?.id) {
    await loadTimeline({ staffId: auth.currentUser.id })
  }
})
</script>

<template>
  <div class="space-y-6 w-full">
    <DashboardGrid variant="uniform-four">
      <StatCard
        label="Total Delivered Scope"
        :value="`${totalHours} Hours`"
        trend-text="Current Engagement window metrics"
        trend-type="neutral"
      />
      <StatCard
        label="Booked Sessions"
        :value="paginationMeta?.total ?? engagements.length"
        trend-text="Total track blocks"
        trend-type="neutral"
      />
    </DashboardGrid>

    <ContentCard
      title="My Teaching Engagements"
      subtitle="Chronological log of lecture allocations, lab tracks, and operations"
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
