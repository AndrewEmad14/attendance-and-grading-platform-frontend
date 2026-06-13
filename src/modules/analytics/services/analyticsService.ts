import { api } from '@/utils/api'
import type { AnalyticsResponse } from '../types'
import type { AtRiskStudent } from '../types'

/**
 * Fetch branch-wide analytics visible to the branch manager.
 * Maps to GET /analytics/branch
 */
export async function getBranchAnalytics(): Promise<AnalyticsResponse> {
  try {
    return await api.get<AnalyticsResponse>('/analytics/branch')
  } catch (err: any) {
    throw new Error('Failed to retrieve branch analytics: ' + err.message)
  }
}

/**
 * Fetch the list of at-risk students for a specific cohort.
 * Maps to GET /analytics/cohorts/{cohortId}/at-risk
 */
export async function getAtRiskStudents(cohortId: number): Promise<AtRiskStudent[]> {
  try {
    return await api.get<AtRiskStudent[]>(`/analytics/cohorts/${cohortId}/at-risk`)
  } catch (err: any) {
    throw new Error('Failed to retrieve at-risk students: ' + err.message)
  }
}
