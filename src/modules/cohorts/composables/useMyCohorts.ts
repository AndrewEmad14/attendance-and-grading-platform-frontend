import { ref } from 'vue'
import { getCohorts } from '../services/cohortService'
import type { Cohort } from '../types'
import { useCohortToast } from './useCohortToast'

/**
 * Owns the Track Admin's list of managed cohorts. Unlike the Branch Manager
 * flow (track -> cohort drill-down), a Track Admin lands directly on the
 * cohorts they're assigned to. We reuse GET /cohorts and rely on the server
 * to scope the result to the authenticated admin (SEC-3 / ACC-2) — no track
 * filter is sent. include_meta brings students_count and admins for the cards.
 */
export function useMyCohorts() {
  const toast = useCohortToast()

  const cohorts = ref<Cohort[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      cohorts.value = await getCohorts({ include_meta: true })
    } catch (err) {
      toast.failure('Cohort load failed', err)
    } finally {
      loading.value = false
    }
  }

  return { cohorts, loading, load }
}
