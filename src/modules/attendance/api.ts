import { api } from '@/utils/api'
import { buildQuery } from '@/utils/query'
import type {
  AttendanceRecord,
  AttendanceLedger,
  ExcuseRequest,
  ExcuseStatus,
  CheckInResult,
  Engagement,
  EngagementAttendanceEntry
} from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  links: { first: string; last: string; prev: string | null; next: string | null }
}

type ListParams = {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

export const attendanceApi = {
  // Student APIs
  scan: (engagementId: number, token: string) =>
    api.post<{ data: CheckInResult }>('/attendance', { engagement_id: engagementId, token }),

  studentLedger: (studentId: number) => api.get<{ data: AttendanceLedger }>(`/students/${studentId}/attendance-ledger`),

  attendanceRecord: (id: number) => api.get<{ data: AttendanceRecord }>(`/attendance/${id}`),

  excuseRequest: (id: number) => api.get<{ data: ExcuseRequest }>(`/excuse-requests/${id}`),

  myExcuses: (params: ListParams = {}) =>
    api.get<Paginated<ExcuseRequest>>(`/excuse-requests${buildQuery(params)}`),

  createExcuse: (payload: { engagement_id: number; reason: string; attachment?: File | null }) => {
    if (payload.attachment) {
      const form = new FormData()
      form.set('engagement_id', String(payload.engagement_id))
      form.set('reason', payload.reason)
      form.set('attachment', payload.attachment)
      return api.post<{ data: ExcuseRequest }>('/excuse-requests', form)
    }
    return api.post<{ data: ExcuseRequest }>('/excuse-requests', payload)
  },

  updateExcuse: (id: number, payload: { reason: string; attachment?: File | null }) => {
    if (payload.attachment) {
      const form = new FormData()
      form.set('reason', payload.reason)
      form.set('attachment', payload.attachment)
      form.set('_method', 'PATCH')
      return api.post<{ data: ExcuseRequest }>(`/excuse-requests/${id}`, form)
    }
    return api.patch<{ data: ExcuseRequest }>(`/excuse-requests/${id}`, payload)
  },

  // Instructor APIs
  mySessions: (params: ListParams & { date_from?: string; date_to?: string } = {}) =>
    api.get<Paginated<Engagement>>(`/engagements${buildQuery(params)}`),

  sessionQr: (engagementId: number) =>
    api.get<{ data: { token: string; expires_at: string } }>(`/engagements/${engagementId}/qr-token`),
  
  // Track admin APIs
  // Each expected student's attendance + excuse status for this engagement, optionally filtered by cohort
  engagementAttendance: (engagementId: number, params: ListParams & { cohort_id?: number } = {}) =>
    api.get<{ data: EngagementAttendanceEntry[] }>(`/engagements/${engagementId}/attendance${buildQuery(params)}`),

  listAttendance: (params: ListParams & { engagement_id?: number } = {}) =>
    api.get<Paginated<AttendanceRecord>>(`/attendance${buildQuery(params)}`),

  updateAttendanceRecord: (id: number, payload: { arrived_at?: string | null; left_at?: string | null }) =>
    api.patch<{ data: AttendanceRecord }>(`/attendance/${id}`, payload),

  adminExcuses: (filters: { cohort_id?: number; status?: ExcuseStatus } & ListParams = {}) =>
    api.get<Paginated<ExcuseRequest>>(`/excuse-requests${buildQuery(filters)}`),

  approveExcuse: (id: number) => api.post<{ data: ExcuseRequest }>(`/excuse-requests/${id}/approve`, {}),

  rejectExcuse: (id: number) => api.post<{ data: ExcuseRequest }>(`/excuse-requests/${id}/reject`, {}),
}