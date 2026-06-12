import { ref } from 'vue'
import type { Engagement, BusinessSession, StoreEngagementPayload } from '../types'
import type { PaginatedResponse } from '@/types'
import {
  getEngagements,
  createEngagement,
  deleteEngagement,
  getBusinessSessions,
  enrollCohortInBusinessSession,
  removeCohortFromBusinessSession,
} from '../services/schedulingService'

export function useCalendarTimeline() {
  const engagements = ref<Engagement[]>([])
  const businessSessions = ref<BusinessSession[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Track pagination state criteria
  const paginationMeta = ref<PaginatedResponse<Engagement>['meta'] | null>(null)

  // Cache the active query parameters locally for seamless mutation refreshes
  const activeFilters = ref<{
    cohortId?: number
    staffId?: number
    dateFrom?: string
    dateTo?: string
    page?: number
    type?: string
  }>({})

  /**
   * Load engagements filtered by timeline windows and explicit page parameters
   */
  async function loadTimeline(
    filters: {
      cohortId?: number
      staffId?: number
      dateFrom?: string
      dateTo?: string
      type?: string
      page?: number
    } = {},
  ) {
    isLoading.value = true
    error.value = null

    // Merge new filters with existing cached parameters to maintain state continuity
    activeFilters.value = {
      ...activeFilters.value,
      ...filters,
    }

    try {
      const paginatedData = await getEngagements({
        cohort_id: activeFilters.value.cohortId,
        staff_id: activeFilters.value.staffId,
        date_from: activeFilters.value.dateFrom || undefined,
        date_to: activeFilters.value.dateTo || undefined,
        page: activeFilters.value.page || 1,
        engageable_type: activeFilters.value.type,
      })

      // Unpack data array from metadata shell
      engagements.value = paginatedData.data
      paginationMeta.value = paginatedData.meta
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Change page wrapper shortcut
   */
  async function changePage(pageNumber: number) {
    await loadTimeline({ page: pageNumber })
  }

  /**
   * Synchronize the master list of standalone global cross-track business event blocks
   */
  async function loadBusinessSessions() {
    isLoading.value = true
    error.value = null
    try {
      businessSessions.value = await getBusinessSessions()
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Book a brand new engagement slot and immediately execute a timeline refresh
   */
  async function bookSession(payload: StoreEngagementPayload, contextCohortId?: number) {
    isLoading.value = true
    error.value = null
    try {
      await createEngagement(payload)
      // Reset back to page 1 on fresh creations to surface the new block immediately
      await loadTimeline({ cohortId: contextCohortId, page: 1 })
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * Clear an engagement entity out of operational calendar cells
   */
  async function cancelSession(engagementId: number, contextCohortId?: number) {
    isLoading.value = true
    error.value = null
    try {
      await deleteEngagement(engagementId)
      await loadTimeline({ cohortId: contextCohortId })
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * Link an entire cohort into a broader cross-track business session scenario
   */
  async function joinBusinessSession(businessSessionId: number, cohortId: number) {
    isLoading.value = true
    error.value = null
    try {
      await enrollCohortInBusinessSession(businessSessionId, cohortId)
      await Promise.all([loadBusinessSessions(), loadTimeline({ cohortId })])
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * Remove a cohort tracking frame from cross-track business event logs
   */
  async function leaveBusinessSession(businessSessionId: number, cohortId: number) {
    isLoading.value = true
    error.value = null
    try {
      await removeCohortFromBusinessSession(businessSessionId, cohortId)
      await Promise.all([loadBusinessSessions(), loadTimeline({ cohortId })])
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  return {
    engagements,
    businessSessions,
    paginationMeta,
    isLoading,
    error,
    loadTimeline,
    changePage,
    loadBusinessSessions,
    bookSession,
    cancelSession,
    joinBusinessSession,
    leaveBusinessSession,
  }
}
