import { ref } from 'vue'
import type { Engagement, BusinessSession, StoreEngagementPayload } from '../types'
import {
  getEngagements,
  createEngagement,
  deleteEngagement,
  getBusinessSessions,
  enrollCohortInBusinessSession,
  removeCohortFromBusinessSession
} from '../services/schedulingService'

export function useCalendarTimeline() {
  const engagements = ref<Engagement[]>([])
  const businessSessions = ref<BusinessSession[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Track the user's active calendar timeline query parameters locally
  const activeDateFrom = ref<string | null>(null)
  const activeDateTo = ref<string | null>(null)

  /**
   * Load engagements filtered by an active calendar timeline block window
   */
  async function loadTimeline(filters: { cohortId?: number; staffId?: number; dateFrom?: string; dateTo?: string } = {}) {
    isLoading.value = true
    error.value = null
    
    // Cache active dates locally so subsequent mutations reuse the same window parameters
    if (filters.dateFrom) activeDateFrom.value = filters.dateFrom
    if (filters.dateTo) activeDateTo.value = filters.dateTo

    try {
      engagements.value = await getEngagements({
        cohort_id: filters.cohortId,
        staff_id: filters.staffId,
        date_from: activeDateFrom.value || undefined,
        date_to: activeDateTo.value || undefined
      })
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
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
      await loadTimeline({ cohortId: contextCohortId })
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
    isLoading,
    error,
    loadTimeline,
    loadBusinessSessions,
    bookSession,
    cancelSession,
    joinBusinessSession,
    leaveBusinessSession
  }
}