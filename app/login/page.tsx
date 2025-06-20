"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Package, Zap, Shield, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { apiClient } from "@/lib/api-client"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking")

  const { login } = useAuth()
  const router = useRouter()

  // Check backend connection on mount
  useEffect(() => {
    checkConnection()
    // Check connection every 5 seconds if disconnected
    const interval = setInterval(() => {
      if (connectionStatus === "disconnected") {
        checkConnection()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [connectionStatus])

  const checkConnection = async () => {
    try {
      setConnectionStatus("checking")
      console.log("🔍 Checking backend connection...")

      const isConnected = await apiClient.testConnection()
      setConnectionStatus(isConnected ? "connected" : "disconnected")

      if (!isConnected) {
        setError("Cannot connect to backend server. Please make sure the backend is running on http://localhost:5000")
      } else {
        setError("")
      }
    } catch (error) {
      console.error("Connection check failed:", error)
      setConnectionStatus("disconnected")
      setError("Failed to check backend connection")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (connectionStatus !== "connected") {
      setError("Backend server is not available. Please start the backend first.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("🔐 Login attempt:", { username })
      await login(username, password)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("❌ Login failed:", err)
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError("")
  }

  const ConnectionStatus = () => {
    switch (connectionStatus) {
      case "checking":
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking backend connection...</span>
          </div>
        )
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Backend connected</span>
          </div>
        )
      case "disconnected":
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Backend disconnected</span>
            <Button variant="outline" size="sm" onClick={checkConnection} className="ml-2 h-6 px-2 text-xs">
              Retry
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-500/30 to-violet-500/30 rounded-lg rotate-45 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Connection Status Card */}
        <Card className="glass-effect border-purple-300/30">
          <CardContent className="pt-6">
            <ConnectionStatus />
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="glass-effect border-purple-300/30">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-purple-900" />
            </div>
            <CardTitle className="text-3xl font-bold gradient-text">INVENTORY SYSTEM</CardTitle>
            <CardDescription className="text-purple-200">Sistem Manajemen Inventori Modern</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-purple-200 font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-effect border-purple-300/50 text-white placeholder:text-purple-300 focus:border-yellow-400"
                  placeholder="Masukkan username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-200 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-effect border-purple-300/50 text-white placeholder:text-purple-300 focus:border-yellow-400 pr-10"
                    placeholder="Masukkan password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-purple-300 hover:text-yellow-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-500/20 border-red-400/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isLoading || connectionStatus !== "connected"}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-900 border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    LOGIN
                  </div>
                )}
              </Button>
            </form>

            <div className="space-y-3">
              <div className="text-center text-purple-300 text-sm font-medium">Quick Login untuk Testing:</div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("admin", "admin123")}
                  className="btn-secondary text-xs"
                  disabled={connectionStatus !== "connected"}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("supervisor", "super123")}
                  className="btn-secondary text-xs"
                  disabled={connectionStatus !== "connected"}
                >
                  Supervisor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("user", "user123")}
                  className="btn-secondary text-xs"
                  disabled={connectionStatus !== "connected"}
                >
                  User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backend Instructions */}
        {connectionStatus === "disconnected" && (
          <Card className="glass-effect border-red-400/30">
            <CardHeader>
              <CardTitle className="text-lg text-red-400">Backend Not Running</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-purple-200">
              <p>Please start the backend server:</p>
              <div className="bg-black/30 p-3 rounded font-mono text-xs">
                <div>cd inventory-backend</div>
                <div>python src/main.py</div>
              </div>
              <p>
                Backend should be running on: <span className="text-yellow-400">http://localhost:5000</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
