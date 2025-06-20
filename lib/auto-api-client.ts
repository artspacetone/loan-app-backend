import { autoConfig } from "./auto-config"

interface AutoApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

class AutoApiClient {
  private static instance: AutoApiClient
  private config: any
  private token: string | null = null
  private retryCount = 0
  private isOnline = true

  private constructor() {
    this.config = autoConfig.get("api")
    this.initializeClient()
  }

  public static getInstance(): AutoApiClient {
    if (!AutoApiClient.instance) {
      AutoApiClient.instance = new AutoApiClient()
    }
    return AutoApiClient.instance
  }

  private initializeClient() {
    // Auto-load token
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(autoConfig.get("auth.tokenKey"))

      // Auto-detect online status
      window.addEventListener("online", () => {
        this.isOnline = true
        this.onConnectionRestored()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
        this.onConnectionLost()
      })
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<AutoApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`

    // Auto-retry logic
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const config: RequestInit = {
          ...options,
          headers: {
            ...this.config.headers,
            ...options.headers,
          },
          signal: AbortSignal.timeout(this.config.timeout),
        }

        // Auto-add auth token
        if (this.token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.token}`,
          }
        }

        const response = await fetch(url, config)
        const data = await response.json()

        if (!response.ok) {
          // Auto-handle auth errors
          if (response.status === 401) {
            await this.handleAuthError()
            throw new Error("Authentication failed")
          }

          throw new Error(data.message || data.error || `HTTP ${response.status}`)
        }

        // Reset retry count on success
        this.retryCount = 0
        return data
      } catch (error) {
        console.error(`API request failed (attempt ${attempt + 1}):`, error)

        // Don't retry on auth errors
        if (error instanceof Error && error.message.includes("Authentication")) {
          throw error
        }

        // Retry logic
        if (attempt < this.config.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff
          await this.delay(delay)
          continue
        }

        throw error
      }
    }

    throw new Error("Max retries exceeded")
  }

  private async handleAuthError() {
    this.clearAuth()
    if (typeof window !== "undefined") {
      // Auto-redirect to login
      window.location.href = "/login"
    }
  }

  private onConnectionRestored() {
    console.log("Connection restored - resuming API calls")
    // Could implement offline queue processing here
  }

  private onConnectionLost() {
    console.log("Connection lost - API calls will be queued")
    // Could implement offline queue here
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Auth methods
  public setAuth(token: string, user?: any) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem(autoConfig.get("auth.tokenKey"), token)
      if (user) {
        localStorage.setItem(autoConfig.get("auth.userKey"), JSON.stringify(user))
      }
    }
  }

  public clearAuth() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem(autoConfig.get("auth.tokenKey"))
      localStorage.removeItem(autoConfig.get("auth.userKey"))
    }
  }

  public getAuth(): { token: string | null; user: any } {
    let user = null
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem(autoConfig.get("auth.userKey"))
      if (userData) {
        try {
          user = JSON.parse(userData)
        } catch (e) {
          console.error("Failed to parse user data:", e)
        }
      }
    }
    return { token: this.token, user }
  }

  // Auto-retry wrapper for common operations
  private async autoRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        if (attempt < this.config.retries) {
          await this.delay(1000 * (attempt + 1))
        }
      }
    }

    throw lastError
  }

  // API Methods with auto-retry
  public async login(credentials: { username: string; password: string }) {
    return this.autoRetry(() =>
      this.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    )
  }

  public async getDashboardStats() {
    return this.autoRetry(() => this.request("/api/dashboard/stats"))
  }

  public async getInventory(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.autoRetry(() => this.request(`/api/inventory${query}`))
  }

  public async createInventoryItem(item: any) {
    return this.autoRetry(() =>
      this.request("/api/inventory", {
        method: "POST",
        body: JSON.stringify(item),
      }),
    )
  }

  public async getTransactions(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.autoRetry(() => this.request(`/api/transactions${query}`))
  }

  public async createTransaction(transaction: any) {
    return this.autoRetry(() =>
      this.request("/api/transactions", {
        method: "POST",
        body: JSON.stringify(transaction),
      }),
    )
  }

  public async updateTransactionStatus(id: string, status: string, notes?: string) {
    return this.autoRetry(() =>
      this.request(`/api/transactions/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      }),
    )
  }

  public async getUserProfile() {
    return this.autoRetry(() => this.request("/api/users/profile"))
  }

  // Health check with auto-recovery
  public async healthCheck() {
    try {
      const response = await this.request("/api/health")
      return response
    } catch (error) {
      console.error("Health check failed:", error)
      return { success: false, message: "Service unavailable" }
    }
  }
}

// Export singleton
export const autoApiClient = AutoApiClient.getInstance()
