import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type UserRole = 'branch_manager' | 'track_admin' | 'instructor' | 'student'

export interface UserProfile {
  name: string
  email: string
  role: UserRole
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<UserProfile | null>({
    name: 'Sarah Jenkins',
    email: 'sarah.j@academy.com',
    role: 'track_admin'
  })

  const mockAccounts: UserProfile[] = [
    {
      name: 'Marcus Vance',
      email: 'marcus.v@academy.com',
      role: 'branch_manager'
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.j@academy.com',
      role: 'track_admin'
    },
    {
      name: 'Prof. Alan Turing',
      email: 'alan.t@academy.com',
      role: 'instructor'
    },
    {
      name: 'Alex Rivera',
      email: 'alex.r@student.com',
      role: 'student'
    }
  ]

  // Getters / Computed Properties
  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed(() => currentUser.value?.role ?? null)

  // Actions
  function loginAs(role: UserRole) {
    const account = mockAccounts.find(acc => acc.role === role)
    if (account) {
      currentUser.value = { ...account }
    }
  }

  function logout() {
    currentUser.value = null
  }

  // RBAC Helper:
  function hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    if (!currentUser.value) return false
    
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(currentUser.value.role)
    }
    
    return currentUser.value.role === allowedRoles
  }

  return {
    currentUser,
    mockAccounts,
    isAuthenticated,
    userRole,
    loginAs,
    logout,
    hasRole
  }
})