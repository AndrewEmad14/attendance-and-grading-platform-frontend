import { api } from '@/utils/api'
import type {
  Course,
  CourseDeliverable,
  Submission,
  Tag,
  CohortAnalytics,
  LabGroupAnalytics,
} from '@/modules/grading/types'

export async function getCohortCourses(cohortId: number): Promise<Course[]> {
  try {
    const res = await api.get<{ data: Course[] }>(`/cohorts/${cohortId}/courses`)
    return res.data
  } catch (err: any) {
    throw new Error('Failed to load courses: ' + err.message)
  }
}

export async function createCourse(
  cohortId: number,
  data: { name: string; deliverables: Omit<CourseDeliverable, 'id' | 'course_id'>[] },
): Promise<Course> {
  try {
    const res = await api.post<{ data: Course }>(`/cohorts/${cohortId}/courses`, data)
    return res.data
  } catch (err: any) {
    throw new Error('Failed to create course: ' + err.message)
  }
}

export async function updateCourse(
  courseId: number,
  data: { name?: string; deliverables?: Omit<CourseDeliverable, 'course_id'>[] },
): Promise<Course> {
  try {
    const res = await api.patch<{ data: Course }>(`/courses/${courseId}`, data)
    return res.data
  } catch (err: any) {
    throw new Error('Failed to update course: ' + err.message)
  }
}

export async function deleteCourse(courseId: number): Promise<void> {
  try {
    await api.delete<void>(`/courses/${courseId}`)
  } catch (err: any) {
    throw new Error('Failed to delete course: ' + err.message)
  }
}

/**
 * Helper to fetch all pages of a paginated API endpoint to ensure the UI
 * has the complete dataset without relying on magic numbers or 'Next Page' buttons.
 */
async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  let allData: T[] = []
  let page = 1
  let lastPage = 1

  do {
    const separator = endpoint.includes('?') ? '&' : '?'
    // We still use a reasonable per_page so we don't spam the server with tiny 15-item requests
    const res = await api.get<{ data: T[]; meta?: { current_page: number; last_page: number } }>(
      `${endpoint}${separator}page=${page}&per_page=50`
    )

    if (res.data) {
      allData = allData.concat(res.data)
    }

    if (res.meta && res.meta.last_page) {
      lastPage = res.meta.last_page
    } else {
      break // Not paginated or no meta returned
    }

    page++
  } while (page <= lastPage)

  return allData
}

export async function getDeliverableSubmissions(deliverableId: number): Promise<Submission[]> {
  try {
    return await fetchAllPages<Submission>(`/deliverables/${deliverableId}/submissions`)
  } catch (err: any) {
    throw new Error('Failed to load submissions: ' + err.message)
  }
}

export async function getMissingDeliverables(deliverableId: number): Promise<any[]> {
  try {
    return await fetchAllPages<any>(`/deliverables/${deliverableId}/missing`)
  } catch (err: any) {
    throw new Error('Failed to load missing students: ' + err.message)
  }
}

export async function getStudentSubmissions(studentId: number): Promise<Submission[]> {
  try {
    return await fetchAllPages<Submission>(`/students/${studentId}/submissions`)
  } catch (err: any) {
    throw new Error('Failed to load student submissions: ' + err.message)
  }
}

export async function getCohortStudents(cohortId: number): Promise<any[]> {
  try {
    return await fetchAllPages<any>(`/cohorts/${cohortId}/students`)
  } catch (err: any) {
    throw new Error('Failed to load students: ' + err.message)
  }
}


export async function gradeSubmission(submissionId: number, rawScore: number): Promise<Submission> {
  try {
    const res = await api.patch<{ data: Submission }>(`/submissions/${submissionId}`, {
      raw_score: rawScore,
    })
    return res.data
  } catch (err: any) {
    throw new Error('Failed to save grade: ' + err.message)
  }
}

export async function overrideSubmission(
  submissionId: number,
  newScore: number,
  overrideNote: string,
): Promise<Submission> {
  try {
    const res = await api.post<{ data: Submission }>(`/submissions/${submissionId}/override`, {
      new_score: newScore,
      override_note: overrideNote,
    })
    return res.data
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message
    throw new Error('Failed to override submission: ' + msg)
  }
}


export async function getCohortAnalytics(cohortId: number): Promise<CohortAnalytics> {
  try {
    return await api.get<CohortAnalytics>(`/analytics/cohorts/${cohortId}`)
  } catch (err: any) {
    throw new Error('Failed to load cohort analytics: ' + err.message)
  }
}

export async function getLabGroupAnalytics(labGroupId: number): Promise<LabGroupAnalytics> {
  try {
    return await api.get<LabGroupAnalytics>(`/analytics/lab-groups/${labGroupId}`)
  } catch (err: any) {
    throw new Error('Failed to load lab group analytics: ' + err.message)
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    const res = await api.get<{ data: Tag[] }>('/tags')
    return res.data
  } catch (err: any) {
    throw new Error('Failed to load tags: ' + err.message)
  }
}

export async function createTag(tag: string): Promise<Tag> {
  try {
    const res = await api.post<{ data: Tag }>('/tags', { tag })
    return res.data
  } catch (err: any) {
    throw new Error('Failed to create tag: ' + err.message)
  }
}

export async function getStudentTags(studentId: number): Promise<Tag[]> {
  try {
    const res = await api.get<{ data: Tag[] }>(`/students/${studentId}/tags`)
    return res.data
  } catch (err: any) {
    throw new Error('Failed to load student tags: ' + err.message)
  }
}

export async function attachStudentTag(studentId: number, tagId: number): Promise<Tag[]> {
  try {
    const res = await api.post<{ data: Tag[] }>(`/students/${studentId}/tags`, { tag_id: tagId })
    return res.data
  } catch (err: any) {
    throw new Error('Failed to attach tag: ' + err.message)
  }
}

export async function removeStudentTag(studentId: number, tagId: number): Promise<void> {
  try {
    await api.delete<void>(`/students/${studentId}/tags/${tagId}`)
  } catch (err: any) {
    throw new Error('Failed to remove tag: ' + err.message)
  }
}

export async function appendStudentNote(
  studentId: number,
  note: string,
): Promise<{ message: string; notes: string }> {
  try {
    return await api.patch<{ message: string; notes: string }>(`/students/${studentId}/notes`, {
      note,
    })
  } catch (err: any) {
    throw new Error('Failed to append note: ' + err.message)
  }
}
