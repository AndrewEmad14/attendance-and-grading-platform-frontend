import { api, type ApiResponse } from '@/utils/api'
import type { BusinessSession, StoreBusinessSessionPayload } from '../types'

/**
 * Business-session service layer. Kept separate from cohortService.ts because
 * business sessions are a cross-track concern (ATT-3): they exist independently
 * of any single cohort and are shared across track admins. Same error-wrapping
 * convention as cohortService — failures rethrow as Error('Failed to... ' + msg)
 * and are surfaced as toasts by the composable.
 */

/**
 * List every business session in the branch.
 * Maps to GET /business-sessions (visible to all roles).
 * Pass includeCohorts to eager-load the `cohorts` relation so the UI can show
 * which cohorts each session is already attached to.
 */
export async function getBusinessSessions(
  includeCohorts: boolean = false,
): Promise<BusinessSession[]> {
  try {
    const endpoint = `/business-sessions${includeCohorts ? '?include=cohorts' : ''}`
    const response = await api.get<ApiResponse<BusinessSession[]>>(endpoint)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve business sessions: ' + err.message)
  }
}

/**
 * Fetch a single business session, optionally with its attached cohorts.
 * Maps to GET /business-sessions/{businessSession}.
 */
export async function getBusinessSession(
  sessionId: number,
  includeCohorts: boolean = false,
): Promise<BusinessSession> {
  try {
    const endpoint = `/business-sessions/${sessionId}${includeCohorts ? '?include=cohorts' : ''}`
    const response = await api.get<ApiResponse<BusinessSession>>(endpoint)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve business session: ' + err.message)
  }
}

/**
 * Create a new business session (track_admin or branch_manager).
 * Maps to POST /business-sessions. Body is { name } only.
 * The created session is shared — it becomes available to all track admins.
 */
export async function createBusinessSession(
  data: StoreBusinessSessionPayload,
): Promise<BusinessSession> {
  try {
    const response = await api.post<ApiResponse<BusinessSession>>('/business-sessions', data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to create business session: ' + err.message)
  }
}

/**
 * Attach (enroll) a business session to a cohort.
 * Maps to POST /business-sessions/{businessSession}/cohorts with body { cohort_id }.
 */
export async function enrollCohortInSession(sessionId: number, cohortId: number): Promise<void> {
  try {
    await api.post<void>(`/business-sessions/${sessionId}/cohorts`, { cohort_id: cohortId })
  } catch (err: any) {
    throw new Error('Failed to attach business session to cohort: ' + err.message)
  }
}

/**
 * Detach a business session from a cohort.
 * Maps to DELETE /business-sessions/{businessSession}/cohorts/{cohortId}.
 */
export async function removeCohortFromSession(sessionId: number, cohortId: number): Promise<void> {
  try {
    await api.delete<void>(`/business-sessions/${sessionId}/cohorts/${cohortId}`)
  } catch (err: any) {
    throw new Error('Failed to detach business session from cohort: ' + err.message)
  }
}
