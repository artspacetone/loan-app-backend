"use client"

import type React from "react"
import { useCallback, useState } from "react"
import { Upload, X, File, ImageIcon } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  accept?: string
  maxSize?: number
  className?: string
  disabled?: boolean
  currentFile?: File | string
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  disabled = false,
  currentFile,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return false
    }

    // Check file type
    const acceptedTypes = accept.split(",").map((type) => type.trim())
    const isValidType = acceptedTypes.some((type) => {
      if (type === "image/*") return file.type.startsWith("image/")
      if (type === "application/*") return file.type.startsWith("application/")
      return file.type === type
    })

    if (!isValidType) {
      setError("File type not supported")
      return false
    }

    return true
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    },
    [onFileSelect, maxSize, accept],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      handleFiles(e.dataTransfer.files)
    },
    [handleFiles, disabled],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      if (disabled) return

      handleFiles(e.target.files)
    },
    [handleFiles, disabled],
  )

  const isImage = (file: File | string): boolean => {
    if (typeof file === "string") return true // Assume string URLs are images
    return file.type.startsWith("image/")
  }

  const getFileName = (file: File | string): string => {
    if (typeof file === "string") return file.split("/").pop() || "Unknown file"
    return file.name
  }

  const getFileSize = (file: File | string): string => {
    if (typeof file === "string") return ""
    const size = file.size
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className={cn("w-full", className)}>
      {currentFile ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isImage(currentFile) ? (
                <ImageIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <File className="h-8 w-8 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{getFileName(currentFile)}</p>
                {typeof currentFile !== "string" && <p className="text-xs text-gray-500">{getFileSize(currentFile)}</p>}
              </div>
            </div>
            {onFileRemove && (
              <Button type="button" variant="ghost" size="sm" onClick={onFileRemove} disabled={disabled}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors",
            dragActive && "border-blue-400 bg-blue-50",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-300",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.includes("image") && "PNG, JPG, GIF up to "}
            {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
