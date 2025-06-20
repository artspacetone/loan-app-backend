"use client"

import type React from "react"

import { useState, useEffect } from "react"

export default function SettingsPage() {
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadCompanyLogo()
  }, [])

  const loadCompanyLogo = () => {
    const logo = localStorage.getItem("companyLogo")
    if (logo) {
      setCompanyLogo(logo)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage("❌ Ukuran file maksimal 2MB")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setMessage("❌ File harus berupa gambar")
      return
    }

    setIsUploading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      localStorage.setItem("companyLogo", result)
      setCompanyLogo(result)
      setMessage("✅ Logo berhasil diupload")
      setIsUploading(false)
    }

    reader.onerror = () => {
      setMessage("❌ Gagal membaca file")
      setIsUploading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    localStorage.removeItem("companyLogo")
    setCompanyLogo("")
    setMessage("✅ Logo berhasil dihapus")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">⚙️ Pengaturan Sistem</h1>
          <p className="text-gray-600">Kelola pengaturan dan konfigurasi sistem</p>
        </div>

        {/* Company Logo Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏢 Logo Perusahaan</h2>

          {/* Current Logo Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Saat Ini:</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {companyLogo ? (
                <div>
                  <img src={companyLogo || "/placeholder.svg"} alt="Company Logo" className="h-24 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Logo aktif</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl text-gray-400 mb-2">🏢</div>
                  <p className="text-gray-500">Belum ada logo</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo Baru:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: JPG, PNG, GIF. Maksimal 2MB. Rekomendasi ukuran: 200x80px
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {companyLogo && (
                <button
                  onClick={handleRemoveLogo}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  🗑️ Hapus Logo
                </button>
              )}
            </div>

            {/* Status Message */}
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Loading State */}
            {isUploading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Mengupload logo...</span>
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Informasi Sistem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Versi Sistem:</span>
              <span className="ml-2 text-gray-600">v1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Database:</span>
              <span className="ml-2 text-gray-600">LocalStorage</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Update:</span>
              <span className="ml-2 text-gray-600">{new Date().toLocaleDateString("id-ID")}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Environment:</span>
              <span className="ml-2 text-gray-600">Development</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
