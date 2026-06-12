import { api, type ApiResponse } from '@/utils/api'
import type {
  Engagement,
  BusinessSession,
  StoreEngagementPayload,
  UpdateEngagementPayload,
  StoreBusinessSessionPayload,
} from '../types'

/**
 * Extract active timeline engagements bounded by parameters or specific types
 */
export async function getEngagements(
  filters: {
    cohort_id?: number
    staff_id?: number
    type?: string
    engageable_id?: number
    date_from?: string
    date_to?: string
  } = {},
): Promise<Engagement[]> {
  try {
    const queryParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/engagements?${queryString}` : '/engagements'

    const response = await api.get<ApiResponse<Engagement[]>>(endpoint)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to load system timeline windows: ' + err.message)
  }
}

/**
 * Process single entry engagement books for courses, labs, or events
 */
export async function createEngagement(data: StoreEngagementPayload): Promise<Engagement> {
  try {
    const response = await api.post<ApiResponse<Engagement>>('/engagements', data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to book target scheduling engagement: ' + err.message)
  }
}

/**
 * Alter active engagement dates, assignees, or duration records
 */
export async function updateEngagement(
  engagementId: number,
  data: UpdateEngagementPayload,
): Promise<Engagement> {
  try {
    const response = await api.patch<ApiResponse<Engagement>>(`/engagements/${engagementId}`, data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to execute schedule shift updates: ' + err.message)
  }
}

/**
 * Purge booking metrics from scheduling operational calendars
 */
export async function deleteEngagement(engagementId: number): Promise<void> {
  try {
    await api.delete<void>(`/engagements/${engagementId}`)
  } catch (err: any) {
    throw new Error('Failed to extract target timeline engagement: ' + err.message)
  }
}

/**
 * Retrieve cross-track business event logs open to cohort enrollments
 */
export async function getBusinessSessions(): Promise<BusinessSession[]> {
  try {
    const response = await api.get<ApiResponse<BusinessSession[]>>('/business-sessions')
    return response.data
  } catch (err: any) {
    throw new Error('Failed to collect cross-track configurations: ' + err.message)
  }
}

/**
 * Deploy a baseline cross-track business scenario event profile
 */
export async function createBusinessSession(
  data: StoreBusinessSessionPayload,
): Promise<BusinessSession> {
  try {
    const response = await api.post<ApiResponse<BusinessSession>>('/business-sessions', data)
    return response.data
  } catch (err: any) {
    throw new Error('Failed to register global business tracking block: ' + err.message)
  }
}

/**
 * Enroll a full operational cohort into a broader global business session event context
 */
export async function enrollCohortInBusinessSession(
  businessSessionId: number,
  cohortId: number,
): Promise<void> {
  try {
    await api.post<void>(`/business-sessions/${businessSessionId}/cohorts`, { cohort_id: cohortId })
  } catch (err: any) {
    throw new Error('Failed to assign cohort to global session matrix: ' + err.message)
  }
}

/**
 * Release a cohort index tracking block from cross-track business session views
 */
export async function removeCohortFromBusinessSession(
  businessSessionId: number,
  cohortId: number,
): Promise<void> {
  try {
    await api.delete<void>(`/business-sessions/${businessSessionId}/cohorts/${cohortId}`)
  } catch (err: any) {
    throw new Error('Failed to detach target cohort configuration block: ' + err.message)
  }
}
