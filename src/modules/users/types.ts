import type { UserRole } from '@/stores/auth'

//Shared

export interface UserPaginatedData<T> {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: {
    url: string | null
    label: string
    page: number | null
    active: boolean
  }[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

//  Staff / Instructor

export interface StaffProfileSummary {
  id: number
  user_id: number
  compensation_type: 'internal' | 'external'
  hourly_rate: number | null
  fixed_salary: number | null
}

//Student

export interface StudentProfileSummary {
  id: number
  user_id: number
  cohort_id?: number | null
  lab_group_id?: number | null
  attendance_balance?: number | null
}

//  Track Admin

export interface TrackSummary {
  id: number
  name: string
}

export interface CohortSummary {
  id: number
  number: number
  is_active: boolean
  track: TrackSummary
}

export interface CohortAdminEntry {
  cohort: CohortSummary
}

export interface TrackAdminStaffProfile {
  id: number
  user_id: number
  managed_cohorts: CohortAdminEntry[]
}

export interface TrackAdminListItem {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  role: UserRole
  expires_at: string | null
  created_at: string
  updated_at: string
  staff_profile: TrackAdminStaffProfile | null
}

//  General User List Item

export interface UserListItem {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  role: UserRole
  expires_at: string | null
  created_at: string
  updated_at: string
  staff_profile?: StaffProfileSummary | null
  student_profile?: StudentProfileSummary | null
}

//  Payloads

export interface CreateStaffPayload {
  name: string
  email: string
  role: 'instructor' | 'track_admin' | 'branch_manager'
  expires_at?: string | null
  compensation_type: 'internal' | 'external'
  hourly_rate?: number
  fixed_salary?: number
}

export interface CreateStudentPayload {
  name: string
  email: string
  role: 'student'
  expires_at?: string | null
  cohort_id: number
  lab_group_id?: number | null
}

export type CreateUserPayload = CreateStaffPayload | CreateStudentPayload

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  expires_at?: string | null
  compensation_type?: 'internal' | 'external'
  hourly_rate?: number
  fixed_salary?: number
}

//  List Endpoint Params

export interface ListStudentsParams {
  name?: string
  cohort?: number | string
  track_id?: number | string
  tag_id?: number | string
  lab_group_id?: number | string
  attendance_min?: number
  attendance_max?: number
  sort?: string
  is_active?: boolean
  page?: number
}

export interface ListInstructorsParams {
  page?: number
  name?: string
  compensation_type?: 'internal' | 'external'
  hourly_rate_min?: number
  hourly_rate_max?: number
  fixed_salary_min?: number
  fixed_salary_max?: number
  sort?: string
}

export interface ListTrackAdminsParams {
  page?: number
  name?: string
  cohort?: number | string
  track_id?: number | string
  is_active?: boolean
}
