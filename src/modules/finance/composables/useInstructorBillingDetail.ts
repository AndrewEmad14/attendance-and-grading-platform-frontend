import { ref } from 'vue'
import type { InstructorBillingDetail } from '../types'
import { getInstructorBilling } from '../services/billingService'

export function useInstructorBillingDetail() {
  const detail = ref<InstructorBillingDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load one page of engagement data for the given instructor.
   * On page changes only engagements are re-fetched; the instructor
   * identity and payout_summary from the first load remain intact.
   */
  async function loadDetail(staffProfileId: number, page: number = 1, perPage: number = 15) {
    isLoading.value = true
    error.value = null
    try {
      const response = await getInstructorBilling(staffProfileId, page, perPage)

      if (detail.value && page > 1) {
        // On page change keep identity + payout_summary stable, only swap engagements
        detail.value = { ...detail.value, engagements: response.engagements }
      } else {
        detail.value = response
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load instructor billing detail.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    detail,
    isLoading,
    error,
    loadDetail,
  }
}
