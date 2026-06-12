import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCohortContextStore } from './cohortContext' // Import context to clear it

export type UserRole = 'branch_manager' | 'track_admin' | 'instructor' | 'student'

export interface UserProfile {
  id?: number
  name: string
  email: string
  role: UserRole
  expires_at?: string | null
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
    track_admin: 'ldare@example.net',
    instructor: 'instructor@example.com',
    student: 'student@example.com',
  }

  const isAuthenticated = computed(() => token.value !== null && currentUser.value !== null)
  const userRole = computed(() => currentUser.value?.role ?? null)

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

      // Always reset admin selection states when a fresh login occurs
      cohortContext.clearContext()

      token.value = data.access_token
      currentUser.value = {
        id: data.user.id,
        name: data.user.name,
        email: testCredentials[role],
        role: data.role,
        expires_at: data.expires_at,
      }

      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(currentUser.value))
    } catch (err: any) {
      error.value = err.message
      currentUser.value = null
      token.value = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
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
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token.value}`,
          },
        })
      }
    } catch (err) {
      console.error('Logout request failed, clearing local session regardless:', err)
    } finally {
      // Clear all active context models out of local pins on exit
      cohortContext.clearContext()
      
      currentUser.value = null
      token.value = null
      error.value = null
      isLoading.value = false
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
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
    hasRole,
  }
})
