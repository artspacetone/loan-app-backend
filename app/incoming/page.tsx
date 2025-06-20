"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function IncomingListPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

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
      loadTransactions()
    }
  }, [router])

  const loadTransactions = () => {
    try {
      const allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      setTransactions(allTransactions)
    } catch (err) {
      console.error("Error loading transactions:", err)
    }
  }

  const activeBorrowings = useMemo(() => {
    return transactions
      .filter((t) => t.status === "PENDING_APPROVAL" || t.status === "NVL")
      .filter((t) => {
        if (!searchTerm) return true
        const lowerSearchTerm = searchTerm.toLowerCase()
        return (
          t.transactionNumber.toLowerCase().includes(lowerSearchTerm) ||
          t.borrowerName.toLowerCase().includes(lowerSearchTerm) ||
          t.programName.toLowerCase().includes(lowerSearchTerm) ||
          t.itemDescription.toLowerCase().includes(lowerSearchTerm)
        )
      })
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
  }, [transactions, searchTerm])

  const isOverdue = (deadline: string): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    return deadlineDate < today
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
              <h1 className="text-3xl font-bold text-gray-900">INCOMING - Pengembalian Barang</h1>
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

      {/* Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Transaksi Aktif</h2>
            <p className="text-sm text-gray-600 mt-1">Approve permintaan baru atau proses pengembalian barang.</p>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              placeholder="Cari berdasarkan Nomor Transaksi, Peminjam, Program, Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          {activeBorrowings.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900">Tidak Ada Transaksi Aktif</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm
                  ? "Tidak ada transaksi yang cocok dengan pencarian."
                  : "Saat ini tidak ada item yang menunggu approval atau pengembalian."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Info Transaksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peminjam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeBorrowings.map((tx) => {
                    const itemOverdue = tx.status === "NVL" && isOverdue(tx.deadlineDate)

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>{tx.transactionNumber}</div>
                          <div className="text-xs text-gray-500 font-normal">Program: {tx.programName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {tx.itemDescription} (Qty: {tx.itemQuantity})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div>{tx.borrowerName}</div>
                          <div className="text-xs text-gray-500">NIK: {tx.borrowerNIK}</div>
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${itemOverdue ? "text-red-600 font-semibold" : "text-gray-700"}`}
                        >
                          {new Date(tx.deadlineDate).toLocaleDateString("id-ID")}
                          {itemOverdue && <div className="text-xs text-red-500">OVERDUE</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tx.status === "PENDING_APPROVAL"
                                ? "bg-yellow-100 text-yellow-800"
                                : itemOverdue
                                  ? "bg-red-100 text-red-800"
                                  : tx.status === "NVL"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tx.status === "PENDING_APPROVAL"
                              ? "Menunggu Approval"
                              : itemOverdue
                                ? "OVERDUE"
                                : tx.status === "NVL"
                                  ? "Dipinjam"
                                  : tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {tx.status === "PENDING_APPROVAL" ? (
                            <Link href={`/approval/${tx.id}`}>
                              <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                                Go to Approval
                              </button>
                            </Link>
                          ) : (
                            <button
                              onClick={() => router.push(`/incoming/form/${tx.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Process Return
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
