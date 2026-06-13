import { ref, computed } from 'vue'
import {
  getTrackAdminCandidates,
  getCohortAdmins,
  assignCohortAdmin,
  unassignCohortAdmin,
} from '../services/cohortService'
import type { Cohort, CohortAdmin, TrackAdminCandidate } from '../types'
import { useCohortToast } from './useCohortToast'

/**
 * Owns the per-cohort admin assignment flow. On open it runs the agreed
 * two-call fetch (full candidate list + this cohort's current assignments),
 * then derives the assignable set client-side by staff id.
 */
export function useCohortAdmins() {
  const toast = useCohortToast()

  const cohort = ref<Cohort | null>(null)
  const assigned = ref<CohortAdmin[]>([])
  const candidates = ref<TrackAdminCandidate[]>([])
  const loading = ref(false)
  const mutatingStaffId = ref<number | null>(null)

  // Candidates not already assigned, compared on staff id.
  const available = computed(() => {
    const assignedStaffIds = new Set(assigned.value.map((a) => a.staff_profile_id))
    return candidates.value.filter((c) => !assignedStaffIds.has(c.staff_profile.id))
  })

  async function open(target: Cohort) {
    cohort.value = target
    loading.value = true
    assigned.value = []
    candidates.value = []
    try {
      const [allCandidates, current] = await Promise.all([
        getTrackAdminCandidates(),
        getCohortAdmins(target.id),
      ])
      candidates.value = allCandidates
      assigned.value = current
    } catch (err) {
      toast.failure('Admin load failed', err)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    cohort.value = null
    assigned.value = []
    candidates.value = []
  }

  async function assign(candidate: TrackAdminCandidate): Promise<void> {
    if (cohort.value === null) return
    mutatingStaffId.value = candidate.staff_profile.id
    try {
      await assignCohortAdmin(cohort.value.id, candidate.staff_profile.id)
      assigned.value.push({
        staff_profile_id: candidate.staff_profile.id,
        user_id: candidate.id,
        name: candidate.name,
        email: candidate.email,
      })
      toast.success('Admin assigned', candidate.name)
    } catch (err) {
      toast.failure('Assign failed', err)
    } finally {
      mutatingStaffId.value = null
    }
  }

  async function unassign(admin: CohortAdmin): Promise<void> {
    if (cohort.value === null) return
    mutatingStaffId.value = admin.staff_profile_id
    try {
      await unassignCohortAdmin(cohort.value.id, admin.staff_profile_id)
      assigned.value = assigned.value.filter((a) => a.staff_profile_id !== admin.staff_profile_id)
      toast.success('Admin unassigned', admin.name ?? '')
    } catch (err) {
      toast.failure('Unassign failed', err)
    } finally {
      mutatingStaffId.value = null
    }
  }

  return {
    cohort,
    assigned,
    candidates,
    available,
    loading,
    mutatingStaffId,
    open,
    reset,
    assign,
    unassign,
  }
}
