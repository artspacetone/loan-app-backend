interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    // Add authorization header if token exists
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && this.token) {
          this.clearToken()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          throw new Error("Session expired. Please login again.")
        }

        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error) {
      console.error("API Request failed:", error)
      throw error
    }
  }

  // Authentication methods
  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
    }
  }

  getToken(): string | null {
    return this.token
  }

  // Auth methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request("/api/auth/logout", {
      method: "POST",
    })
  }

  // Dashboard methods
  async getDashboardStats(): Promise<ApiResponse> {
    return this.request("/api/dashboard/stats")
  }

  // User methods
  async getUserProfile(): Promise<ApiResponse> {
    return this.request("/api/users/profile")
  }

  // Inventory methods
  async getInventoryItems(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)

    const query = queryParams.toString()
    return this.request(`/api/inventory${query ? `?${query}` : ""}`)
  }

  async createInventoryItem(item: any): Promise<ApiResponse> {
    return this.request("/api/inventory", {
      method: "POST",
      body: JSON.stringify(item),
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request("/api/health")
  }
}

export const apiClient = new ApiClient()
