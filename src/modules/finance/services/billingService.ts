import { api } from '@/utils/api'
import type { BillingRollupResponse, InstructorBillingDetail } from '../types'

/**
 * Fetch the branch-wide billing rollup summary and paginated staff breakdown.
 * Maps to GET /billing/rollup
 */
export async function getBillingRollup(page: number = 1, perPage: number = 10): Promise<BillingRollupResponse> {
  try {
    return await api.get<BillingRollupResponse>(`/billing/rollup?page=${page}&per_page=${perPage}`)
  } catch (err: any) {
    throw new Error('Failed to retrieve billing rollup data: ' + err.message)
  }
}

/**
 * Fetch detailed per-instructor billing including paginated engagements.
 * Maps to GET /billing/instructors/{staffProfileId}?page=N&per_page=N
 * Used for both the rollup row enrichment and the detail page.
 */
export async function getInstructorBilling(
  staffProfileId: number,
  page: number = 1,
  perPage: number = 15,
): Promise<InstructorBillingDetail> {
  try {
    return await api.get<InstructorBillingDetail>(
      `/billing/instructors/${staffProfileId}?page=${page}&per_page=${perPage}`,
    )
  } catch (err: any) {
    throw new Error(`Failed to retrieve billing for instructor ${staffProfileId}: ` + err.message)
  }
}
