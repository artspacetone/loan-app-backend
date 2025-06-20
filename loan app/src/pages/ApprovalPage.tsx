"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { inventoryService } from "../services/inventoryService"
import Button from "../components/Button"
import Input from "../components/Input"
import LoadingSpinner from "../components/LoadingSpinner"
import type { Transaction } from "../types"

const ApprovalPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>()
  const navigate = useNavigate()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"loading" | "verify" | "approve" | "success" | "rejected">("loading")

  const [verificationData, setVerificationData] = useState({
    nik: "",
    phone: "",
  })
  const [verificationErrors, setVerificationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadTransaction()
  }, [transactionId])

  const loadTransaction = async () => {
    if (!transactionId) {
      setError("ID transaksi tidak valid")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await inventoryService.getTransactionById(transactionId)

      if (!data) {
        setError("Transaksi tidak ditemukan")
        return
      }

      setTransaction(data)

      // Check if already processed
      if (data.borrowerApproved === true) {
        setStep("success")
      } else if (data.borrowerApproved === false) {
        setStep("rejected")
      } else {
        setStep("verify")
      }
    } catch (error) {
      console.error("Error loading transaction:", error)
      setError("Gagal memuat data transaksi")
    } finally {
      setIsLoading(false)
    }
  }

  const validateVerification = (): boolean => {
    const errors: Record<string, string> = {}

    if (!verificationData.nik.trim()) {
      errors.nik = "NIK wajib diisi"
    } else if (!/^\d{16}$/.test(verificationData.nik)) {
      errors.nik = "NIK harus 16 digit angka"
    }

    if (!verificationData.phone.trim()) {
      errors.phone = "No. HP wajib diisi"
    }

    setVerificationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const normalizePhone = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "")

    // Handle different formats
    if (cleaned.startsWith("62")) {
      cleaned = "0" + cleaned.substring(2)
    } else if (cleaned.startsWith("0")) {
      // Already in correct format
    } else {
      cleaned = "0" + cleaned
    }

    return cleaned
  }

  const handleVerification = async () => {
    if (!validateVerification() || !transaction) return

    setIsVerifying(true)
    setError("")

    try {
      // Normalize phone numbers for comparison
      const inputPhone = normalizePhone(verificationData.phone)
      const transactionPhone = normalizePhone(transaction.borrowerPhone)

      // Verify NIK and phone
      if (verificationData.nik !== transaction.borrowerNik || inputPhone !== transactionPhone) {
        setError("Data verifikasi tidak sesuai. Periksa kembali NIK dan No. HP Anda.")
        return
      }

      setStep("approve")
    } catch (error) {
      console.error("Verification error:", error)
      setError("Terjadi kesalahan saat verifikasi")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!transaction) return

    setIsProcessing(true)
    setError("")

    try {
      await inventoryService.processApproval(transaction.id, approved)

      if (approved) {
        setStep("success")
        // Auto redirect to print page after 3 seconds
        setTimeout(() => {
          navigate(`/print/outgoing/${transaction.id}`)
        }, 3000)
      } else {
        setStep("rejected")
      }
    } catch (error) {
      console.error("Approval error:", error)
      setError("Gagal memproses persetujuan")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat data transaksi..." />
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.close()} variant="secondary">
            Tutup
          </Button>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🔐 Persetujuan Peminjaman Barang</h1>
          <p className="text-gray-600">Transaksi #{transaction.id}</p>
        </div>

        {/* Transaction Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Detail Transaksi</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-gray-600 text-sm">Program:</span>
              <p className="font-medium">{transaction.program}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Tanggal Pinjam:</span>
              <p className="font-medium">{new Date(transaction.borrowDate).toLocaleDateString("id-ID")}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Jenis:</span>
              <p className="font-medium">{transaction.type}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Peminjam:</span>
              <p className="font-medium">{transaction.borrowerName}</p>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-gray-600 text-sm">Deskripsi Barang:</span>
            <p className="font-medium mt-1">{transaction.description}</p>
          </div>

          {transaction.imageUrl && (
            <div>
              <span className="text-gray-600 text-sm">Foto Barang:</span>
              <div className="mt-2">
                <img
                  src={transaction.imageUrl || "/placeholder.svg"}
                  alt="Barang yang dipinjam"
                  className="max-w-full h-auto rounded-lg border"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Step Content */}
        {step === "verify" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Verifikasi Identitas</h3>
            <p className="text-gray-600 mb-6">
              Untuk keamanan, silakan masukkan NIK dan No. HP Anda untuk verifikasi identitas.
            </p>

            <div className="space-y-4">
              <Input
                label="NIK (16 digit)"
                value={verificationData.nik}
                onChange={(e) => setVerificationData((prev) => ({ ...prev, nik: e.target.value }))}
                placeholder="Masukkan 16 digit NIK"
                maxLength={16}
                error={verificationErrors.nik}
                required
              />

              <Input
                label="No. HP"
                value={verificationData.phone}
                onChange={(e) => setVerificationData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Masukkan nomor HP"
                error={verificationErrors.phone}
                required
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleVerification}
                variant="primary"
                isLoading={isVerifying}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? "Memverifikasi..." : "✅ Verifikasi"}
              </Button>
            </div>
          </div>
        )}

        {step === "approve" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">✅ Verifikasi Berhasil</h3>
            <p className="text-gray-600 mb-6">
              Identitas Anda telah terverifikasi. Silakan pilih tindakan untuk transaksi ini:
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleApproval(false)}
                variant="danger"
                isLoading={isProcessing}
                disabled={isProcessing}
                className="flex-1"
              >
                ❌ Tolak
              </Button>
              <Button
                onClick={() => handleApproval(true)}
                variant="success"
                isLoading={isProcessing}
                disabled={isProcessing}
                className="flex-1"
              >
                ✅ Setujui
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Transaksi Disetujui</h3>
            <p className="text-gray-600 mb-6">
              Terima kasih! Transaksi peminjaman telah disetujui dan dokumen siap untuk dicetak.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">🔄 Anda akan dialihkan ke halaman cetak dalam 3 detik...</p>
            </div>
            <Button onClick={() => navigate(`/print/outgoing/${transaction.id}`)} variant="primary">
              📄 Lihat Dokumen
            </Button>
          </div>
        )}

        {step === "rejected" && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Transaksi Ditolak</h3>
            <p className="text-gray-600 mb-6">
              Transaksi peminjaman telah ditolak. Silakan hubungi admin jika ada pertanyaan.
            </p>
            <Button onClick={() => window.close()} variant="secondary">
              Tutup
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApprovalPage
