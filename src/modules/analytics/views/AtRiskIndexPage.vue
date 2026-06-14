<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ContentCard from '@/components/structural/ContentCard.vue'
import { getCohorts } from '@/modules/cohorts/services/cohortService'
import type { Cohort } from '@/modules/cohorts/types'

const router = useRouter()

const cohorts = ref<Cohort[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  isLoading.value = true
  error.value = null
  try {
    // Fetch all cohorts using the existing cohorts service
    cohorts.value = await getCohorts()
  } catch (err: any) {
    error.value = err.message || 'Failed to load cohorts.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Title -->
    <div>
      <div class="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        ANALYTICS <span class="mx-1 text-surface-300">&rsaquo;</span>
        <span class="text-surface-600 font-bold">AT-RISK STUDENTS</span>
      </div>
      <h2 class="text-2xl font-bold text-surface-900 mt-1">At-Risk Students</h2>
      <p class="text-sm text-surface-500 mt-0.5">
        Select a cohort to view its at-risk student breakdown.
      </p>
    </div>

    <!-- Loading Skeleton -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="i in 6"
          :key="i"
          class="h-24 bg-surface-100 border border-surface-200 animate-pulse rounded-lg"
        ></div>
      </div>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <div
        class="flex items-center gap-3 p-4 bg-danger border border-danger-border text-danger-content rounded-lg text-sm"
      >
        <i class="pi pi-exclamation-triangle text-lg text-danger-content"></i>
        <span>{{ error }}</span>
      </div>
    </template>

    <!-- Empty State -->
    <template v-else-if="cohorts.length === 0">
      <div class="flex flex-col items-center justify-center py-20 text-center text-surface-400">
        <i class="pi pi-inbox text-5xl mb-4 text-surface-300"></i>
        <p class="text-base font-semibold">No cohorts found</p>
        <p class="text-sm mt-1">There are no active cohorts to select from.</p>
      </div>
    </template>

    <!-- Cohort Cards Grid -->
    <template v-else>
      <ContentCard title="Select a Cohort">
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="cohort in cohorts"
            :key="cohort.id"
            class="group relative bg-white border border-surface-200 rounded-lg p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
            @click="router.push(`/analytics/cohorts/${cohort.id}/at-risk`)"
          >
            <!-- Faded background icon -->
            <i
              class="pi pi-users absolute right-4 bottom-3 text-slate-300/40 pointer-events-none"
              style="font-size: 3.5rem; line-height: 1;"
            ></i>

            <div class="relative z-10">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
                  Cohort #{{ cohort.number }}
                </span>
                <span
                  class="badge badge-xs font-semibold px-2 py-1"
                  :class="
                    cohort.is_active
                      ? 'bg-success text-success-content border-success-border'
                      : 'bg-surface-100 text-surface-500 border-surface-200'
                  "
                >
                  {{ cohort.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <div class="font-bold text-surface-900 text-base group-hover:text-primary transition-colors truncate">
                {{ cohort.track?.name ?? `Track ${cohort.track_id}` }}
              </div>

              <div v-if="cohort.students_count !== undefined" class="text-xs text-surface-500 mt-1">
                {{ cohort.students_count }} students enrolled
              </div>
            </div>

            <div class="absolute bottom-4 right-4">
              <i class="pi pi-arrow-right text-xs text-surface-300 group-hover:text-primary transition-colors"></i>
            </div>
          </div>
        </div>
      </ContentCard>
    </template>
  </div>
</template>
