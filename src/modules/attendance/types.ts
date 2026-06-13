export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'upcoming'
export type ExcuseStatus = 'pending' | 'approved' | 'rejected' | 'none'
export type EngagementType = 'lecture' | 'lab' | 'business_session'
export type CheckInOutcome =
  | 'checked_in'
  | 'checked_out'
  | 'idempotent'
  | 'rejected'
  | 'not_found'
  | 'session_ended'

export interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginatedMeta
  links: { first: string; last: string; prev: string | null; next: string | null }
}

export interface AttendanceRecord {
  id: number
  student: {
    id: number
    name: string
    cohort_id: number
    lab_group_id: number
    attendance_balance: number
  }
  engagement: {
    id: number
    type: EngagementType
    starts_at: string
    ends_at: string
    scheduled_hours: number
    instructor?: {
      id?: number
      name?: string
    } | null
    engageable_id: number
    engageable_type: string
  }
  arrived_at: string | null
  left_at: string | null
  created_at: string
  updated_at: string
}

export interface ExcuseRequest {
  id: number
  student: {
    id: number
    name: string
  }
  engagement: {
    id: number
    type: EngagementType | null
    name: string
    starts_at: string
    ends_at: string
    instructor?: string | null
  }
  reason: string
  attachment_url?: string | null
  review?: {
    by: {
      id: number
      name: string
    }
    at: string | null
    note?: string | null
  } | null
  status: ExcuseStatus
  created_at: string
  updated_at: string
}

export interface LedgerEntry {
  engagement_id: number
  engagement_type: EngagementType
  engagement_instructor?: string | null
  name: string
  date: string
  arrived_at: string | null
  left_at: string | null
  absence_status: AttendanceStatus
  excuse_status: ExcuseStatus | null
  deduction: number
}

export interface AttendanceLedgerMeta {
  id: number
  name: string
  current_balance: number
}

export interface AttendanceBalance {
  balance: number
  max: number
}

export interface CheckInResult {
  outcome: CheckInOutcome
  message: string
  record?: AttendanceRecord
}

export interface Engagement {
  id: number
  type: EngagementType
  engageable_type: string
  engageable_id: number
  staff_id: number
  starts_at: string
  ends_at: string
  scheduled_hours: number
  created_at: string
  updated_at: string
  display_title: string
  display_context: string
  staff_name: string
}

export interface EngagementAttendanceEntry {
  student: { id: number; name: string }
  arrived_at: string | null
  left_at: string | null
  attendance_status: AttendanceStatus
  excuse_status: ExcuseStatus | null
}
