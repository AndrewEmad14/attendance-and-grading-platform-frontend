import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCohortContextStore } from './cohortContext' // Import context to clear it

export type UserRole = 'branch_manager' | 'track_admin' | 'instructor' | 'student'

export interface UserProfile {
  id: number
  name: string
  email: string
  role: UserRole
  expires_at?: string | null
  email_verified_at?: string | null
  // role-specific profile; key/shape depends on role
  student_profile?: Record<string, any> | null
  staff_profile?: Record<string, any> | null
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api'

export const useAuthStore = defineStore('auth', () => {
  const cohortContext = useCohortContextStore() // Instantiate store reference

  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const currentUser = ref<UserProfile | null>(
    localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')!) : null,
  )

  const error = ref<string | null>(null)
  const isLoading = ref(false)

  const testCredentials: Record<UserRole, string> = {
    branch_manager: 'branch@example.com',
    track_admin: 'admin@example.com', // Track Admin for Cohort 1
    instructor: 'dexter.erdman@example.net', // Instructor for Abbie's Lab Group
    student: 'adeline.hansen@example.org', // Abbie Dietrich
  }

  const isAuthenticated = computed(() => token.value !== null && currentUser.value !== null)
  const userRole = computed(() => currentUser.value?.role ?? null)

  function authHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (token.value) headers.Authorization = `Bearer ${token.value}`
    return headers
  }

  // Fetch the authenticated profile from /auth/me (flat user + role-specific profile)
  async function fetchMe(): Promise<UserProfile | null> {
    if (!token.value) return null

    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'POST',
      headers: authHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      // Expired/invalid token returns 401 (SEC-2) — clear session
      if (response.status === 401) {
        clearSession()
      }
      throw new Error(data.message || 'Failed to fetch profile')
    }

    currentUser.value = data as UserProfile
    localStorage.setItem('auth_user', JSON.stringify(currentUser.value))
    return currentUser.value
  }

  async function loginAs(role: UserRole) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: testCredentials[role],
          password: 'password',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication operation failed')
      }

      // Login returns the token; profile comes from /auth/me
      // Always reset admin selection states when a fresh login occurs
      cohortContext.clearContext()

      token.value = data.access_token
      localStorage.setItem('auth_token', token.value!)

      await fetchMe()
    } catch (err: any) {
      error.value = err.message
      clearSession()
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      if (token.value) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: authHeaders(),
        })
      }
    } catch (err) {
      console.error('Logout request failed, clearing local session regardless:', err)
    } finally {
      clearSession()
      isLoading.value = false
    }
  }

  function clearSession() {
    currentUser.value = null
    token.value = null
    error.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    if (!currentUser.value) return false
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(currentUser.value.role)
    }
    return currentUser.value.role === allowedRoles
  }

  return {
    currentUser,
    token,
    isLoading,
    error,
    isAuthenticated,
    userRole,
    loginAs,
    logout,
    fetchMe,
    hasRole,
  }
})
