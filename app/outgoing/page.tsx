"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OutgoingPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalLink, setApprovalLink] = useState("")
  const [currentTransaction, setCurrentTransaction] = useState<any>(null)
  const [formData, setFormData] = useState({
    // Transaction Details
    transactionNumber: "",
    programName: "",
    transactionType: "SHOW",
    borrowDate: new Date().toISOString().split("T")[0],
    deadlineDate: "",

    // Item Details
    itemPhoto: null as File | null,
    itemDescription: "",
    itemQuantity: 1,

    // Borrower Details
    borrowerNIK: "",
    borrowerName: "",
    borrowerPosition: "",
    borrowerPhone: "",
    supervisorName: "",
    supervisorPhone: "",
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

        // Generate transaction number
        generateTransactionNumber()
      }
    } catch (err) {
      console.error("Auth error:", err)
      router.push("/login")
    }
  }, [router])

  const generateTransactionNumber = () => {
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
    const timeStr = today.getHours().toString().padStart(2, "0") + today.getMinutes().toString().padStart(2, "0")
    const transactionNumber = `${dateStr}-${timeStr}`

    setFormData((prev) => ({
      ...prev,
      transactionNumber,
    }))
  }

  const calculateDeadline = (borrowDate: string) => {
    const date = new Date(borrowDate)
    date.setDate(date.getDate() + 14) // 14 days deadline
    return date.toISOString().split("T")[0]
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "borrowDate") {
      const deadline = calculateDeadline(value)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        deadlineDate: deadline,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB!")
        return
      }

      setFormData((prev) => ({ ...prev, itemPhoto: file }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateApprovalLink = (transactionId: string) => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin
      return `${baseUrl}/approval/${transactionId}`
    }
    return ""
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        alert("Link berhasil disalin ke clipboard!")
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand("copy")
          alert("Link berhasil disalin!")
        } catch (err) {
          console.error("Fallback copy failed:", err)
          // Show the link in a prompt as last resort
          prompt("Salin link ini:", text)
        }

        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.error("Failed to copy:", err)
      // Show the link in a prompt as fallback
      prompt("Salin link ini:", text)
    }
  }

  const sendWhatsAppLink = (phone: string, link: string, borrowerName: string, programName: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone

    const message = `Halo ${borrowerName},

Anda memiliki permintaan peminjaman barang untuk program "${programName}".

Silakan klik link berikut untuk approval:
${link}

Terima kasih.`

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.itemPhoto) {
        alert("Foto barang wajib diupload!")
        setIsLoading(false)
        return
      }

      if (!formData.programName || !formData.itemDescription || !formData.borrowerNIK || !formData.borrowerName) {
        alert("Semua field wajib diisi!")
        setIsLoading(false)
        return
      }

      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}`

      // Create transaction object
      const transaction = {
        id: transactionId,
        transactionNumber: formData.transactionNumber,
        programName: formData.programName,
        transactionType: formData.transactionType,
        borrowDate: formData.borrowDate,
        deadlineDate: formData.deadlineDate,

        // Item details
        itemPhoto: imagePreview, // Base64 image
        itemDescription: formData.itemDescription,
        itemQuantity: formData.itemQuantity,

        // Borrower details
        borrowerNIK: formData.borrowerNIK,
        borrowerName: formData.borrowerName,
        borrowerPosition: formData.borrowerPosition,
        borrowerPhone: formData.borrowerPhone,
        supervisorName: formData.supervisorName,
        supervisorPhone: formData.supervisorPhone,

        // Status and metadata
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
        createdBy: user.username,
        adminId: user.id || user.username,
      }

      // Save to localStorage
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      transactions.push(transaction)
      localStorage.setItem("transactions", JSON.stringify(transactions))

      // Generate approval link
      const link = generateApprovalLink(transactionId)

      // Set state for modal
      setCurrentTransaction(transaction)
      setApprovalLink(link)
      setShowApprovalModal(true)
    } catch (error) {
      console.error("Error creating transaction:", error)
      alert("Gagal membuat transaksi. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowApprovalModal(false)

    // Reset form
    setFormData({
      transactionNumber: "",
      programName: "",
      transactionType: "SHOW",
      borrowDate: new Date().toISOString().split("T")[0],
      deadlineDate: "",
      itemPhoto: null,
      itemDescription: "",
      itemQuantity: 1,
      borrowerNIK: "",
      borrowerName: "",
      borrowerPosition: "",
      borrowerPhone: "",
      supervisorName: "",
      supervisorPhone: "",
    })
    setImagePreview(null)
    generateTransactionNumber()
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
              <h1 className="text-3xl font-bold text-gray-900">OUTGOING - Peminjaman Barang</h1>
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

      {/* Form */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Form Peminjaman Barang (OUTGOING)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Deadline otomatis 14 hari dari tanggal pinjam. Peminjam akan diblacklist di hari ke-15.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Transaction Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Transaksi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Transaksi *</label>
                  <input
                    type="text"
                    name="transactionNumber"
                    value={formData.transactionNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Auto generate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Program *</label>
                  <input
                    type="text"
                    name="programName"
                    value={formData.programName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama program/acara"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Peminjaman *</label>
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SHOW">SHOW</option>
                    <option value="EVENT">EVENT</option>
                    <option value="OFF_AIR">OFF AIR</option>
                    <option value="LAUNDRY">LAUNDRY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Pinjam *</label>
                  <input
                    type="date"
                    name="borrowDate"
                    value={formData.borrowDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline (Auto)</label>
                  <input
                    type="date"
                    name="deadlineDate"
                    value={formData.deadlineDate}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Barang</h3>

              {/* Photo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto Barang * (Max 2MB)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="mb-4">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null)
                            setFormData((prev) => ({ ...prev, itemPhoto: null }))
                          }}
                          className="mt-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload foto barang</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                          required={!imagePreview}
                        />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Barang *</label>
                  <textarea
                    name="itemDescription"
                    value={formData.itemDescription}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deskripsi detail barang yang dipinjam (merk, model, kondisi, dll)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (QTY) *</label>
                  <input
                    type="number"
                    name="itemQuantity"
                    value={formData.itemQuantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Borrower Details */}
            <div className="pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Peminjam (Borrower)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
                  <input
                    type="text"
                    name="borrowerNIK"
                    value={formData.borrowerNIK}
                    onChange={handleInputChange}
                    required
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="16 digit NIK"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                  <input
                    type="text"
                    name="borrowerName"
                    value={formData.borrowerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama lengkap peminjam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jabatan *</label>
                  <input
                    type="text"
                    name="borrowerPosition"
                    value={formData.borrowerPosition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jabatan/posisi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. HP *</label>
                  <input
                    type="tel"
                    name="borrowerPhone"
                    value={formData.borrowerPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Atasan *</label>
                  <input
                    type="text"
                    name="supervisorName"
                    value={formData.supervisorName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama atasan langsung"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. HP Atasan *</label>
                  <input
                    type="tel"
                    name="supervisorPhone"
                    value={formData.supervisorPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </div>
                ) : (
                  "Buat Peminjaman & Generate Link"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Approval Link Modal */}
      {showApprovalModal && currentTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">✅ Transaksi Berhasil Dibuat!</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Transaction Summary */}
              <div className="py-4 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Transaksi Berhasil Dibuat</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          <strong>ID:</strong> {currentTransaction.id}
                        </p>
                        <p>
                          <strong>Nomor:</strong> {currentTransaction.transactionNumber}
                        </p>
                        <p>
                          <strong>Program:</strong> {currentTransaction.programName}
                        </p>
                        <p>
                          <strong>Peminjam:</strong> {currentTransaction.borrowerName}
                        </p>
                        <p>
                          <strong>Status:</strong> Menunggu Persetujuan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Link */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Link Approval:</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={approvalLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(approvalLink)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button
                  onClick={() =>
                    sendWhatsAppLink(
                      currentTransaction.borrowerPhone,
                      approvalLink,
                      currentTransaction.borrowerName,
                      currentTransaction.programName,
                    )
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center"
                >
                  📱 Kirim via WhatsApp
                </button>

                <button
                  onClick={() => copyToClipboard(approvalLink)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center"
                >
                  📋 Copy Link
                </button>

                <button
                  onClick={() => window.open(approvalLink, "_blank")}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center"
                >
                  🔗 Test Link
                </button>
              </div>

              {/* Close Button */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md font-medium"
                >
                  Tutup & Buat Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
