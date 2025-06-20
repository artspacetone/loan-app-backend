"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, FileText, Users, Settings, LogOut, BarChart3, CheckSquare, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Outgoing Items", href: "/outgoing", icon: Package },
  { name: "Incoming Items", href: "/incoming", icon: FileText },
  { name: "Approval", href: "/approval", icon: CheckSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "ADMIN"
    }
    return true
  })

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-purple-900 via-purple-800 to-violet-900 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-xl"></div>
      </div>

      <div className="flex h-16 shrink-0 items-center px-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-900" />
          </div>
          <h1 className="text-xl font-bold gradient-text">Inventory System</h1>
        </div>
      </div>

      <nav className="flex flex-1 flex-col px-4 pb-4 relative z-10">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 shadow-lg shadow-yellow-400/25"
                          : "text-purple-200 hover:text-white hover:bg-white/10 glass-effect border border-transparent hover:border-purple-300/30",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-purple-900" : "text-purple-300 group-hover:text-white",
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>

          <li className="mt-auto">
            <div className="border-t border-purple-600/50 pt-4">
              <div className="glass-effect rounded-xl p-3 mb-3 border border-purple-300/30">
                <div className="flex items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-purple-300">{user?.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start text-purple-200 hover:text-white hover:bg-red-500/20 hover:border-red-400/30 glass-effect border border-transparent transition-all duration-300"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}
