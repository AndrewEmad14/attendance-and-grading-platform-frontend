import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, type ApiResponse } from '@/utils/api'

import type { StaffProfile, StudentProfile } from '@/modules/auth/types'

export type UserRole = 'branch_manager' | 'track_admin' | 'instructor' | 'student'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  expires_at: string | null
  staff_profile?: StaffProfile | null
  student_profile?: StudentProfile | null
}

interface LoginPayload {
  email: string
  password: string
}

interface LoginData {
  access_token: string
}

const TOKEN_KEY = 'auth_token'

export const useAuthRealStore = defineStore('auth-real', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const currentUser = ref<AuthUser | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed((): boolean => !!token.value)

  const userRole = computed((): UserRole | null => currentUser.value?.role ?? null)

  const staffProfileId = computed((): number | null => currentUser.value?.staff_profile?.id ?? null)

  const studentProfileId = computed((): number | null => currentUser.value?.student_profile?.id ?? null)

  const isExpired = computed((): boolean => {
    const expiresAt = currentUser.value?.expires_at
    if (!expiresAt) return false
    return new Date(expiresAt).getTime() < Date.now()
  })

  async function login(payload: LoginPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await api.post<ApiResponse<LoginData>>('/auth/login', payload)

      token.value = res.data.access_token
      localStorage.setItem(TOKEN_KEY, token.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      clearSession()
      throw err
    } finally {
      loading.value = false
    }
  }

  // Loads the full profile (incl. staff_profile/student_profile).
  // Called by the router guard before any guarded route renders.
  async function fetchMe(): Promise<AuthUser> {
    const res = await api.post<ApiResponse<AuthUser>>('/auth/me', {})
    currentUser.value = res.data
    return res.data
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) {
        await api.post('/auth/logout', {})
      }
    } catch {
      // ignore network errors on logout, clear local state regardless
    } finally {
      clearSession()
    }
  }

  async function logoutAll(): Promise<void> {
    try {
      if (token.value) {
        await api.post('/auth/logout-all', {})
      }
    } finally {
      clearSession()
    }
  }

  async function forgotPassword(email: string): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>('/auth/forgot-password', { email })
  }

  async function resetPassword(payload: {
    email: string
    token: string
    password: string
    password_confirmation: string
  }): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>('/auth/reset-password', payload)
  }

  function clearSession(): void {
    token.value = null
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  function hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    if (!userRole.value) return false
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole.value)
    }
    return userRole.value === allowedRoles
  }

  return {
    // State properties
    token,
    currentUser,
    loading,
    error,

    // Getter properties
    isAuthenticated,
    userRole,
    staffProfileId,
    studentProfileId,
    isExpired,

    // Action functions
    login,
    fetchMe,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    clearSession,
    hasRole,
  }
})