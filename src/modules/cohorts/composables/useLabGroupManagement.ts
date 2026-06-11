import { ref } from 'vue'
import type { LabGroup, CohortStudent, StoreLabGroupPayload } from '../types'
import {
  getLabGroups,
  createLabGroup,
  deleteLabGroup,
  getCohortStudents,
  attachStudentToGroup,
  detachStudentFromGroup
} from '../services/cohortService'

export function useLabGroupManagement() {
  const labGroups = ref<LabGroup[]>([])
  const unassignedStudents = ref<CohortStudent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Discharges server sync workflows to gather the complete operational grid
   */
  async function loadMatrix(cohortId: number) {
    isLoading.value = true
    error.value = null
    try {
      // Execute concurrently to optimize pipeline delivery speed
      const [groupsData, studentsData] = await Promise.all([
        getLabGroups(cohortId, true),
        getCohortStudents(cohortId, true)
      ])
      labGroups.value = groupsData
      unassignedStudents.value = studentsData
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Provision a fresh lab group bucket, then refresh the grid layout matrix
   */
  async function addGroup(cohortId: number, payload: StoreLabGroupPayload) {
    isLoading.value = true
    error.value = null
    try {
      await createLabGroup(cohortId, payload)
      await loadMatrix(cohortId)
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * Destroys an existing group container and flushes students to unassigned states
   */
  async function removeGroup(cohortId: number, labGroupId: number) {
    isLoading.value = true
    error.value = null
    try {
      await deleteLabGroup(labGroupId)
      await loadMatrix(cohortId)
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * Allocate an unassigned student into a target lab group matrix tray
   */
  async function assignStudent(cohortId: number, labGroupId: number, studentId: number) {
    isLoading.value = true
    error.value = null
    try {
      await attachStudentToGroup(labGroupId, studentId)
      await loadMatrix(cohortId)
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * Unbind an active student assignment, dropping them back into the main pool
   */
  async function dropStudent(cohortId: number, labGroupId: number, studentId: number) {
    isLoading.value = true
    error.value = null
    try {
      await detachStudentFromGroup(labGroupId, studentId)
      await loadMatrix(cohortId)
    } catch (err: any) {
      error.value = err.message
      isLoading.value = false
    }
  }

  return {
    labGroups,
    unassignedStudents,
    isLoading,
    error,
    loadMatrix,
    addGroup,
    removeGroup,
    assignStudent,
    dropStudent
  }
}