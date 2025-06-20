"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Package, TrendingUp, AlertTriangle, CheckCircle, Plus, Eye, Zap, Star } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { inventoryService } from "@/lib/services/inventory-service"

interface DashboardStats {
  totalItems: number
  lowStockItems: number
  pendingTransactions: number
  completedTransactions: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
  })
  const [recentItems, setRecentItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [statsData, itemsData] = await Promise.all([
        inventoryService.getDashboardStats(),
        inventoryService.getRecentItems(),
      ])
      setStats(statsData)
      setRecentItems(itemsData)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-200",
    },
    {
      title: "Low Stock Alert",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "from-yellow-400 to-yellow-500",
      bgColor: "bg-yellow-400/20",
      textColor: "text-yellow-200",
    },
    {
      title: "Pending Approval",
      value: stats.pendingTransactions,
      icon: TrendingUp,
      color: "from-orange-400 to-orange-500",
      bgColor: "bg-orange-400/20",
      textColor: "text-orange-200",
    },
    {
      title: "Completed",
      value: stats.completedTransactions,
      icon: CheckCircle,
      color: "from-green-400 to-green-500",
      bgColor: "bg-green-400/20",
      textColor: "text-green-200",
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-purple-200">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto relative">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-purple-900" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Welcome back, {user?.username}! 👋</h1>
                <p className="text-purple-300 text-lg">Here's what's happening with your inventory today</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card key={stat.title} className="glass-effect border-purple-300/30 card-hover relative overflow-hidden">
                <div className={`absolute inset-0 ${stat.bgColor} opacity-50`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-purple-200">{stat.title}</CardTitle>
                  <div
                    className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <p className={`text-xs ${stat.textColor}`}>
                    {stat.title === "Low Stock Alert" && stat.value > 0 ? "Needs attention" : "All good"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="glass-effect border-purple-300/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-purple-300">Frequently used actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full btn-primary justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Item
                </Button>
                <Button className="w-full btn-secondary justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Inventory
                </Button>
                <Button className="w-full btn-secondary justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Process Approvals
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect border-purple-300/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-purple-300">Latest inventory movements</CardDescription>
              </CardHeader>
              <CardContent>
                {recentItems.length > 0 ? (
                  <div className="space-y-3">
                    {recentItems.slice(0, 5).map((item: any, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 glass-effect rounded-lg border border-purple-300/20"
                      >
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-purple-300 text-sm">{item.category}</p>
                        </div>
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400/50">
                          {item.quantity} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-purple-300">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
