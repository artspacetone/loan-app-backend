export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "inventory-management-super-secret-jwt-key-2024",
    expiresIn: "24h",
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || "",
    maxConnections: 10,
    connectionTimeout: 30000,
  },

  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Inventory Management System",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0",
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  },

  // Security
  security: {
    bcryptRounds: 12,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
  },
}

// Validate required environment variables
export function validateConfig() {
  const required = ["DATABASE_URL", "JWT_SECRET"]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  return true
}
