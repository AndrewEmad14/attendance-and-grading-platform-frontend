import type { Cohort,LabGroup } from "@/modules/cohorts/types"



export interface ManagedCohort {
  id: number
  cohort_id: number
  staff_id: number
  created_at: string
  updated_at: string
  cohort: Cohort
}

export interface StaffProfile {
  id: number
  user_id: number
  compensation_type: 'internal' | 'external'
  fixed_salary: number | null
  hourly_rate: number | null
  created_at: string
  updated_at: string
  managed_cohorts?: ManagedCohort[]
}

export interface StudentTag {
  id: number
  tag: string
  created_at: string
  updated_at: string
  pivot: {
    student_id: number
    tag_id: number
  }
}

export interface StudentProfile {
  id: number
  user_id: number
  cohort_id: number
  lab_group_id: number
  notes: string | null
  attendance_balance: number
  created_at: string
  updated_at: string
  cohort?: Cohort
  lab_group?: LabGroup
  tags?: StudentTag[]
}