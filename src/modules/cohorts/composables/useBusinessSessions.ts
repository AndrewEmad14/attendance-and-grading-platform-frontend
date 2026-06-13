import { ref, computed } from 'vue'
import {
  getBusinessSessions,
  createBusinessSession,
  enrollCohortInSession,
  removeCohortFromSession,
} from '../services/businessSessionService'
import type { BusinessSession, StoreBusinessSessionPayload } from '../types'
import { useCohortToast } from './useCohortToast'

/**
 * Owns the business-session management surface for a single selected cohort.
 *
 * Business sessions are global/cross-track, so we load the full list (with
 * their attached cohorts eager-loaded) and derive — client-side, by the
 * current cohort id — which are already attached vs. still available. This
 * mirrors the useCohortAdmins pattern: one fetch, two derived sets.
 *
 * After any attach/detach we refetch so the derived sets stay aligned with
 * server truth rather than mutating the pivot locally.
 */
export function useBusinessSessions() {
  const toast = useCohortToast()

  const cohortId = ref<number | null>(null)
  const sessions = ref<BusinessSession[]>([])
  const loading = ref(false)
  // Tracks the session id currently being attached/detached, for per-row spinners.
  const mutatingSessionId = ref<number | null>(null)

  function isAttached(session: BusinessSession): boolean {
    if (cohortId.value === null) return false
    return (session.cohorts ?? []).some((c) => c.id === cohortId.value)
  }

  // Sessions already attached to the selected cohort.
  const attached = computed(() => sessions.value.filter(isAttached))

  // Sessions that exist but aren't attached to this cohort yet.
  const available = computed(() => sessions.value.filter((s) => !isAttached(s)))

  async function load(targetCohortId: number) {
    cohortId.value = targetCohortId
    loading.value = true
    try {
      sessions.value = await getBusinessSessions(true)
    } catch (err) {
      toast.failure('Business sessions load failed', err)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    cohortId.value = null
    sessions.value = []
  }

  /**
   * Create a shared session. On success it's immediately available to attach
   * to the current cohort (and to every other track admin). Refetch keeps the
   * eager-loaded cohorts relation consistent. Returns true so the caller can
   * close its modal only on success.
   */
  async function create(payload: StoreBusinessSessionPayload): Promise<boolean> {
    try {
      const created = await createBusinessSession(payload)
      toast.success('Business session created', created.name)
      if (cohortId.value !== null) await load(cohortId.value)
      return true
    } catch (err) {
      toast.failure('Business session create failed', err)
      return false
    }
  }

  async function attach(session: BusinessSession): Promise<void> {
    if (cohortId.value === null) return
    mutatingSessionId.value = session.id
    try {
      await enrollCohortInSession(session.id, cohortId.value)
      toast.success('Session attached', session.name)
      await load(cohortId.value)
    } catch (err) {
      toast.failure('Attach failed', err)
    } finally {
      mutatingSessionId.value = null
    }
  }

  async function detach(session: BusinessSession): Promise<void> {
    if (cohortId.value === null) return
    mutatingSessionId.value = session.id
    try {
      await removeCohortFromSession(session.id, cohortId.value)
      toast.success('Session detached', session.name)
      await load(cohortId.value)
    } catch (err) {
      toast.failure('Detach failed', err)
    } finally {
      mutatingSessionId.value = null
    }
  }

  return {
    cohortId,
    sessions,
    attached,
    available,
    loading,
    mutatingSessionId,
    load,
    reset,
    create,
    attach,
    detach,
  }
}
