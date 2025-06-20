"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = apiClient.getToken()
    const savedUser = localStorage.getItem("user")

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        apiClient.clearToken()
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      console.log("🔐 AuthProvider: Attempting login...")

      const response = await apiClient.login({ username, password })

      if (response.success && response.data) {
        const { token, user: userData } = response.data

        // Save token and user data
        apiClient.setToken(token)
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))

        console.log("✅ AuthProvider: Login successful")
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error) {
      console.error("❌ AuthProvider: Login failed:", error)
      throw error
    }
  }

  const logout = () => {
    apiClient.clearToken()
    setUser(null)
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
