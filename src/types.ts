export interface CohortAdmin {
  staff_profile_id: number
  user_id: number
  name: string | null
  email: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface Cohort {
  id: number
  track_id: number
  number: number
  is_active: boolean
  created_at: string
  updated_at: string

  // Conditional
  track?: Track
  students_count?: number
  admins?: CohortAdmin[]
}

export interface Track {
  id: number
  name: string
}

export interface CohortStudent {
  student_profile_id: number
  user_id: number
  name: string | null
  email: string | null
  lab_group_id: number | null
  attendance_balance: number
  lab_group?: {
    id: number
    name: string
  } | null
}