import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Course,
  Submission,
  Tag,
  CohortAnalytics,
  LabGroupAnalytics,
} from '@/modules/grading/types'
import {
  getCohortCourses,
  getCohortStudents,
  getDeliverableSubmissions,
  getStudentSubmissions,
  getTags,
  getCohortAnalytics,
  getLabGroupAnalytics,
  gradeSubmission,
  overrideSubmission,
} from '@/modules/grading/services/gradingService'

export const useGradingStore = defineStore('grading', () => {
  const selectedCohortId = ref<number | null>(null)
  const selectedLabGroupId = ref<number | null>(null)
  const courses = ref<Course[]>([])
  const students = ref<any[]>([])
  const submissions = ref<Record<number, Submission[]>>({})
  const tags = ref<Tag[]>([])
  const analytics = ref<CohortAnalytics | LabGroupAnalytics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setCohortId(id: number | null) {
    selectedCohortId.value = id
  }

  function setLabGroupId(id: number | null) {
    selectedLabGroupId.value = id
  }

  async function loadCourses(cohortId: number) {
    loading.value = true
    error.value = null
    try {
      courses.value = await getCohortCourses(cohortId)
      selectedCohortId.value = cohortId
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadCohortStudents(cohortId: number) {
    try {
      students.value = await getCohortStudents(cohortId)
    } catch (err: any) {
      error.value = err.message
    }
  }

  async function loadSubmissions(deliverableId: number) {
    loading.value = true
    error.value = null
    try {
      submissions.value[deliverableId] = await getDeliverableSubmissions(deliverableId)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadStudentSubmissions(studentId: number) {
    loading.value = true
    error.value = null
    try {
      const studentSubs = await getStudentSubmissions(studentId)

      // Group submissions by deliverable_id so the Gradebook UI logic works
      const grouped: Record<number, Submission[]> = {}
      studentSubs.forEach((sub) => {
        if (!grouped[sub.deliverable_id]) {
          grouped[sub.deliverable_id] = []
        }
        grouped[sub.deliverable_id]!.push(sub)
      })

      // Assign the grouped submissions to the store state
      for (const [delivId, subs] of Object.entries(grouped)) {
        submissions.value[Number(delivId)] = subs
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadTags() {
    loading.value = true
    error.value = null
    try {
      tags.value = await getTags()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadCohortAnalytics(cohortId: number) {
    loading.value = true
    error.value = null
    try {
      analytics.value = await getCohortAnalytics(cohortId)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadLabGroupAnalytics(labGroupId: number) {
    loading.value = true
    error.value = null
    try {
      analytics.value = await getLabGroupAnalytics(labGroupId)
      selectedLabGroupId.value = labGroupId
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function saveGrade(submissionId: number, rawScore: number, deliverableId: number) {
    loading.value = true
    error.value = null
    try {
      const updated = await overrideSubmission(submissionId, rawScore, 'Admin direct grade entry')
      const index = submissions.value[deliverableId].findIndex((s) => s.id === submissionId)
      if (index !== -1) {
        submissions.value[deliverableId][index] = updated
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }


  async function saveOverride(
    submissionId: number,
    newScore: number,
    note: string,
    deliverableId: number,
  ) {
    loading.value = true
    error.value = null
    try {
      await overrideSubmission(submissionId, newScore, note)
      await loadSubmissions(deliverableId)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    selectedCohortId,
    selectedLabGroupId,
    courses,
    students,
    submissions,
    tags,
    analytics,
    loading,
    error,
    setCohortId,
    setLabGroupId,
    loadCourses,
    loadCohortStudents,
    loadSubmissions,
    loadStudentSubmissions,
    loadTags,
    loadCohortAnalytics,
    loadLabGroupAnalytics,
    saveGrade,
    saveOverride,
  }
})
