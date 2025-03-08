'use client';

import React, { useState } from 'react';

interface VolumeControlProps {
  onVolumeChange: (volume: number) => void;
}

export default function VolumeControl({ onVolumeChange }: VolumeControlProps) {
  const [volume, setVolume] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Paramètres
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-xl border">
          <h3 className="text-lg font-semibold mb-2">Volume</h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-32"
          />
          <div className="text-sm text-gray-600 mt-1">
            {Math.round(volume * 100)}%
          </div>
        </div>
      )}
    </div>
  );
} 