"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useTransactions } from "../contexts/TransactionContext"
import Layout from "../components/Layout"
import PageTitle from "../components/PageTitle"
import Button from "../components/Button"
import Input from "../components/Input"
import Select from "../components/Select"
import Textarea from "../components/Textarea"
import ImageUpload from "../components/ImageUpload"
import LoadingSpinner from "../components/LoadingSpinner"
import { TransactionType, type CreateTransactionPayload } from "../types"

const OutgoingFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addTransaction, borrowers, isLoading: contextLoading } = useTransactions()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApprovalLink, setShowApprovalLink] = useState(false)
  const [approvalLink, setApprovalLink] = useState("")
  const [createdTransaction, setCreatedTransaction] = useState<any>(null)

  const [formData, setFormData] = useState({
    borrowDate: new Date().toISOString().split("T")[0],
    program: "",
    type: TransactionType.SHOW,
    description: "",
    imageUrl: "",
    borrowerName: "",
    borrowerNik: "",
    borrowerPhone: "",
    borrowerAddress: "",
    borrowerEmail: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.borrowDate) newErrors.borrowDate = "Tanggal pinjam wajib diisi"
    if (!formData.program.trim()) newErrors.program = "Program wajib diisi"
    if (!formData.description.trim()) newErrors.description = "Deskripsi barang wajib diisi"
    if (!formData.imageUrl) newErrors.imageUrl = "Foto barang wajib diupload"
    if (!formData.borrowerName.trim()) newErrors.borrowerName = "Nama peminjam wajib diisi"
    if (!formData.borrowerNik.trim()) newErrors.borrowerNik = "NIK peminjam wajib diisi"
    if (!formData.borrowerPhone.trim()) newErrors.borrowerPhone = "No. HP peminjam wajib diisi"
    if (!formData.borrowerAddress.trim()) newErrors.borrowerAddress = "Alamat peminjam wajib diisi"

    // Validate NIK (16 digits)
    if (formData.borrowerNik && !/^\d{16}$/.test(formData.borrowerNik)) {
      newErrors.borrowerNik = "NIK harus 16 digit angka"
    }

    // Validate phone number
    if (formData.borrowerPhone && !/^(\+62|62|0)[0-9]{9,13}$/.test(formData.borrowerPhone)) {
      newErrors.borrowerPhone = "Format nomor HP tidak valid"
    }

    // Validate email if provided
    if (formData.borrowerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.borrowerEmail)) {
      newErrors.borrowerEmail = "Format email tidak valid"
    }

    // Validate borrow date (not in the past)
    const borrowDate = new Date(formData.borrowDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (borrowDate < today) {
      newErrors.borrowDate = "Tanggal pinjam tidak boleh di masa lalu"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageUrl }))
    if (errors.imageUrl) {
      setErrors((prev) => ({ ...prev, imageUrl: "" }))
    }
  }

  const generateApprovalLink = (transactionId: string): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/approval/${transactionId}`
  }

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "")

    // Handle Indonesian phone numbers
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1)
    } else if (!cleaned.startsWith("62")) {
      cleaned = "62" + cleaned
    }

    return cleaned
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const transactionPayload: CreateTransactionPayload = {
        borrowDate: formData.borrowDate,
        program: formData.program,
        type: formData.type,
        description: formData.description,
        imageUrl: formData.imageUrl,
        borrowerName: formData.borrowerName,
        borrowerNik: formData.borrowerNik,
        borrowerPhone: formData.borrowerPhone,
        borrowerAddress: formData.borrowerAddress,
        borrowerEmail: formData.borrowerEmail || undefined,
        createdBy: user?.id || "",
      }

      const newTransaction = await addTransaction(transactionPayload)
      const link = generateApprovalLink(newTransaction.id)

      setCreatedTransaction(newTransaction)
      setApprovalLink(link)
      setShowApprovalLink(true)
    } catch (error) {
      console.error("Error creating transaction:", error)
      alert("Gagal membuat transaksi. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendWhatsApp = () => {
    if (!createdTransaction) return

    const whatsappPhone = formatPhoneForWhatsApp(formData.borrowerPhone)
    const message = encodeURIComponent(
      `Halo ${formData.borrowerName},\n\n` +
        `Anda memiliki permintaan peminjaman barang yang perlu disetujui:\n\n` +
        `📋 Program: ${formData.program}\n` +
        `📅 Tanggal: ${new Date(formData.borrowDate).toLocaleDateString("id-ID")}\n` +
        `📝 Deskripsi: ${formData.description}\n\n` +
        `Silakan klik link berikut untuk menyetujui atau menolak:\n` +
        `${approvalLink}\n\n` +
        `Terima kasih.`,
    )

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(approvalLink)
      alert("Link berhasil disalin!")
    } catch (error) {
      console.error("Failed to copy link:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = approvalLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Link berhasil disalin!")
    }
  }

  const handleCreateAnother = () => {
    setShowApprovalLink(false)
    setApprovalLink("")
    setCreatedTransaction(null)
    setFormData({
      borrowDate: new Date().toISOString().split("T")[0],
      program: "",
      type: TransactionType.SHOW,
      description: "",
      imageUrl: "",
      borrowerName: "",
      borrowerNik: "",
      borrowerPhone: "",
      borrowerAddress: "",
      borrowerEmail: "",
    })
    setErrors({})
  }

  if (contextLoading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" message="Memuat data..." />
      </Layout>
    )
  }

  if (showApprovalLink && createdTransaction) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <PageTitle
            title="✅ Transaksi Berhasil Dibuat"
            subtitle="Link persetujuan telah digenerate dan siap dikirim ke peminjam"
          />

          {/* Success Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  Transaksi #{createdTransaction.id} Berhasil Dibuat
                </h3>
                <p className="text-green-600">Status: Menunggu Persetujuan Peminjam</p>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">📋 Ringkasan Transaksi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Program:</span>
                  <span className="ml-2 font-medium">{formData.program}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tanggal Pinjam:</span>
                  <span className="ml-2 font-medium">{new Date(formData.borrowDate).toLocaleDateString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-gray-600">Peminjam:</span>
                  <span className="ml-2 font-medium">{formData.borrowerName}</span>
                </div>
                <div>
                  <span className="text-gray-600">No. HP:</span>
                  <span className="ml-2 font-medium">{formData.borrowerPhone}</span>
                </div>
              </div>
            </div>

            {/* Approval Link Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🔗 Link Persetujuan</h4>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={approvalLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-md bg-white text-sm"
                />
                <Button onClick={handleCopyLink} variant="secondary" size="sm">
                  📋 Salin
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSendWhatsApp}
                  variant="success"
                  className="flex-1 flex items-center justify-center"
                >
                  <span className="mr-2">📱</span>
                  Kirim via WhatsApp
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="primary" className="flex-1">
                  📊 Lihat Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">📝 Langkah Selanjutnya</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Kirim link persetujuan ke peminjam melalui WhatsApp atau salin manual</li>
              <li>Peminjam akan membuka link dan memverifikasi identitas dengan NIK + No. HP</li>
              <li>Peminjam dapat menyetujui atau menolak permintaan peminjaman</li>
              <li>Anda akan menerima notifikasi status di dashboard</li>
              <li>Jika disetujui, dokumen siap untuk dicetak</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleCreateAnother} variant="primary" className="flex-1">
              ➕ Buat Transaksi Lain
            </Button>
            <Button onClick={() => navigate("/outgoing")} variant="secondary" className="flex-1">
              📋 Lihat Semua Transaksi
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <PageTitle
          title="📤 Buat Peminjaman Baru"
          subtitle="Isi form lengkap untuk membuat transaksi peminjaman barang"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Detail Transaksi</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Tanggal Pinjam"
                type="date"
                value={formData.borrowDate}
                onChange={(e) => handleInputChange("borrowDate", e.target.value)}
                error={errors.borrowDate}
                required
              />

              <Input
                label="Program"
                value={formData.program}
                onChange={(e) => handleInputChange("program", e.target.value)}
                placeholder="Contoh: Siaran Berita Pagi"
                error={errors.program}
                required
              />

              <Select
                label="Jenis Transaksi"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                options={[
                  { value: TransactionType.SHOW, label: "SHOW" },
                  { value: TransactionType.EVENT, label: "EVENT" },
                  { value: TransactionType.OFF_AIR, label: "OFF AIR" },
                  { value: TransactionType.LAUNDRY, label: "LAUNDRY" },
                ]}
                required
              />
            </div>

            <div className="mt-6">
              <Textarea
                label="Deskripsi Barang"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Jelaskan detail barang yang dipinjam..."
                rows={4}
                error={errors.description}
                required
              />
            </div>

            <div className="mt-6">
              <ImageUpload onImageUpload={handleImageUpload} error={errors.imageUrl} required />
            </div>
          </div>

          {/* Borrower Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Data Peminjam</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nama Lengkap"
                value={formData.borrowerName}
                onChange={(e) => handleInputChange("borrowerName", e.target.value)}
                placeholder="Nama lengkap peminjam"
                error={errors.borrowerName}
                required
              />

              <Input
                label="NIK"
                value={formData.borrowerNik}
                onChange={(e) => handleInputChange("borrowerNik", e.target.value)}
                placeholder="16 digit NIK"
                maxLength={16}
                error={errors.borrowerNik}
                required
              />

              <Input
                label="No. HP"
                value={formData.borrowerPhone}
                onChange={(e) => handleInputChange("borrowerPhone", e.target.value)}
                placeholder="08xxxxxxxxxx"
                error={errors.borrowerPhone}
                required
              />

              <Input
                label="Email (Opsional)"
                type="email"
                value={formData.borrowerEmail}
                onChange={(e) => handleInputChange("borrowerEmail", e.target.value)}
                placeholder="email@example.com"
                error={errors.borrowerEmail}
              />
            </div>

            <div className="mt-6">
              <Textarea
                label="Alamat"
                value={formData.borrowerAddress}
                onChange={(e) => handleInputChange("borrowerAddress", e.target.value)}
                placeholder="Alamat lengkap peminjam..."
                rows={3}
                error={errors.borrowerAddress}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/dashboard")}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? "Membuat Transaksi..." : "✅ Buat Transaksi"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default OutgoingFormPage
