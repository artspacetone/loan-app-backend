"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const CanvasTestPage = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

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

  // Test states
  const [testResults, setTestResults] = useState<string[]>([])
  const [currentTest, setCurrentTest] = useState("")
  const [savedImages, setSavedImages] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    setupCanvas()
    addTestResult("✅ Canvas initialized successfully")
  }, [])

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const setupCanvas = () => {
    const canvas = canvasRef.current
    const image = imageRef.current

    if (!canvas || !image) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Create a test image with sample inventory item
    const sampleImageData =
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f0f0f0" stroke="#ccc" strokeWidth="2"/>
        <rect x="50" y="50" width="300" height="200" fill="#e0e0e0" stroke="#999" strokeWidth="1"/>
        <text x="200" y="120" textAnchor="middle" fontFamily="Arial" fontSize="16" fill="#666">
          SAMPLE INVENTORY ITEM
        </text>
        <text x="200" y="140" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#888">
          Camera Equipment
        </text>
        <text x="200" y="160" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#888">
          Model: Canon EOS R5
        </text>
        <text x="200" y="180" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#888">
          Serial: 123456789
        </text>
        <circle cx="120" cy="200" r="20" fill="#ff6b6b" opacity="0.3"/>
        <text x="120" y="205" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#333">
          Scratch
        </text>
        <circle cx="280" cy="220" r="15" fill="#4ecdc4" opacity="0.3"/>
        <text x="280" y="225" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#333">
          Dent
        </text>
      </svg>
    `)

    const handleImageLoad = () => {
      canvas.width = 400
      canvas.height = 300
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      addTestResult("✅ Sample image loaded on canvas")
    }

    image.addEventListener("load", handleImageLoad)
    image.src = sampleImageData

    if (image.complete) {
      handleImageLoad()
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
    addTestResult(
      `🎨 Started drawing with ${drawConfig.mode} mode, color: ${drawConfig.color}, width: ${drawConfig.lineWidth}`,
    )
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      addTestResult("⏹️ Stopped drawing")
    }
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
        addTestResult("🗑️ Canvas cleared and image restored")
      }
    }
  }

  const saveCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png")
      setSavedImages((prev) => [...prev, dataURL])
      addTestResult(`💾 Canvas saved as image #${savedImages.length + 1}`)
    }
  }

  const runAutomatedTests = () => {
    setCurrentTest("Running automated tests...")
    addTestResult("🤖 Starting automated tests")

    // Test 1: Color changes
    setTimeout(() => {
      setDrawConfig((prev) => ({ ...prev, color: "#0000FF" }))
      addTestResult("✅ Test 1: Color changed to Blue")
    }, 500)

    // Test 2: Brush size changes
    setTimeout(() => {
      setDrawConfig((prev) => ({ ...prev, lineWidth: 10 }))
      addTestResult("✅ Test 2: Brush size changed to Large")
    }, 1000)

    // Test 3: Mode change to erase
    setTimeout(() => {
      setDrawConfig((prev) => ({ ...prev, mode: "erase" }))
      addTestResult("✅ Test 3: Mode changed to Erase")
    }, 1500)

    // Test 4: Back to draw mode
    setTimeout(() => {
      setDrawConfig((prev) => ({ ...prev, mode: "draw", color: "#00FF00" }))
      addTestResult("✅ Test 4: Mode changed back to Draw with Green color")
    }, 2000)

    setTimeout(() => {
      setCurrentTest("")
      addTestResult("🎉 All automated tests completed!")
    }, 2500)
  }

  const colors = [
    { name: "Red", value: "#FF0000", bg: "bg-red-500" },
    { name: "Blue", value: "#0000FF", bg: "bg-blue-500" },
    { name: "Green", value: "#00FF00", bg: "bg-green-500" },
    { name: "Black", value: "#000000", bg: "bg-black" },
    { name: "Purple", value: "#800080", bg: "bg-purple-500" },
    { name: "Orange", value: "#FFA500", bg: "bg-orange-500" },
  ]

  const brushSizes = [
    { name: "XS", value: 1 },
    { name: "S", value: 2 },
    { name: "M", value: 5 },
    { name: "L", value: 10 },
    { name: "XL", value: 15 },
    { name: "XXL", value: 20 },
  ]

  if (!mounted) {
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
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">🎨 Canvas Drawing Test</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={runAutomatedTests}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                🤖 Run Auto Tests
              </button>
              <button
                onClick={saveCanvas}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                💾 Save Canvas
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Drawing Canvas</h2>

              {/* Canvas */}
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
                <img ref={imageRef} alt="Test Item" className="hidden" />
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
                  style={{ touchAction: "none" }}
                />
              </div>

              {/* Drawing Controls */}
              <div className="space-y-4">
                {/* Colors */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Colors:</h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          setDrawConfig((prev) => ({ ...prev, color: color.value, mode: "draw" }))
                          addTestResult(`🎨 Color changed to ${color.name}`)
                        }}
                        className={`w-8 h-8 rounded-full border-2 ${color.bg} ${
                          drawConfig.color === color.value && drawConfig.mode === "draw"
                            ? "ring-2 ring-offset-2 ring-blue-500"
                            : "border-gray-300"
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Brush Sizes */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Brush Sizes:</h3>
                  <div className="flex flex-wrap gap-2">
                    {brushSizes.map((size) => (
                      <button
                        key={size.name}
                        onClick={() => {
                          setDrawConfig((prev) => ({ ...prev, lineWidth: size.value, mode: "draw" }))
                          addTestResult(`🖌️ Brush size changed to ${size.name} (${size.value}px)`)
                        }}
                        className={`px-3 py-1 text-xs rounded-md border ${
                          drawConfig.lineWidth === size.value && drawConfig.mode === "draw"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Controls */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tools:</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDrawConfig((prev) => ({ ...prev, mode: "draw" }))
                        addTestResult("🖌️ Switched to Draw mode")
                      }}
                      className={`px-4 py-2 text-sm rounded-md ${
                        drawConfig.mode === "draw"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      🖌️ Draw
                    </button>
                    <button
                      onClick={() => {
                        setDrawConfig((prev) => ({ ...prev, mode: "erase" }))
                        addTestResult("🧽 Switched to Erase mode")
                      }}
                      className={`px-4 py-2 text-sm rounded-md ${
                        drawConfig.mode === "erase"
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      🧽 Erase
                    </button>
                    <button
                      onClick={handleClearCanvas}
                      className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                      🗑️ Clear All
                    </button>
                  </div>
                </div>

                {/* Current Settings Display */}
                <div className="bg-gray-100 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Current Settings:</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      Mode: <span className="font-medium">{drawConfig.mode.toUpperCase()}</span>
                    </div>
                    <div>
                      Color: <span className="font-medium">{drawConfig.color}</span>
                    </div>
                    <div>
                      Brush Size: <span className="font-medium">{drawConfig.lineWidth}px</span>
                    </div>
                    <div>
                      Status: <span className="font-medium">{isDrawing ? "Drawing..." : "Ready"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results & Saved Images */}
          <div className="space-y-6">
            {/* Test Results */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
              {currentTest && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-blue-800">{currentTest}</span>
                  </div>
                </div>
              )}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded border-l-2 border-green-400">
                    {result}
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Images */}
            {savedImages.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Saved Images ({savedImages.length})</h2>
                <div className="space-y-4">
                  {savedImages.map((imageData, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-2">
                      <div className="text-xs text-gray-600 mb-2">Image #{index + 1}</div>
                      <img
                        src={imageData || "/placeholder.svg"}
                        alt={`Saved canvas ${index + 1}`}
                        className="w-full h-auto rounded border"
                      />
                      <button
                        onClick={() => {
                          const link = document.createElement("a")
                          link.download = `canvas-test-${index + 1}.png`
                          link.href = imageData
                          link.click()
                        }}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        📥 Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Test Instructions</h2>
              <div className="text-sm text-gray-600 space-y-2">
                <div>1. 🎨 Try different colors by clicking color buttons</div>
                <div>2. 🖌️ Test various brush sizes (XS to XXL)</div>
                <div>3. ✏️ Switch between Draw and Erase modes</div>
                <div>4. 📱 Test touch drawing on mobile devices</div>
                <div>5. 🗑️ Use Clear All to reset canvas</div>
                <div>6. 💾 Save your drawings as images</div>
                <div>7. 🤖 Run automated tests for quick validation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CanvasTestPage
