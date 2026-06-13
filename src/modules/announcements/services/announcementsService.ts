import { api, type ApiResponse } from '@/utils/api'
import type {
  Announcement,
  AnnouncementPaginatedData,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
  ListAnnouncementsParams,
} from '@/modules/announcements/types'

const buildQueryString = <T extends object>(params?: T): string => {
  if (!params) return ''
  const query = new URLSearchParams()
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export const announcementService = {
  /**
   * GET /cohorts/{cohort}/announcements
   */
  list(cohortId: number | string, params?: ListAnnouncementsParams) {
    const queryString = buildQueryString(params)
    return api.get<ApiResponse<AnnouncementPaginatedData<Announcement>>>(
      `/cohorts/${cohortId}/announcements${queryString}`
    )
  },

  /**
   * POST /cohorts/{cohort}/announcements
   */
  create(cohortId: number | string, payload: CreateAnnouncementPayload) {
    return api.post<ApiResponse<Announcement>>(`/cohorts/${cohortId}/announcements`, payload)
  },

  /**
   * PATCH /announcements/{announcement}
   */
  update(announcementId: number | string, payload: UpdateAnnouncementPayload) {
    return api.patch<ApiResponse<Announcement>>(`/announcements/${announcementId}`, payload)
  },

  /**
   * DELETE /announcements/{announcement}
   */
  remove(announcementId: number | string) {
    return api.delete<ApiResponse<null>>(`/announcements/${announcementId}`)
  },

  /**
   * POST /announcements/broadcast
   */
  broadcast(payload: CreateAnnouncementPayload) {
    return api.post<ApiResponse<Announcement>>(`/announcements/broadcast`, payload)
  },
}