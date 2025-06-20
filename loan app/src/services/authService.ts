import type { User } from "../types"

const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "https://your-backend-api.vercel.app/api" : "http://localhost:5000/api"

interface LoginResponse {
  success: boolean
  data?: {
    user: User
    access_token: string
    refresh_token: string
  }
  message: string
  errors?: any
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  errors?: any
}

// Safe localStorage wrapper for SSR
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
}

class AuthService {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    // Only load tokens on client side
    if (typeof window !== "undefined") {
      this.accessToken = safeLocalStorage.getItem("access_token")
      this.refreshToken = safeLocalStorage.getItem("refresh_token")
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data: LoginResponse = await response.json()

      if (data.success && data.data) {
        // Store tokens
        this.accessToken = data.data.access_token
        this.refreshToken = data.data.refresh_token

        safeLocalStorage.setItem("access_token", this.accessToken)
        safeLocalStorage.setItem("refresh_token", this.refreshToken)
        safeLocalStorage.setItem("user", JSON.stringify(data.data.user))

        return { success: true, user: data.data.user }
      } else {
        return { success: false, error: data.message || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error. Please try again." }
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.refreshToken}`,
          "Content-Type": "application/json",
        },
      })

      const data: ApiResponse<{ access_token: string }> = await response.json()

      if (data.success && data.data) {
        this.accessToken = data.data.access_token
        safeLocalStorage.setItem("access_token", this.accessToken)
        return true
      }
    } catch (error) {
      console.error("Token refresh error:", error)
    }

    return false
  }

  async makeAuthenticatedRequest<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const makeRequest = async (token: string): Promise<Response> => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }

    if (!this.accessToken) {
      throw new Error("No access token available")
    }

    let response = await makeRequest(this.accessToken)

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed && this.accessToken) {
        response = await makeRequest(this.accessToken)
      } else {
        // Refresh failed, logout user
        this.logout()
        throw new Error("Authentication failed")
      }
    }

    return response.json()
  }

  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const data = await this.makeAuthenticatedRequest<User>(`${API_BASE_URL}/auth/me`)

      if (data.success && data.data) {
        safeLocalStorage.setItem("user", JSON.stringify(data.data))
        return { success: true, user: data.data }
      } else {
        return { success: false, error: data.message || "Failed to get user info" }
      }
    } catch (error) {
      console.error("Get current user error:", error)
      return { success: false, error: "Failed to get user information" }
    }
  }

  logout(): void {
    this.accessToken = null
    this.refreshToken = null
    safeLocalStorage.removeItem("access_token")
    safeLocalStorage.removeItem("refresh_token")
    safeLocalStorage.removeItem("user")
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getStoredUser(): User | null {
    const userStr = safeLocalStorage.getItem("user")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  }

  getAccessToken(): string | null {
    return this.accessToken
  }
}

export const authService = new AuthService()
