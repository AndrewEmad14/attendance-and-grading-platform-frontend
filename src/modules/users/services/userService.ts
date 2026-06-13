import { api, type ApiResponse } from '@/utils/api'
import type {
  UserPaginatedData,
  UserListItem,
  CreateUserPayload,
  UpdateUserPayload,
  ListStudentsParams,
  ListInstructorsParams,
  ListTrackAdminsParams,
} from '@/modules/users/types'



//  Helper function to build query string from params
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return ''
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    usp.append(key, String(value))
  }
const qs = usp.toString()
  return qs ? `?${qs}` : ''
}



export function listStudents(
  params?: ListStudentsParams,
): Promise<ApiResponse<UserPaginatedData<UserListItem>>> {
  return api.get(`/users/students${buildQuery(params as Record<string, unknown>)}`)
}

export function listInstructors(
  params?: ListInstructorsParams,
): Promise<ApiResponse<UserPaginatedData<UserListItem>>> {
  return api.get(`/users/instructors${buildQuery(params as Record<string, unknown>)}`)
}

export function listTrackAdmins(
  params?: ListTrackAdminsParams,
): Promise<ApiResponse<UserPaginatedData<UserListItem>>> {
  return api.get(`/users/track-admins${buildQuery(params as Record<string, unknown>)}`)
}

export function showUser(id: number | string): Promise<ApiResponse<UserListItem>> {
  return api.get(`/users/${id}`)
}

export function createUser(payload: CreateUserPayload): Promise<ApiResponse<UserListItem>> {
  return api.post(`/users`, payload)
}

export function updateUser(
  id: number | string,
  payload: UpdateUserPayload,
): Promise<ApiResponse<UserListItem>> {
  return api.patch(`/users/${id}`, payload)
}

export function deleteUser(id: number | string): Promise<ApiResponse<null>> {
  return api.delete(`/users/${id}`)
}