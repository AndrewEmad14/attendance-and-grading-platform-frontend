export interface BillingSummary {
  total_cost: number
  internal_cost: number
  external_cost: number
}

export interface StaffBillingRow {
  staff_profile_id: number
  name: string
  compensation_type: 'internal' | 'external'
  scheduled_hours: number
  hourly_rate: number
  billing_amount: number
  // Populated after fetching /billing/instructors/{id}
  track_name?: string
  // TODO: delivered_hours is only available from /billing/instructors/{id}.
  // We fetch per-instructor data in a Promise.all batch to compute variance
  // (delivered_hours - scheduled_hours). Until that resolves, variance is 0.
  delivered_hours?: number
}

export interface PaginatedStaffBilling {
  data: StaffBillingRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface BillingRollupResponse {
  summary: BillingSummary
  by_staff: PaginatedStaffBilling
}

// ─── Instructor Detail Types ─────────────────────────────────────────────────

export interface PayoutSummary {
  total_delivered_hours: number
  base_salary_component: number
  hourly_component: number
  total_calculated_payout: number
}

export interface EngagementRow {
  engagement_id: number
  type: 'lecture' | 'lab' | 'business_session' | string
  title: string
  starts_at: string | null
  ends_at: string | null
  scheduled_hours: number
  estimated_payout: number
  status: 'pending' | 'forwarded' | 'in_progress' | string
}

export interface PaginatedEngagements {
  data: EngagementRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface InstructorBillingDetail {
  staff_profile_id: number
  name: string
  compensation_type: 'internal' | 'external'
  fixed_salary: number
  hourly_rate: number
  payout_summary: PayoutSummary
  engagements: PaginatedEngagements
}
