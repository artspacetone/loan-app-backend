"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  const handleGoHome = () => {
    try {
      router.push("/login")
    } catch (err) {
      window.location.href = "/login"
    }
  }

  const handleReset = () => {
    try {
      // Clear localStorage to reset state
      if (typeof window !== "undefined") {
        localStorage.clear()
      }
      reset()
    } catch (err) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan!</h1>
          <p className="text-gray-600 mb-6">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau kembali ke halaman utama.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Coba Lagi
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            🏠 Kembali ke Login
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🔄 Refresh Halaman
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Detail Error (Development)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-red-600 overflow-auto max-h-32">
              <pre>{error.message}</pre>
              {error.stack && <pre className="mt-2 text-xs">{error.stack}</pre>}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
