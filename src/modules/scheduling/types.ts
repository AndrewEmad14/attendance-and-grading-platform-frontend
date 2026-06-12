import type { Cohort } from '@/modules/cohorts/types'

export type EngagementType = 'lecture' | 'lab' | 'business_session'
export type EngageableType =
  | 'App\\Models\\Course'
  | 'App\\Models\\Lab'
  | 'App\\Models\\BusinessSession'

export interface Engagement {
  id: number
  type: EngagementType
  engageable_type: EngageableType
  engageable_id: number
  staff_id: number
  starts_at: string // ISO String
  ends_at: string // ISO String
  scheduled_hours: number
  created_at: string
  updated_at: string

  // UI Aggregation Layer fields processed by EngagementResource
  display_title: string
  display_context: string | null
}

export interface BusinessSession {
  id: number
  name: string
  created_at: string
  updated_at: string
  cohorts?: Cohort[]
}

// Request payloads matching backend FormRequests
export interface StoreEngagementPayload {
  type: EngagementType
  engageable_type: EngageableType
  engageable_id: number
  staff_id: number
  starts_at: string // 'Y-m-d H:i:s' or ISO string depending on backend parsing choice
  ends_at: string // 'Y-m-d H:i:s' or ISO string depending on backend parsing choice
  scheduled_hours: number
}

export interface UpdateEngagementPayload {
  type?: EngagementType
  engageable_type?: EngageableType
  engageable_id?: number
  staff_id?: number
  starts_at?: string
  ends_at?: string
  scheduled_hours?: number
}

export interface StoreBusinessSessionPayload {
  name: string
}
