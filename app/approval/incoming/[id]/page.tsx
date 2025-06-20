"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function IncomingApprovalPage() {
  const params = useParams()
  const returnId = params.id as string
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [returnData, setReturnData] = useState<any>(null)
  const [transaction, setTransaction] = useState<any>(null)
  const [verificationData, setVerificationData] = useState({
    nik: "",
    phone: "",
  })
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (returnId) {
      loadReturnData()
    }
  }, [returnId])

  const loadReturnData = () => {
    try {
      // Load return data
      const returns = JSON.parse(localStorage.getItem("returns") || "[]")
      const returnItem = returns.find((r: any) => r.id === returnId)

      if (returnItem) {
        setReturnData(returnItem)

        // Load related transaction
        const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
        const tx = transactions.find((t: any) => t.id === returnItem.transactionId)
        setTransaction(tx)
      } else {
        setError("Return data not found.")
      }
    } catch (err) {
      console.error("Error loading return data:", err)
      setError("Error loading return data.")
    }
  }

  const handleVerification = () => {
    if (!transaction) return

    if (verificationData.nik === transaction.borrowerNIK && verificationData.phone === transaction.borrowerPhone) {
      setIsVerified(true)
      setError("")
    } else {
      setError("NIK atau nomor HP tidak sesuai. Silakan periksa kembali.")
    }
  }

  const handleApproval = async (approved: boolean) => {
    setIsLoading(true)

    try {
      // Update return status
      const returns = JSON.parse(localStorage.getItem("returns") || "[]")
      const returnIndex = returns.findIndex((r: any) => r.id === returnId)

      if (returnIndex !== -1) {
        returns[returnIndex].status = approved ? "APPROVED" : "REJECTED"
        returns[returnIndex].borrowerApproved = approved
        returns[returnIndex].approvedAt = new Date().toISOString()
        localStorage.setItem("returns", JSON.stringify(returns))

        if (approved) {
          // Update transaction status
          const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
          const txIndex = transactions.findIndex((t: any) => t.id === returnData.transactionId)

          if (txIndex !== -1) {
            const currentReturned = transactions[txIndex].returnedQuantity || 0
            const newReturned = currentReturned + returnData.returnedQuantity

            transactions[txIndex].returnedQuantity = newReturned

            // Check if complete or incomplete
            if (newReturned >= transactions[txIndex].itemQuantity) {
              transactions[txIndex].status = "AVL" // Complete return
              transactions[txIndex].returnStatus = "COMPLETE"
            } else {
              transactions[txIndex].returnStatus = "INCOMPLETE"
            }

            localStorage.setItem("transactions", JSON.stringify(transactions))
          }

          // Redirect to print page
          router.push(`/print/incoming/${returnData.transactionId}/${returnId}`)
        } else {
          alert("Pengembalian ditolak.")
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Error processing approval:", error)
      setError("Error processing approval.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !returnData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!returnData || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Approval Pengembalian Barang</h1>
            <p className="text-sm text-gray-600 mt-1">Transaksi: {transaction.transactionNumber}</p>
          </div>

          <div className="p-6">
            {!isVerified ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Verifikasi Identitas</h3>
                  <p className="text-sm text-blue-700">
                    Silakan masukkan NIK dan nomor HP Anda untuk verifikasi identitas.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NIK</label>
                    <input
                      type="text"
                      value={verificationData.nik}
                      onChange={(e) => setVerificationData((prev) => ({ ...prev, nik: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan NIK Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nomor HP</label>
                    <input
                      type="tel"
                      value={verificationData.phone}
                      onChange={(e) => setVerificationData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan nomor HP Anda"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerification}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  Verifikasi
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-2">✅ Identitas Terverifikasi</h3>
                  <p className="text-sm text-green-700">Silakan review detail pengembalian di bawah ini.</p>
                </div>

                {/* Return Details */}
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Pengembalian</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Item:</span>
                      <p>{transaction.itemDescription}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Jumlah Dikembalikan:</span>
                      <p>
                        {returnData.returnedQuantity} dari {transaction.itemQuantity}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tanggal Pengembalian:</span>
                      <p>{new Date(returnData.returnDate).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Kondisi:</span>
                      <p>{returnData.conditionNotes}</p>
                    </div>
                  </div>

                  {/* Marked Photo */}
                  {returnData.markedPhoto && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700">Foto Kondisi Barang:</span>
                      <div className="mt-2">
                        <img
                          src={returnData.markedPhoto || "/placeholder.svg"}
                          alt="Marked item condition"
                          className="max-w-full h-auto border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Approval Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproval(false)}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "Tolak"}
                  </button>
                  <button
                    onClick={() => handleApproval(true)}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "Setujui Pengembalian"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
