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

// Request payloads matching backend FormRequests
export interface StoreTrackPayload {
  name: string
}

export interface UpdateTrackPayload {
  name?: string
}

export interface TrackAdminCandidate {
  id: number // user id — for display/keying only
  name: string
  email: string
  role: 'track_admin'
  expires_at: string | null
  staff_profile: { id: number } // staff id — this is what assign/unassign use
}

export interface CohortAdmin {
  staff_profile_id: number
  user_id: number
  name: string | null
  email: string | null
}

export interface BusinessSession {
  id: number
  name: string
  created_at: string
  updated_at: string

  // Conditionally loaded (whenLoaded) — present only when the server eager-loads.
  // `cohorts` is what tells us which cohorts a session is already attached to.
  cohorts?: Cohort[]
}

// Request payload matching StoreBusinessSessionRequest (name only).
export interface StoreBusinessSessionPayload {
  name: string
}

// Body of POST /business-sessions/{id}/cohorts is simply { cohort_id }.
export interface EnrollCohortPayload {
  cohort_id: number
}
