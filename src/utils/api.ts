import router from '@/router'
import { useAuthStore } from '@/stores/auth'

// Base structural interface for uniform server response payloads
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api'

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const auth = useAuthStore()
    
    // 1. Setup default system header rules + authorization injections
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    headers.set('Accept', 'application/json')
    
    // Inject mock token for the active developer profile context
    if (auth.isAuthenticated) {
      // headers.set('Authorization', `Bearer mock-token-for-${auth.userRole}`)
     headers.set('Authorization',`Bearer ${auth.token}`)
    }

    const config: RequestInit = {
      ...options,
      headers
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config)

      // 2. Global HTTP Error Guard Interceptors
      if (!response.ok) {
        if (response.status === 401) {
          auth.logout()
          router.replace({ name: 'Unauthorized' })
        } else if (response.status === 403) {
          router.replace({ name: 'Unauthorized' })
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP Operational Error: ${response.status}`)
      }

      // 3. Prevent structural crashes from empty parsing layers
      if (response.status === 204) return {} as T
      return await response.json() as T

    } catch (error) {
      console.error(`[API Network Core Fault] ${endpoint}:`, error)
      throw error
    }
  }

  // HTTP Protocol Binding Methods
  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  public post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    })
  }

  public put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    })
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  public patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
  return this.request<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body)
  }) //there are endpoints uses patch
}
}

export const api = new ApiClient()