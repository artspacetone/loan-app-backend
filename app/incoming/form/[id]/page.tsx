"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface SuccessInfo {
  message: string
  approvalLink: string
  printLink: string
}

const DrawingControls = ({
  setColor,
  setLineWidth,
  setMode,
  clearCanvas,
  currentColor,
  currentWidth,
  currentMode,
}: any) => {
  const colors = [
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Green", value: "#00FF00" },
    { name: "Black", value: "#000000" },
  ]

  const widths = [
    { name: "S", value: 2 },
    { name: "M", value: 5 },
    { name: "L", value: 10 },
  ]

  return (
    <div className="my-4 p-3 border border-gray-200 rounded-md bg-gray-50 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Color:</span>
        {colors.map((color) => (
          <button
            key={color.name}
            title={color.name}
            onClick={() => {
              setColor(color.value)
              setMode("draw")
            }}
            className={`w-6 h-6 rounded-full border-2 ${
              currentColor === color.value && currentMode === "draw"
                ? "ring-2 ring-offset-1 ring-blue-500"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Brush:</span>
        {widths.map((width) => (
          <button
            key={width.name}
            onClick={() => {
              setLineWidth(width.value)
              setMode("draw")
            }}
            className={`px-3 py-1 text-xs rounded-md border ${
              currentWidth === width.value && currentMode === "draw" ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            {width.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setMode(currentMode === "erase" ? "draw" : "erase")}
          className={`px-3 py-1 text-xs rounded-md ${
            currentMode === "erase" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {currentMode === "erase" ? "🖌️ Pen" : "🧽 Eraser"}
        </button>
        <button onClick={clearCanvas} className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700">
          🗑️ Clear Markings
        </button>
      </div>
    </div>
  )
}

export default function IncomingFormPage() {
  const params = useParams()
  const transactionId = params.id as string
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [transaction, setTransaction] = useState<any>(null)
  const [formData, setFormData] = useState({
    returnDate: new Date().toISOString().split("T")[0],
    returnedQuantity: 0,
    conditionNotes: "",
  })
  const [formError, setFormError] = useState("")
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Canvas drawing states
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawConfig, setDrawConfig] = useState({
    color: "#FF0000",
    lineWidth: 5,
    mode: "draw" as "draw" | "erase",
  })
  const lastPosition = useRef<{ x: number; y: number } | null>(null)

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

      // Load transaction
      if (transactionId) {
        loadTransaction()
      }
    }
  }, [transactionId, router])

  useEffect(() => {
    if (transaction) {
      setupCanvas()
    }
  }, [transaction])

  const loadTransaction = () => {
    try {
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const tx = transactions.find((t: any) => t.id === transactionId)

      if (tx) {
        setTransaction(tx)
        const alreadyReturned = tx.returnedQuantity || 0
        setFormData((prev) => ({
          ...prev,
          returnedQuantity: tx.itemQuantity - alreadyReturned,
        }))
      } else {
        setFormError("Transaction not found.")
      }
    } catch (err) {
      console.error("Error loading transaction:", err)
      setFormError("Error loading transaction.")
    }
  }

  const setupCanvas = () => {
    const canvas = canvasRef.current
    const image = imageRef.current

    if (!canvas || !image || !transaction?.itemPhoto) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    image.crossOrigin = "Anonymous"

    const handleImageLoad = () => {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    }

    image.addEventListener("load", handleImageLoad)
    image.src = transaction.itemPhoto

    if (image.complete) {
      handleImageLoad()
    }

    return () => {
      image.removeEventListener("load", handleImageLoad)
    }
  }

  // Drawing functions
  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in event.nativeEvent) {
      clientX = event.nativeEvent.touches[0].clientX
      clientY = event.nativeEvent.touches[0].clientY
    } else {
      clientX = event.nativeEvent.clientX
      clientY = event.nativeEvent.clientY
    }

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    setIsDrawing(true)
    lastPosition.current = getCoordinates(event)
  }

  const stopDrawing = () => {
    if (isDrawing) setIsDrawing(false)
  }

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    event.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !lastPosition.current) return

    const currentPos = getCoordinates(event)

    ctx.beginPath()
    ctx.strokeStyle = drawConfig.color
    ctx.lineWidth = drawConfig.lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.globalCompositeOperation = drawConfig.mode === "erase" ? "destination-out" : "source-over"

    ctx.moveTo(lastPosition.current.x, lastPosition.current.y)
    ctx.lineTo(currentPos.x, currentPos.y)
    ctx.stroke()

    lastPosition.current = currentPos
  }

  const handleClearCanvas = () => {
    const canvas = canvasRef.current
    const image = imageRef.current

    if (canvas && image && image.complete) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "returnedQuantity" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => alert("Link copied!"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setIsLoading(true)

    if (!user || !transaction || !transactionId) {
      setFormError("Data is missing.")
      setIsLoading(false)
      return
    }

    const remainingToReturn = transaction.itemQuantity - (transaction.returnedQuantity || 0)

    if (formData.returnedQuantity <= 0) {
      setFormError("Quantity must be > 0.")
      setIsLoading(false)
      return
    }

    if (formData.returnedQuantity > remainingToReturn) {
      setFormError(`Quantity cannot exceed remaining quantity (${remainingToReturn}).`)
      setIsLoading(false)
      return
    }

    try {
      // Generate return ID
      const returnId = `RET-${Date.now()}`

      // Create return object
      const returnData = {
        id: returnId,
        transactionId: transactionId,
        returnDate: formData.returnDate,
        returnedQuantity: formData.returnedQuantity,
        conditionNotes: formData.conditionNotes,
        markedPhoto: canvasRef.current?.toDataURL("image/png") || null,
        adminId: user.id || user.username,
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
      }

      // Save return data
      const returns = JSON.parse(localStorage.getItem("returns") || "[]")
      returns.push(returnData)
      localStorage.setItem("returns", JSON.stringify(returns))

      // Generate approval link
      const baseUrl = window.location.origin
      const fullApprovalLink = `${baseUrl}/approval/incoming/${returnId}`

      setSuccessInfo({
        message: `Return for transaction #${transaction.transactionNumber} has been recorded.`,
        approvalLink: fullApprovalLink,
        printLink: `/print/incoming/${transactionId}/${returnId}`,
      })
    } catch (error) {
      console.error(error)
      setFormError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (successInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <div className="h-16 w-16 text-green-500 mx-auto mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Return Recorded</h1>
          <p className="text-gray-600 mb-6">{successInfo.message}</p>

          <div className="mt-6 space-y-4">
            <p className="text-gray-600">Please provide the following approval link to the borrower:</p>
            <div className="p-3 bg-gray-100 border rounded-md text-sm text-left break-all relative">
              <code>{successInfo.approvalLink}</code>
              <button
                onClick={() => copyToClipboard(successInfo.approvalLink)}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-800"
                title="Copy link"
              >
                📋
              </button>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </button>
              <Link href={successInfo.printLink}>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">🖨️ Print Page</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="text-gray-600">{formError || "Transaction not found."}</p>
        </div>
      </div>
    )
  }

  const remainingToReturn = transaction.itemQuantity - (transaction.returnedQuantity || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/incoming")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Kembali ke List
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Process Item Return</h1>
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
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">For Transaction: {transaction.transactionNumber}</h2>
          </div>

          {formError && <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">{formError}</div>}

          {/* Item Details */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Item Details</h3>
            <p>
              <strong>Item:</strong> {transaction.itemDescription}
            </p>
            <p>
              <strong>Total Borrowed Qty:</strong> {transaction.itemQuantity}
            </p>
            <p>
              <strong>Remaining to Return:</strong> {remainingToReturn}
            </p>
          </div>

          {/* Canvas Drawing */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Mark Item Condition on Photo:</p>
            <div
              className="relative border border-gray-300 rounded-md overflow-hidden mx-auto"
              style={{ maxWidth: "500px", touchAction: "none" }}
            >
              <img ref={imageRef} alt="Item" className="hidden" />
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-auto block cursor-crosshair"
              />
            </div>
            <DrawingControls
              setColor={(c: string) => setDrawConfig((p) => ({ ...p, color: c }))}
              setLineWidth={(w: number) => setDrawConfig((p) => ({ ...p, lineWidth: w }))}
              setMode={(m: "draw" | "erase") => setDrawConfig((p) => ({ ...p, mode: m }))}
              clearCanvas={handleClearCanvas}
              currentColor={drawConfig.color}
              currentWidth={drawConfig.lineWidth}
              currentMode={drawConfig.mode}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="border border-gray-300 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Return Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Kembali (Return Date) *
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QTY Returned (Max: {remainingToReturn}) *
                  </label>
                  <input
                    type="number"
                    name="returnedQuantity"
                    value={formData.returnedQuantity.toString()}
                    onChange={handleChange}
                    required
                    min="0"
                    max={remainingToReturn.toString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition Notes *</label>
                  <textarea
                    name="conditionNotes"
                    value={formData.conditionNotes}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Describe item condition..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.push("/incoming")}
                className="mr-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || remainingToReturn <= 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : remainingToReturn <= 0 ? (
                  "All Items Returned"
                ) : (
                  "Submit Return & Get Link"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
