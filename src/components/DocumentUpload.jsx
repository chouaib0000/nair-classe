import React, { useState } from 'react';
import { Upload, X, File, Mic, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

function DocumentUpload({ label, onDocumentChange, currentDocument = '', type = "image" }) {
  const [preview, setPreview] = useState(currentDocument);
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

    const validTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3'],
      document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    };

    if (!validTypes[type].includes(file.type)) {
      Swal.fire('Erreur', `Type de fichier invalide pour ${label}`, 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire('Erreur', 'La taille du fichier doit être inférieure à 10MB', 'error');
      return;
    }

    let processedFile = file;
    if (type === 'image') {
      processedFile = await compressImage(file);
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onDocumentChange(reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      setUploading(false);
      Swal.fire('Erreur', 'Échec du chargement du fichier', 'error');
    }
  };

  const clearDocument = () => {
    setPreview('');
    onDocumentChange('');
  };

  const renderPreview = () => {
    if (!preview) return null;

    if (type === 'audio') {
      return (
        <div className="relative p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <audio controls className="w-full">
            <source src={preview} />
          </audio>
          <button
            onClick={clearDocument}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
        <img
          src={preview}
          alt={label}
          className="w-full h-auto max-h-96 object-contain"
        />
        <button
          onClick={clearDocument}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const getIcon = () => {
    switch (type) {
      case 'audio': return <Mic className="mx-auto h-12 w-12 text-neutral-400" />;
      case 'document': return <File className="mx-auto h-12 w-12 text-neutral-400" />;
      default: return <ImageIcon className="mx-auto h-12 w-12 text-neutral-400" />;
    }
  };

  const getAcceptTypes = () => {
    switch (type) {
      case 'audio': return 'audio/*';
      case 'document': return 'image/*,application/pdf';
      default: return 'image/*';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-neutral-700 mb-2">
        {label}
      </label>
      {!preview && (
        <div className="relative border-2 border-dashed border-neutral-200 rounded-lg p-6 hover:border-primary-300 transition-colors">
          <input
            type="file"
            accept={getAcceptTypes()}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="text-center">
            {getIcon()}
            <p className="mt-2 text-sm text-neutral-600">
              {uploading ? 'Chargement...' : 'Cliquez pour télécharger'}
            </p>
            <p className="text-xs text-neutral-500">Max 10MB</p>
          </div>
        </div>
      )}

      {renderPreview()}
    </div>
  );
}

export default DocumentUpload;