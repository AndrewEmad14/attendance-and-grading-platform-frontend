export interface CourseDeliverable {
  id: number
  course_id: number
  name: string
  type: 'lab' | 'exam' | 'project'
  max_score: number
  course_weight: number
  due_date: string | null
}

export interface Course {
  id: number
  cohort_id: number
  name: string
  deliverables: CourseDeliverable[]
}

export interface Submission {
  id: number
  deliverable_id: number
  student_id: number
  submission_type: string | null
  submission_path: string | null
  submitted_at: string
  status: 'completed' | 'late'
  student?: {
    id: number
    name: string
  }
  raw_score: number | null
  override_score: number | null
  override_note: string | null
  effective_raw_score: number | null
  normalized_score: number | null
  is_overridden: boolean
  graded_by: { id: number; name: string } | null
  overridden_by: { id: number; name: string } | null
  overridden_at: string | null
}

export interface Tag {
  id: number
  tag: string
}

interface GradeDistribution {
  '0_59': number
  '60_69': number
  '70_79': number
  '80_89': number
  '90_100': number
}

export interface CohortAnalytics {
  cohort_id: number
  grade_distribution: GradeDistribution
  grader_consistency: { lab_group_id: number; name: string; mean_score: number }[]
  tagged_student_count: number
}

export interface LabGroupAnalytics {
  lab_group_id: number
  grade_distribution: GradeDistribution
}
