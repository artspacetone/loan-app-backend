"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    role: "USER",
    password: "",
  })
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token")
        const userData = localStorage.getItem("user")

        if (!token) {
          router.push("/login")
          return
        }

        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)

          // Only admin can access user management
          if (parsedUser.role !== "ADMIN") {
            alert("Akses ditolak. Hanya admin yang dapat mengelola user.")
            router.push("/dashboard")
            return
          }
        }

        // Load users from localStorage
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]")
        if (storedUsers.length === 0) {
          // Initialize with default users
          const defaultUsers = [
            { id: 1, username: "admin", name: "Administrator", role: "ADMIN", createdAt: new Date().toISOString() },
            {
              id: 2,
              username: "supervisor",
              name: "Supervisor",
              role: "SUPERVISOR",
              createdAt: new Date().toISOString(),
            },
            { id: 3, username: "user1", name: "User 1", role: "USER", createdAt: new Date().toISOString() },
          ]
          localStorage.setItem("users", JSON.stringify(defaultUsers))
          setUsers(defaultUsers)
        } else {
          setUsers(storedUsers)
        }
      }
    } catch (err) {
      console.error("Auth error:", err)
      router.push("/login")
    }
  }, [router])

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newUser.username || !newUser.name || !newUser.password) {
      alert("Semua field harus diisi!")
      return
    }

    // Check if username already exists
    if (users.some((u) => u.username === newUser.username)) {
      alert("Username sudah digunakan!")
      return
    }

    const userToAdd = {
      id: Date.now(),
      ...newUser,
      createdAt: new Date().toISOString(),
    }

    const updatedUsers = [...users, userToAdd]
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    // Reset form
    setNewUser({
      username: "",
      name: "",
      role: "USER",
      password: "",
    })
    setShowAddForm(false)

    alert("User berhasil ditambahkan!")
  }

  const handleDeleteUser = (userId: number) => {
    if (userId === 1) {
      alert("Admin utama tidak dapat dihapus!")
      return
    }

    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      const updatedUsers = users.filter((u) => u.id !== userId)
      setUsers(updatedUsers)
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      alert("User berhasil dihapus!")
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { bg: "bg-red-100", text: "text-red-800", label: "Admin" },
      SUPERVISOR: { bg: "bg-blue-100", text: "text-blue-800", label: "Supervisor" },
      USER: { bg: "bg-green-100", text: "text-green-800", label: "User" },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: role,
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Kembali ke Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Kelola User</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.name || user.username}</span>
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push("/login")
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add User Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            {showAddForm ? "Batal" : "➕ Tambah User"}
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Tambah User Baru</h2>
            </div>
            <form onSubmit={handleAddUser} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Username unik"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">User</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  Tambah User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Daftar User ({users.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {userItem.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userItem.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(userItem.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(userItem.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {userItem.id !== 1 && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
