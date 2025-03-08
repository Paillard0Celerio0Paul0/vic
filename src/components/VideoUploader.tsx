'use client';

import React from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';

// Ajout des types pour Node
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: string;
    }
  }
}

interface VideoUploaderProps {
  onUploadSuccess?: (result: any) => void;
}

export default function VideoUploader({ onUploadSuccess }: VideoUploaderProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');

  const handleUploadSuccess = (result: any) => {
    setVideoUrl(result.info.secure_url);
    if (onUploadSuccess) {
      onUploadSuccess(result);
    }
  };

  return (
    <div className="space-y-4">
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onUpload={(result: any) => handleUploadSuccess(result)}
      >
        {({ open }) => (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => open()}
          >
            Télécharger une vidéo
          </button>
        )}
      </CldUploadWidget>

      {videoUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Vidéo téléchargée :</h3>
          <video
            controls
            className="w-full max-w-2xl rounded-lg shadow-lg"
            src={videoUrl}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      )}
    </div>
  );
} 