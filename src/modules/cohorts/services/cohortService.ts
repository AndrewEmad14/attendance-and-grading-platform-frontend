import { api, type ApiResponse } from '@/utils/api'
import type { 
  Cohort, 
  LabGroup, 
  CohortStudent, 
  StoreCohortPayload, 
  UpdateCohortPayload, 
  StoreLabGroupPayload 
} from '../types'

/**
 * Fetch a list of all cohorts across the system with optional filters
 * Function maps to Route::get('cohorts') and Route::get('tracks/{track}/cohorts')
 */
export async function getCohorts(filters: { trackId?: number; is_active?: boolean; include_meta?: boolean } = {}): Promise<Cohort[]> {
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
export async function updateCohort(trackId: number, cohortId: number, data: UpdateCohortPayload): Promise<Cohort> {
  try {
    const response = await api.patch<ApiResponse<Cohort>>(`/tracks/${trackId}/cohorts/${cohortId}`, data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to modify cohort configurations: ' + err.message)
  }
}

/**
 * Retrieve sub-divided lab groups attached to a target cohort window
 */
export async function getLabGroups(cohortId: number, includeStudents: boolean = false): Promise<LabGroup[]> {
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
export async function createLabGroup(cohortId: number, data: StoreLabGroupPayload): Promise<LabGroup> {
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
export async function getCohortStudents(cohortId: number, unassignedOnly: boolean = false): Promise<CohortStudent[]> {
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