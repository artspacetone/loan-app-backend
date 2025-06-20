// API Configuration - Fixed URL detection
export const API_BASE_URL = (() => {
  // Always use localhost for development
  if (typeof window !== "undefined") {
    return "http://localhost:5000"
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
})()

// Default credentials for testing
export const DEFAULT_CREDENTIALS = {
  admin: { username: "admin", password: "admin123" },
  supervisor: { username: "supervisor", password: "super123" },
  user: { username: "user", password: "user123" },
}

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  PROFILE: "/api/users/profile",
  HEALTH: "/api/health",
  INVENTORY: "/api/inventory",
  TRANSACTIONS: "/api/transactions",
  DASHBOARD: "/api/dashboard/stats",
}

console.log("🔧 API Base URL:", API_BASE_URL)
