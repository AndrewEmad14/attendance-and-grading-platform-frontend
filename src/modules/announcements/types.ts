// ─── Shared 

export interface AnnouncementPaginatedData<T> {
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

// ─── Staff 

export interface AnnouncementStaffUser {
  id: number
  name: string
}

export interface AnnouncementStaff {
  id: number
  user: AnnouncementStaffUser
}

// ─── Announcement 

export interface Announcement {
  id: number
  cohort_id: number | null
  staff_id: number
  title: string
  body: string
  published_at: string | null
  created_at: string
  updated_at: string
  staff: AnnouncementStaff
}

// ─── Payloads 

export interface CreateAnnouncementPayload {
  title: string
  body: string
}

export interface UpdateAnnouncementPayload {
  title?: string
  body?: string
}

// ─── List Endpoint Params 

export interface ListAnnouncementsParams {
  page?: number
}