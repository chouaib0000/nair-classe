import React, { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

function ImageUpload({ onImageUrlChange, currentImageUrl = '' }) {
  const [preview, setPreview] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Please select an image file', 'error');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'Image size must be less than 5MB', 'error');
      return;
    }

    const compressedBlob = await compressImage(file);

    setUploading(true);

    try {
      // Create a FileReader to preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onImageUrlChange(reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      setUploading(false);
      Swal.fire('Error', 'Failed to load image', 'error');
    }
  };

  const handleUrlInput = (url) => {
    setPreview(url);
    onImageUrlChange(url);
  };

  const clearImage = () => {
    setPreview('');
    onImageUrlChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Image URL (Optionnel)
          </label>
          <input
            type="url"
            value={preview || ''}
            onChange={(e) => handleUrlInput(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          Ou Télécharger Image
        </label>
        <div className="relative border-2 border-dashed border-neutral-200 rounded-lg p-6 hover:border-primary-300 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-neutral-400" />
            <p className="mt-2 text-sm text-neutral-600">
              {uploading ? 'Chargement...' : 'Cliquez pour télécharger'}
            </p>
            <p className="text-xs text-neutral-500">PNG, JPG up to 5MB</p>
          </div>
        </div>
      </div>

      {preview && (
        <div className="relative rounded-lg overflow-hidden border border-neutral-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
            onError={() => {
              Swal.fire('Error', 'Failed to load image', 'error');
              clearImage();
            }}
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
