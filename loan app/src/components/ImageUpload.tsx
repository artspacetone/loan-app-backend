import React, { useState, useCallback } from 'react';

interface ImageUploadProps {
  onFileSelect: (file: File | null, previewUrl: string | null) => void;
  label?: string;
  currentImageUrl?: string; // To display an existing image
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, label = "Upload Image", currentImageUrl }) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File size exceeds 2MB limit.");
        onFileSelect(null, null);
        setPreview(currentImageUrl || null);
        setFileName(null);
        event.target.value = ''; // Reset file input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onFileSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
      setFileName(file.name);
    } else {
      onFileSelect(null, null);
      setPreview(currentImageUrl || null);
      setFileName(null);
    }
  }, [onFileSelect, currentImageUrl]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="mt-1 flex flex-col items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        {preview ? (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="max-h-48 rounded-md shadow-md" />
          </div>
        ) : (
          <div className="space-y-1 text-center mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
          </div>
        )}
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
          >
            <span>{preview && fileName ? `Change file` : `Upload a file`}</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" />
          </label>
        </div>
        {fileName && <p className="text-xs text-gray-500 mt-2">{fileName}</p>}
      </div>
    </div>
  );
};

export default ImageUpload;
