import { ref } from 'vue'
import type { AtRiskStudent } from '../types'
import { getAtRiskStudents } from '../services/analyticsService'

export function useAtRiskStudents() {
  const students = ref<AtRiskStudent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadStudents(cohortId: number) {
    isLoading.value = true
    error.value = null
    try {
      students.value = await getAtRiskStudents(cohortId)
    } catch (err: any) {
      error.value = err.message || 'Failed to load at-risk students.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    students,
    isLoading,
    error,
    loadStudents,
  }
}
