"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-8">Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Beranda
          </Link>

          <div className="text-sm text-gray-500">
            <p>Atau coba halaman berikut:</p>
            <div className="mt-2 space-x-4">
              <Link href="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
