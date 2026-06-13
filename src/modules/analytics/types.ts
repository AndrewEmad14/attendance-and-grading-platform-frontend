// ─── Existing types (unchanged) ───────────────────────────────────────────────
export interface Track {
  track_id: number
  track_name: string
  cohort_id: number
  cohort_number: number
  student_count: number
  attendance_pct: number
  total_delivered_hours: number
  pass_rate_pct: number
  at_risk_count: number
}

export interface ByTrack {
  track_id: number
  pct: number | null
}

export interface AttendanceTrend {
  week_start: string
  branch_pct: number
  by_track: ByTrack[]
}

export interface Kpis {
  total_active_students: number
  total_active_tracks: number
  branch_attendance_pct: number
  pass_rate_pct: number
}

export interface AnalyticsResponse {
  kpis: Kpis
  tracks: Track[]
  attendance_trend: AttendanceTrend[]
}

// ─── At-Risk types ────────────────────────────────────────────────────────────

export interface FailingCourse {
  course_id: number
  course_name: string
  score: number
}

export interface AtRiskStudent {
  student_id: number
  name: string
  email: string
  attendance_balance: number
  at_risk_attendance: boolean
  at_risk_grade: boolean
  failing_courses: FailingCourse[]
}
