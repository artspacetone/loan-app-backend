export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "inventory-management-super-secret-jwt-key-2024-fallback",
    expiresIn: "24h",
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || "",
    maxConnections: 10,
    connectionTimeout: 30000,
  },

  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: proSUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
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
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error("❌ Missing environment variables:", missing)
    return {
      success: false,
      missing,
      message: `Missing required environment variables: ${missing.join(", ")}`,
    }
  }

  console.log("✅ All environment variables are configured")
  return {
    success: true,
    message: "Configuration is valid",
  }
}

// Get config with validation
export function getValidatedConfig() {
  const validation = validateConfig()

  if (!validation.success) {
    throw new Error(validation.message)
  }

  return config
}
