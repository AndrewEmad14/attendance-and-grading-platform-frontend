import { api } from '@/utils/api'
import type { AnalyticsResponse } from '../types'

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
