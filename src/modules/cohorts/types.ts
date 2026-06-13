export interface Track {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface TrackAdminProfile {
  id: number
  user_id: number
  user?: {
    id: number
    name: string
    email: string
  }
}

export interface Cohort {
  id: number
  track_id: number
  number: number
  is_active: boolean
  created_at: string
  updated_at: string

  // Conditionally loaded by include_meta or relationships
  track?: Track
  students_count?: number
  admins?: TrackAdminProfile[]
}

export interface CohortStudent {
  student_profile_id: number
  user_id: number
  name: string
  email: string
  lab_group_id: number | null
  attendance_balance: number
}

export interface LabGroup {
  id: number
  cohort_id: number
  name: string
  student_count?: number
  created_at: string
  updated_at: string

  // Conditionally loaded matching LabGroupResource
  students?: CohortStudent[]
}

// Request payloads matching backend FormRequests
export interface StoreCohortPayload {
  number: number
  is_active?: boolean
}

export interface UpdateCohortPayload {
  number?: number
  is_active?: boolean
}

export interface StoreLabGroupPayload {
  name: string
}