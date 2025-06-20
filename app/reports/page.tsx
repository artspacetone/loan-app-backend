"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: "ALL",
    type: "ALL",
    dateFrom: "",
    dateTo: "",
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
          setUser(JSON.parse(userData))
        }

        // Load transactions
        const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
        setTransactions(storedTransactions)
        setFilteredTransactions(storedTransactions)
      }
    } catch (err) {
      console.error("Auth error:", err)
      router.push("/login")
    }
  }, [router])

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)

    // Apply filters
    let filtered = transactions

    if (newFilters.status !== "ALL") {
      filtered = filtered.filter((t) => t.status === newFilters.status)
    }

    if (newFilters.type !== "ALL") {
      filtered = filtered.filter((t) => t.type === newFilters.type)
    }

    if (newFilters.dateFrom) {
      filtered = filtered.filter((t) => new Date(t.loanDate) >= new Date(newFilters.dateFrom))
    }

    if (newFilters.dateTo) {
      filtered = filtered.filter((t) => new Date(t.loanDate) <= new Date(newFilters.dateTo))
    }

    setFilteredTransactions(filtered)
  }

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diekspor")
      return
    }

    const headers = ["ID", "Nama Peminjam", "Program", "Jenis", "Status", "Tanggal Pinjam", "Deskripsi"]
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((t) =>
        [
          t.id,
          `"${t.borrowerName}"`,
          `"${t.program}"`,
          t.type,
          t.status,
          t.loanDate,
          `"${t.description.replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `laporan-transaksi-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING_APPROVAL: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Menunggu Persetujuan" },
      APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Disetujui" },
      REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Ditolak" },
      RETURNED: { bg: "bg-blue-100", text: "text-blue-800", label: "Dikembalikan" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
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
              <h1 className="text-3xl font-bold text-gray-900">Laporan Transaksi</h1>
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
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Filter Laporan</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="REJECTED">Ditolak</option>
                  <option value="RETURNED">Dikembalikan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="SHOW">SHOW</option>
                  <option value="EVENT">EVENT</option>
                  <option value="OFF_AIR">OFF AIR</option>
                  <option value="LAUNDRY">LAUNDRY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
              </div>
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                📊 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Daftar Transaksi</h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>Belum ada transaksi yang sesuai dengan filter</p>
              <button
                onClick={() => router.push("/outgoing")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Buat Transaksi Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peminjam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.borrowerName}</div>
                        <div className="text-sm text-gray-500">{transaction.borrowerPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.program}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.loanDate).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
