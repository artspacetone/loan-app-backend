"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "../types"
import { authService } from "../services/authService"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)

      // Check if user is stored in localStorage
      const storedUser = authService.getStoredUser()
      if (storedUser && authService.isAuthenticated()) {
        // Verify token is still valid by fetching current user
        const result = await authService.getCurrentUser()
        if (result.success && result.user) {
          setUser(result.user)
        } else {
          // Token invalid, clear stored data
          authService.logout()
          setUser(null)
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error)
      authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const result = await authService.login(username, password)

      if (result.success && result.user) {
        setUser(result.user)
        return true
      } else {
        console.error("Login failed:", result.error)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const result = await authService.getCurrentUser()
      if (result.success && result.user) {
        setUser(result.user)
      }
    } catch (error) {
      console.error("Refresh user error:", error)
    }
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false

    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Add this export at the end of the file;
