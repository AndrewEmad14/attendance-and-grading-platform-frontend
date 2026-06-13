import { ref } from 'vue'
import type { BillingSummary, StaffBillingRow, PaginatedStaffBilling } from '../types'
import { getBillingRollup, getInstructorBilling } from '../services/billingService'

export function useBillingSummary() {
  const summary = ref<BillingSummary | null>(null)
  const staffPagination = ref<Omit<PaginatedStaffBilling, 'data'> | null>(null)
  const staffRows = ref<StaffBillingRow[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load one page of billing rollup data, then batch-fetch per-instructor
   * detail calls to hydrate track_name and delivered_hours for each row.
   */
  async function loadPage(page: number = 1, perPage: number = 10) {
    isLoading.value = true
    error.value = null
    try {
      const rollup = await getBillingRollup(page, perPage)

      summary.value = rollup.summary
      const { data, ...pagination } = rollup.by_staff
      staffPagination.value = pagination

      // Batch-fetch per-instructor detail for track_name + delivered_hours.
      // Promise.all ensures all requests fire concurrently for performance.
      const detailResults = await Promise.all(
        data.map((row) =>
          getInstructorBilling(row.staff_profile_id).catch(() => null),
        ),
      )

      staffRows.value = data.map((row, idx) => {
        const detail = detailResults[idx]
        // Extract the first engagement's track_name; if multiple tracks exist
        // the first is used as the primary track for display purposes.
        const firstEngagement = detail?.engagements?.data?.[0]
        const delivered_hours = detail?.engagements?.data?.reduce(
          (sum, e) => sum + (e.delivered_hours ?? e.scheduled_hours),
          0,
        ) ?? row.scheduled_hours

        return {
          ...row,
          track_name: firstEngagement?.track_name ?? '—',
          delivered_hours,
        }
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to load billing data.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    summary,
    staffRows,
    staffPagination,
    isLoading,
    error,
    loadPage,
  }
}
