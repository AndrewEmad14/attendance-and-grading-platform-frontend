import { ref } from 'vue'
import { getCohorts, createCohort, updateCohort } from '../services/cohortService'
import type { Cohort, StoreCohortPayload, UpdateCohortPayload } from '../types'
import { useCohortToast } from './useCohortToast'

/**
 * Owns the cohort list for a single selected track. Because LC-1 (one active
 * cohort per track) is enforced server-side and may auto-deactivate a sibling,
 * any status-affecting write refetches the whole list so the UI never drifts
 * from server truth.
 */
export function useCohorts() {
  const toast = useCohortToast()

  const cohorts = ref<Cohort[]>([])
  const loading = ref(false)
  const togglingId = ref<number | null>(null)

  // The track whose cohorts are currently loaded; drives refetch targets.
  let currentTrackId: number | null = null

  async function load(trackId: number) {
    currentTrackId = trackId
    loading.value = true
    try {
      cohorts.value = await getCohorts({ trackId, include_meta: true })
    } catch (err) {
      toast.failure('Cohort load failed', err)
    } finally {
      loading.value = false
    }
  }

  function clear() {
    cohorts.value = []
    currentTrackId = null
  }

  async function create(trackId: number, payload: StoreCohortPayload): Promise<boolean> {
    try {
      await createCohort(trackId, payload)
      toast.success('Cohort created', `Intake #${payload.number}`)
      await load(trackId) // reflect server-side LC-1 side effects
      return true
    } catch (err) {
      toast.failure('Cohort create failed', err)
      return false
    }
  }

  async function update(
    trackId: number,
    cohortId: number,
    payload: UpdateCohortPayload,
  ): Promise<boolean> {
    try {
      const updated = await updateCohort(trackId, cohortId, payload)
      toast.success('Cohort updated', `Intake #${updated.number}`)
      await load(trackId)
      return true
    } catch (err) {
      toast.failure('Cohort update failed', err)
      return false
    }
  }

  async function toggleStatus(cohort: Cohort): Promise<void> {
    if (currentTrackId === null) return
    togglingId.value = cohort.id
    try {
      await updateCohort(currentTrackId, cohort.id, { is_active: !cohort.is_active })
      toast.success(
        cohort.is_active ? 'Cohort deactivated' : 'Cohort activated',
        `Intake #${cohort.number}`,
      )
      await load(currentTrackId)
    } catch (err) {
      toast.failure('Status change failed', err)
    } finally {
      togglingId.value = null
    }
  }

  return { cohorts, loading, togglingId, load, clear, create, update, toggleStatus }
}
