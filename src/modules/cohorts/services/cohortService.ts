import { api, type ApiResponse } from '@/utils/api'
import type {
  Track,
  Cohort,
  LabGroup,
  CohortStudent,
  StoreCohortPayload,
  UpdateCohortPayload,
  StoreLabGroupPayload,
  UpdateTrackPayload,
  StoreTrackPayload,
  TrackAdminCandidate,
  CohortAdmin,
} from '../types'

/**
 * Fetch all tracks in the branch. Maps to Route::get('tracks').
 * Visible to all roles; mutations below are branch_manager only (enforced server-side, SEC-3).
 */
export async function getTracks(): Promise<Track[]> {
  try {
    const response = await api.get<ApiResponse<Track[]>>('/tracks')
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve track registry: ' + err.message)
  }
}

/**
 * Provision a brand new track within the branch (branch_manager only)
 */
export async function createTrack(data: StoreTrackPayload): Promise<Track> {
  try {
    const response = await api.post<ApiResponse<Track>>('/tracks', data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to create track configuration: ' + err.message)
  }
}

/**
 * Update attributes on an existing track (branch_manager only)
 */
export async function updateTrack(trackId: number, data: UpdateTrackPayload): Promise<Track> {
  try {
    const response = await api.patch<ApiResponse<Track>>(`/tracks/${trackId}`, data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to modify track configuration: ' + err.message)
  }
}

/**
 * Fetch a list of all cohorts across the system with optional filters
 * Function maps to Route::get('cohorts') and Route::get('tracks/{track}/cohorts')
 */
export async function getCohorts(
  filters: { trackId?: number; is_active?: boolean; include_meta?: boolean } = {},
): Promise<Cohort[]> {
  try {
    let endpoint = '/cohorts'
    const queryParams = new URLSearchParams()

    if (filters.trackId) {
      endpoint = `/tracks/${filters.trackId}/cohorts`
    }
    if (filters.is_active !== undefined) {
      queryParams.append('is_active', filters.is_active ? '1' : '0')
    }
    if (filters.include_meta) {
      queryParams.append('include_meta', '1')
    }

    const queryString = queryParams.toString()
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint

    const response = await api.get<ApiResponse<Cohort[]>>(fullUrl)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve cohort rosters: ' + err.message)
  }
}

/**
 * Provision a brand new cohort underneath a specific track context
 */
export async function createCohort(trackId: number, data: StoreCohortPayload): Promise<Cohort> {
  try {
    const response = await api.post<ApiResponse<Cohort>>(`/tracks/${trackId}/cohorts`, data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to create cohort matrix configuration: ' + err.message)
  }
}

/**
 * Update attributes or lifecycle adjustments on an active cohort
 */
export async function updateCohort(
  trackId: number,
  cohortId: number,
  data: UpdateCohortPayload,
): Promise<Cohort> {
  try {
    const response = await api.patch<ApiResponse<Cohort>>(
      `/tracks/${trackId}/cohorts/${cohortId}`,
      data,
    )
    return response.data
  } catch (err: any) {
    throw new Error('Failed to modify cohort configurations: ' + err.message)
  }
}

/**
 * Retrieve sub-divided lab groups attached to a target cohort window
 */
export async function getLabGroups(
  cohortId: number,
  includeStudents: boolean = false,
): Promise<LabGroup[]> {
  try {
    const endpoint = `/cohorts/${cohortId}/lab-groups${includeStudents ? '?include_students=1' : ''}`
    const response = await api.get<ApiResponse<LabGroup[]>>(endpoint)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to process lab group extractions: ' + err.message)
  }
}

/**
 * Provision a new sub-divided lab group container within a cohort context
 */
export async function createLabGroup(
  cohortId: number,
  data: StoreLabGroupPayload,
): Promise<LabGroup> {
  try {
    const response = await api.post<ApiResponse<LabGroup>>(`/cohorts/${cohortId}/lab-groups`, data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to deploy lab group allocation: ' + err.message)
  }
}

/**
 * Unbind an existing lab group and release its students back to unassigned states
 */
export async function deleteLabGroup(labGroupId: number): Promise<void> {
  try {
    await api.delete<void>(`/lab-groups/${labGroupId}`)
  } catch (err: any) {
    throw new Error('Failed to purge target lab group workspace: ' + err.message)
  }
}

/**
 * Extract comprehensive student registers matching specific filtering scopes
 */
export async function getCohortStudents(
  cohortId: number,
  unassignedOnly: boolean = false,
): Promise<CohortStudent[]> {
  try {
    const endpoint = `/cohorts/${cohortId}/students${unassignedOnly ? '?unassigned_only=1' : ''}`
    const response = await api.get<ApiResponse<CohortStudent[]>>(endpoint)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve cohort profile indexes: ' + err.message)
  }
}

/**
 * Attach a single student into a localized lab group matrix bucket
 */
export async function attachStudentToGroup(labGroupId: number, studentId: number): Promise<void> {
  try {
    await api.post<void>(`/lab-groups/${labGroupId}/students`, { student_id: studentId })
  } catch (err: any) {
    throw new Error('Failed to process student allocation assignment: ' + err.message)
  }
}

/**
 * Detach a student from their current lab group layout matrix assignment
 */
export async function detachStudentFromGroup(labGroupId: number, studentId: number): Promise<void> {
  try {
    await api.delete<void>(`/lab-groups/${labGroupId}/students/${studentId}`)
  } catch (err: any) {
    throw new Error('Failed to drop student allocation association: ' + err.message)
  }
}

/**
 * List all Track Admin users eligible for assignment.
 * Maps to GET /users/track-admins
 */
export async function getTrackAdminCandidates(): Promise<TrackAdminCandidate[]> {
  try {
    const response = await api.get<ApiResponse<TrackAdminCandidate[]>>('/users/track-admins')
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve track admin candidates: ' + err.message)
  }
}

/**
 * List Track Admins currently assigned to a cohort.
 * Maps to GET /cohorts/{cohortId}/admins
 */
export async function getCohortAdmins(cohortId: number): Promise<CohortAdmin[]> {
  try {
    const response = await api.get<ApiResponse<CohortAdmin[]>>(
      `/users/track-admins?cohort=${cohortId}`,
    )
    return response.data
  } catch (err: any) {
    throw new Error('Failed to retrieve assigned cohort admins: ' + err.message)
  }
}

/**
 * Assign a Track Admin (by staff id) to a cohort (branch_manager only, LC-2).
 * Maps to POST /cohorts/{cohortId}/admins/{staffId}
 */
export async function assignCohortAdmin(cohortId: number, staffId: number): Promise<void> {
  try {
    await api.post<void>(`/cohorts/${cohortId}/assign-admin/${staffId}`, {})
  } catch (err: any) {
    throw new Error('Failed to assign track admin to cohort: ' + err.message)
  }
}

/**
 * Unassign a Track Admin (by staff id) from a cohort (branch_manager only).
 * Maps to DELETE /cohorts/{cohortId}/admins/{staffId}
 */
export async function unassignCohortAdmin(cohortId: number, staffId: number): Promise<void> {
  try {
    await api.post<void>(`/cohorts/${cohortId}/unassign-admin/${staffId}`, {})
  } catch (err: any) {
    throw new Error('Failed to unassign track admin from cohort: ' + err.message)
  }
}
