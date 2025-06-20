"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"

export default function PrintOutgoingPage() {
  const params = useParams()
  const transactionId = params.id as string
  const [transaction, setTransaction] = useState<any>(null)
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const adminBarcodeRef = useRef<HTMLCanvasElement>(null)
  const borrowerBarcodeRef = useRef<HTMLCanvasElement>(null)
  const supervisorBarcodeRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadTransaction()
    loadCompanyLogo()
  }, [transactionId])

  useEffect(() => {
    if (transaction) {
      generateBarcodes()
    }
  }, [transaction])

  const loadTransaction = () => {
    try {
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const foundTransaction = transactions.find((t: any) => t.id === transactionId)
      setTransaction(foundTransaction)
    } catch (err) {
      console.error("Error loading transaction:", err)
    }
  }

  const loadCompanyLogo = () => {
    const logo = localStorage.getItem("companyLogo")
    if (logo) {
      setCompanyLogo(logo)
    }
  }

  const generateBarcode = (canvas: HTMLCanvasElement, text: string) => {
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 200
    canvas.height = 50

    // Clear canvas
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Simple barcode generation (Code 128 style)
    const barWidth = 2
    const barHeight = 40
    let x = 10

    // Convert text to simple barcode pattern
    const binaryString = text
      .split("")
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
      .join("")

    ctx.fillStyle = "black"

    // Draw bars based on binary pattern
    for (let i = 0; i < binaryString.length && x < canvas.width - 10; i++) {
      if (binaryString[i] === "1") {
        ctx.fillRect(x, 5, barWidth, barHeight)
      }
      x += barWidth
    }

    // Add text below barcode
    ctx.fillStyle = "black"
    ctx.font = "8px Arial"
    ctx.textAlign = "center"
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height - 2)
  }

  const generateBarcodes = () => {
    if (adminBarcodeRef.current && transaction.createdBy) {
      generateBarcode(adminBarcodeRef.current, transaction.createdBy)
    }

    if (borrowerBarcodeRef.current && transaction.borrowerName) {
      generateBarcode(borrowerBarcodeRef.current, transaction.borrowerName)
    }

    if (supervisorBarcodeRef.current && transaction.supervisorName) {
      generateBarcode(supervisorBarcodeRef.current, transaction.supervisorName)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print bg-gray-50 p-4 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-medium">Print Peminjaman Barang</h1>
          <div className="space-x-2">
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              🖨️ Print
            </button>
            <button
              onClick={() => window.close()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Main Table Container */}
        <table className="w-full border-collapse border-2 border-black">
          {/* Header Row */}
          <tr>
            <td className="border-2 border-black p-4 w-1/4 text-center bg-blue-600 text-white">
              <div className="font-bold text-2xl">
                {companyLogo ? (
                  <img src={companyLogo || "/placeholder.svg"} alt="Company Logo" className="h-12 mx-auto mb-2" />
                ) : (
                  "TRANS TV"
                )}
              </div>
            </td>
            <td className="border-2 border-black p-4 text-center">
              <div className="font-bold text-sm">
                PT TELEVISI TRANSFORMASI INDONESIA
                <br />
                TECHNICAL & FACILITIES SERVICES DIVISION
                <br />
                ART DEPT - WARDROBE
              </div>
            </td>
            <td className="border-2 border-black p-4 text-center bg-gray-100">
              <div className="font-bold text-lg">
                OUTGOING FORM NON
                <br />
                BARCODE
              </div>
            </td>
          </tr>

          {/* Transaction Details Row */}
          <tr>
            <td className="border-2 border-black p-2 font-bold bg-gray-50">NUMBER</td>
            <td className="border-2 border-black p-2 text-red-600 font-bold">{transaction.transactionNumber}</td>
            <td className="border-2 border-black p-2 font-bold bg-gray-50">PROGRAM</td>
            <td className="border-2 border-black p-2 text-red-600 font-bold">{transaction.programName}</td>
          </tr>
          <tr>
            <td className="border-2 border-black p-2 font-bold bg-gray-50">DATE</td>
            <td className="border-2 border-black p-2">
              {new Date(transaction.borrowDate).toLocaleDateString("en-GB")}
            </td>
            <td className="border-2 border-black p-2 font-bold bg-gray-50">TYPE</td>
            <td className="border-2 border-black p-2">{transaction.transactionType}</td>
          </tr>
          <tr>
            <td className="border-2 border-black p-2 font-bold bg-gray-50">DEADLINE</td>
            <td className="border-2 border-black p-2 text-red-600 font-bold">
              {new Date(transaction.deadlineDate).toLocaleDateString("en-GB")}
            </td>
            <td className="border-2 border-black p-2 font-bold bg-gray-50">JUMLAH</td>
            <td className="border-2 border-black p-2 text-red-600 font-bold">{transaction.itemQuantity} UNIT</td>
          </tr>

          {/* Items Description Header */}
          <tr>
            <td colSpan={4} className="border-2 border-black p-3 text-center font-bold bg-gray-100">
              ITEMS DESCRIPTION
            </td>
          </tr>

          {/* Items Description Content */}
          <tr>
            <td colSpan={4} className="border-2 border-black p-0">
              <div className="grid grid-cols-3 h-80">
                {/* Left Grid */}
                <div className="border-r-2 border-black">
                  <div className="grid grid-cols-4 h-full">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="border border-gray-300"></div>
                    ))}
                  </div>
                </div>

                {/* Center - Photo */}
                <div className="border-r-2 border-black flex items-center justify-center p-4">
                  {transaction.itemPhoto ? (
                    <img
                      src={transaction.itemPhoto || "/placeholder.svg"}
                      alt="Item"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <div>No Photo</div>
                    </div>
                  )}
                </div>

                {/* Right Grid */}
                <div>
                  <div className="grid grid-cols-4 h-full">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="border border-gray-300"></div>
                    ))}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Description Text */}
          <tr>
            <td colSpan={4} className="border-2 border-black p-4">
              <div className="text-sm">
                <strong>Deskripsi:</strong> {transaction.itemDescription}
              </div>
            </td>
          </tr>

          {/* Outgoing Remark Header */}
          <tr>
            <td colSpan={4} className="border-2 border-black p-3 text-center font-bold bg-gray-100">
              OUTGOING REMARK
            </td>
          </tr>

          {/* Signature Section with Barcodes */}
          <tr>
            <td className="border-2 border-black p-4 text-center font-bold bg-gray-50 h-40 align-top">
              <div className="mb-2">ADMIN</div>
              <div className="flex justify-center mb-2">
                <canvas ref={adminBarcodeRef} className="border"></canvas>
              </div>
            </td>
            <td className="border-2 border-black p-4 text-center font-bold bg-gray-50 h-40 align-top">
              <div className="mb-2">BORROWER</div>
              <div className="text-xs font-normal mb-2">
                <div>NIK: {transaction.borrowerNIK}</div>
                <div>Jabatan: {transaction.borrowerPosition}</div>
                <div>HP: {transaction.borrowerPhone}</div>
              </div>
              <div className="flex justify-center">
                <canvas ref={borrowerBarcodeRef} className="border"></canvas>
              </div>
            </td>
            <td className="border-2 border-black p-4 text-center font-bold bg-gray-50 h-40 align-top">
              <div className="mb-2">SUPERVISOR</div>
              <div className="text-xs font-normal mb-2">
                <div>HP: {transaction.supervisorPhone}</div>
              </div>
              <div className="flex justify-center">
                <canvas ref={supervisorBarcodeRef} className="border"></canvas>
              </div>
            </td>
          </tr>
        </table>

        {/* Footer Info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Dokumen dicetak pada: {new Date().toLocaleString("id-ID")}</p>
          <p>Transaction ID: {transaction.id}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          
          table {
            font-size: 12px;
          }
          
          canvas {
            max-width: 100%;
            height: auto;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  )
}
