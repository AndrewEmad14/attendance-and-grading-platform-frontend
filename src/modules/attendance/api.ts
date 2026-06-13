import { api } from '@/utils/api'
import { buildQuery } from '@/utils/query'
import type {
  AttendanceRecord,
  LedgerEntry,
  ExcuseRequest,
  ExcuseStatus,
  CheckInResult,
  Engagement,
  EngagementAttendanceEntry,
  Paginated,
  AttendanceLedgerMeta,
} from './types'
import type { Cohort } from '@/modules/cohorts/types'
import type { CohortStudent } from '@/types'

type ListParams = {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

type CohortStudentsParams = ListParams & {
  status?: 'good' | 'risk' | 'critical'
  unassigned_only?: boolean
}

export const cohortsApi = {
  list: (params: ListParams = {}) =>
    api.get<{ data: Cohort[] }>(`/cohorts${buildQuery(params)}`),

  get: (cohortId: number) =>
    api.get<{ data: Cohort }>(`/cohorts/${cohortId}`),

  students: (cohortId: number, params: CohortStudentsParams = {}) =>
    api.get<Paginated<CohortStudent>>(`/cohorts/${cohortId}/students${buildQuery(params)}`),
}

export const attendanceApi = {
  scan: (engagementId: number, token: string) =>
    api.post<{ data: CheckInResult }>('/attendance', { engagement_id: engagementId, token }),

  studentLedger: (studentId: number, params: Record<string, string> = {}) =>
    api.get<Paginated<LedgerEntry>>(`/students/${studentId}/attendance-ledger${buildQuery(params)}`),

  studentLedgerMeta: (studentId: number) =>
    api.get<{ data: AttendanceLedgerMeta }>(`/students/${studentId}/attendance-ledger/meta`),

  attendanceRecord: (id: number) =>
    api.get<{ data: AttendanceRecord }>(`/attendance/${id}`),

  excuseRequest: (id: number) =>
    api.get<{ data: ExcuseRequest }>(`/excuse-requests/${id}`),

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

  updateExcuse: (id: number, payload: { reason: string; attachment?: File | null; remove_attachment?: boolean }) => {
    if (payload.attachment) {
      const form = new FormData()
      form.set('reason', payload.reason)
      form.set('attachment', payload.attachment)
      form.set('_method', 'PATCH')
      return api.post<{ data: ExcuseRequest }>(`/excuse-requests/${id}`, form)
    }
    return api.patch<{ data: ExcuseRequest }>(`/excuse-requests/${id}`, {
      reason: payload.reason,
      ...(payload.remove_attachment ? { remove_attachment: true } : {}),
    })
  },

  absentEngagements: (studentId: number) =>
    api.get<{ data: { id: number; name: string; date: string }[] }>(
      `/students/${studentId}/absent-engagements`,
    ),

  mySessions: (params: ListParams & { date_from?: string; date_to?: string } = {}) =>
    api.get<Paginated<Engagement>>(`/engagements${buildQuery(params)}`),

  sessionQr: (engagementId: number) =>
    api.get<{ data: { token: string; expires_at: string } }>(
      `/engagements/${engagementId}/qr-token`,
    ),

  cohortStudents: (cohortId: number, params: CohortStudentsParams = {}) =>
    api.get<Paginated<CohortStudent>>(`/cohorts/${cohortId}/students${buildQuery(params)}`),

  engagementAttendance: (engagementId: number, params: ListParams & { cohort_id?: number } = {}) =>
    api.get<{ data: EngagementAttendanceEntry[] }>(
      `/engagements/${engagementId}/attendance${buildQuery(params)}`,
    ),

  listAttendance: (params: ListParams & { engagement_id?: number } = {}) =>
    api.get<Paginated<AttendanceRecord>>(`/attendance${buildQuery(params)}`),

  updateAttendanceRecord: (id: number, payload: { arrived_at?: string | null; left_at?: string | null }) =>
    api.patch<{ data: AttendanceRecord }>(`/attendance/${id}`, payload),

  adminExcuses: (
    filters: { cohort_id?: number; status?: ExcuseStatus; search?: string } & ListParams = {},
  ) => api.get<Paginated<ExcuseRequest>>(`/excuse-requests${buildQuery(filters)}`),

  approveExcuse: (id: number) =>
    api.post<{ data: ExcuseRequest }>(`/excuse-requests/${id}/approve`, {}),

  rejectExcuse: (id: number) =>
    api.post<{ data: ExcuseRequest }>(`/excuse-requests/${id}/reject`, {}),
}