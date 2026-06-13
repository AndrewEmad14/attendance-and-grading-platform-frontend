import { ref, computed } from 'vue'
import { getBranchAnalytics } from '../services/analyticsService'
import type { AnalyticsResponse } from '../types'

export function useBranchAnalytics() {
  const analyticsData = ref<AnalyticsResponse | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function loadAnalytics() {
    isLoading.value = true
    error.value = null
    try {
      analyticsData.value = await getBranchAnalytics()
    } catch (err: any) {
      error.value = err.message || 'Failed to load analytics data.'
    } finally {
      isLoading.value = false
    }
  }

  const totalAtRisk = computed(() => {
    if (!analyticsData.value?.tracks) return 0
    return analyticsData.value.tracks.reduce((sum, track) => sum + track.at_risk_count, 0)
  })

  return {
    analyticsData,
    isLoading,
    error,
    loadAnalytics,
    totalAtRisk,
  }
}
