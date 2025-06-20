// Auto-configuration system
class AutoConfig {
  private static instance: AutoConfig
  private config: any = {}

  private constructor() {
    this.initializeConfig()
  }

  public static getInstance(): AutoConfig {
    if (!AutoConfig.instance) {
      AutoConfig.instance = new AutoConfig()
    }
    return AutoConfig.instance
  }

  private initializeConfig() {
    // Auto-detect environment
    const isProduction = process.env.NODE_ENV === "production"
    const isDevelopment = process.env.NODE_ENV === "development"
    const isClient = typeof window !== "undefined"

    // Base configuration
    this.config = {
      // API Configuration
      api: {
        baseUrl: this.getApiUrl(),
        timeout: 30000,
        retries: 3,
        headers: {
          "Content-Type": "application/json",
        },
      },

      // Authentication
      auth: {
        tokenKey: "auth_token",
        refreshKey: "refresh_token",
        userKey: "user_data",
        tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
        autoRefresh: true,
      },

      // Application settings
      app: {
        name: "Inventory Management System",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        debug: isDevelopment,
        logging: {
          level: isDevelopment ? "debug" : "info",
          console: isDevelopment,
          remote: isProduction,
        },
      },

      // UI Configuration
      ui: {
        theme: "system", // light, dark, system
        animations: true,
        sidebar: {
          collapsed: false,
          width: 280,
        },
        pagination: {
          defaultSize: 20,
          sizes: [10, 20, 50, 100],
        },
        notifications: {
          position: "top-right",
          duration: 5000,
          maxVisible: 5,
        },
      },

      // Features
      features: {
        multiLanguage: true,
        darkMode: true,
        notifications: true,
        analytics: isProduction,
        debugging: isDevelopment,
        autoSave: true,
        offlineMode: false,
      },

      // Storage
      storage: {
        type: "localStorage", // localStorage, sessionStorage, indexedDB
        prefix: "inventory_",
        encryption: isProduction,
      },

      // Network
      network: {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        offlineDetection: true,
      },
    }

    // Auto-configure based on environment
    this.autoConfigureEnvironment()
  }

  private getApiUrl(): string {
    // Auto-detect API URL
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location
      return process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}:5000`
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  }

  private autoConfigureEnvironment() {
    const isProduction = process.env.NODE_ENV === "production"
    const isDevelopment = process.env.NODE_ENV === "development"

    if (isProduction) {
      // Production optimizations
      this.config.api.timeout = 60000
      this.config.ui.animations = false
      this.config.features.debugging = false
      this.config.network.retries = 5
    }

    if (isDevelopment) {
      // Development optimizations
      this.config.api.timeout = 10000
      this.config.features.debugging = true
      this.config.app.logging.console = true
    }

    // Auto-detect capabilities
    if (typeof window !== "undefined") {
      // Check for offline capability
      this.config.features.offlineMode = "serviceWorker" in navigator

      // Check for storage capability
      try {
        localStorage.setItem("test", "test")
        localStorage.removeItem("test")
        this.config.storage.type = "localStorage"
      } catch (e) {
        this.config.storage.type = "memory"
      }

      // Check for dark mode preference
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        this.config.ui.theme = "dark"
      }
    }
  }

  public get(key: string, defaultValue?: any): any {
    const keys = key.split(".")
    let value = this.config

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        return defaultValue
      }
    }

    return value
  }

  public set(key: string, value: any): void {
    const keys = key.split(".")
    let target = this.config

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in target)) {
        target[k] = {}
      }
      target = target[k]
    }

    target[keys[keys.length - 1]] = value
  }

  public getAll(): any {
    return { ...this.config }
  }

  public reset(): void {
    this.initializeConfig()
  }
}

// Export singleton instance
export const autoConfig = AutoConfig.getInstance()

// Export commonly used configurations
export const apiConfig = autoConfig.get("api")
export const authConfig = autoConfig.get("auth")
export const appConfig = autoConfig.get("app")
export const uiConfig = autoConfig.get("ui")
export const featureConfig = autoConfig.get("features")
