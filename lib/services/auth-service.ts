import { apiClient } from "../api-client"
import type { User } from "../types"

export class AuthService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: { username: string; password: string }): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.login(credentials)

      if (response.token) {
        localStorage.setItem("authToken", response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem("user")
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error("Failed to get current user:", error)
      return null
    }
  }

  getToken(): string | null {
    return localStorage.getItem("authToken")
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  canApprove(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "admin" || user?.role === "supervisor"
  }
}

export const authService = AuthService.getInstance()
