"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.id as string

  const [mounted, setMounted] = useState(false)
  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationData, setVerificationData] = useState({
    nik: "",
    phone: "",
  })
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
    loadTransaction()
  }, [transactionId])

  const loadTransaction = () => {
    try {
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const foundTransaction = transactions.find((t: any) => t.id === transactionId)

      if (foundTransaction) {
        setTransaction(foundTransaction)
      } else {
        setError("Transaksi tidak ditemukan")
      }
    } catch (err) {
      console.error("Error loading transaction:", err)
      setError("Gagal memuat data transaksi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault()

    if (!transaction) return

    // Verify NIK and phone
    if (verificationData.nik === transaction.borrowerNIK && verificationData.phone === transaction.borrowerPhone) {
      setIsVerified(true)
      setError("")
    } else {
      setError("NIK atau No. HP tidak sesuai dengan data peminjaman")
    }
  }

  const handleApproval = async (approved: boolean) => {
    setIsSubmitting(true)

    try {
      // Update transaction status
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const updatedTransactions = transactions.map((t: any) => {
        if (t.id === transactionId) {
          return {
            ...t,
            status: approved ? "NVL" : "REJECTED", // NVL = Dipinjam
            borrowerApproved: approved,
            approvedAt: new Date().toISOString(),
          }
        }
        return t
      })

      localStorage.setItem("transactions", JSON.stringify(updatedTransactions))

      if (approved) {
        // Redirect to print page
        alert("Peminjaman disetujui! Halaman print akan terbuka.")
        router.push(`/print/outgoing/${transactionId}`)
      } else {
        alert("Peminjaman ditolak.")
        // Could redirect to a rejection confirmation page
      }
    } catch (error) {
      console.error("Error processing approval:", error)
      alert("Gagal memproses approval. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Tidak Ditemukan</h1>
          <p className="text-gray-600">ID transaksi tidak valid atau sudah tidak tersedia.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Approval Peminjaman Barang</h1>
          <p className="text-gray-600 mt-2">Silakan verifikasi identitas Anda untuk melanjutkan</p>
        </div>

        {!isVerified ? (
          /* Verification Form */
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Verifikasi Identitas</h2>
            </div>

            <form onSubmit={handleVerification} className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
                  <input
                    type="text"
                    value={verificationData.nik}
                    onChange={(e) => setVerificationData((prev) => ({ ...prev, nik: e.target.value }))}
                    required
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan NIK Anda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. HP *</label>
                  <input
                    type="tel"
                    value={verificationData.phone}
                    onChange={(e) => setVerificationData((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan No. HP Anda"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Approval Form */
          <div className="space-y-6">
            {/* Transaction Details */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Detail Peminjaman</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nomor Transaksi</h3>
                    <p className="mt-1 text-sm text-gray-900">{transaction.transactionNumber}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Program</h3>
                    <p className="mt-1 text-sm text-gray-900">{transaction.programName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Jenis</h3>
                    <p className="mt-1 text-sm text-gray-900">{transaction.transactionType}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tanggal Pinjam</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(transaction.borrowDate).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Deadline</h3>
                    <p className="mt-1 text-sm text-red-600 font-medium">
                      {new Date(transaction.deadlineDate).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Jumlah</h3>
                    <p className="mt-1 text-sm text-gray-900">{transaction.itemQuantity} unit</p>
                  </div>
                </div>

                {/* Item Photo */}
                {transaction.itemPhoto && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Foto Barang</h3>
                    <img
                      src={transaction.itemPhoto || "/placeholder.svg"}
                      alt="Item"
                      className="w-full max-w-md h-48 object-cover rounded-md border"
                    />
                  </div>
                )}

                {/* Item Description */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Deskripsi Barang</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{transaction.itemDescription}</p>
                </div>
              </div>
            </div>

            {/* Approval Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Konfirmasi Peminjaman</h2>
                <p className="text-sm text-gray-600 mt-1">Apakah Anda setuju dengan detail peminjaman di atas?</p>
              </div>

              <div className="p-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproval(true)}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Memproses..." : "✅ Setujui Peminjaman"}
                  </button>

                  <button
                    onClick={() => handleApproval(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Memproses..." : "❌ Tolak Peminjaman"}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Dengan menyetujui, Anda bertanggung jawab untuk mengembalikan barang sesuai deadline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
