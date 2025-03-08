'use client';

import React, { useState, useEffect, useRef } from 'react';
import VolumeControl from '@/components/VolumeControl';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gestionnaire pour vérifier le temps de la vidéo
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 58) {
      // On garde la frame à 58 secondes
      videoRef.current.currentTime = 58;
      // On ne met pas la vidéo en pause pour garder le son
      setVideoEnded(true);

      // On désactive la mise à jour du temps pour éviter les boucles
      if (videoRef.current.ontimeupdate) {
        videoRef.current.ontimeupdate = null;
      }
    }
  };

  const handleVolumeChange = (volume: number) => {
    setVideoVolume(volume);
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setVideoEnded(false);
    setIsPaused(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handlePausePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleInteractiveButton = (buttonNumber: number) => {
    // Ici vous pourrez ajouter la logique pour charger différentes vidéos
    console.log(`Chargement de la vidéo ${buttonNumber}`);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Vidéo en arrière-plan absolu */}
      <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none"
          src="https://res.cloudinary.com/dpqjlqwcq/video/upload/introduction"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        />
      </div>

      {/* Contenu interactif au premier plan */}
      <div className="relative w-full min-h-screen" style={{ zIndex: 10 }}>
        {!isPlaying ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-8">
                Orchestre Interactif
              </h1>
              <button
                onClick={handlePlay}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xl px-8 py-4 rounded-lg transition-colors transform hover:scale-105"
              >
                Jouer
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-screen">
            {/* Interface de contrôle superposée - visible seulement pendant la lecture */}
            {!videoEnded && (
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                {/* Bouton Pause/Play */}
                <button
                  onClick={handlePausePlay}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm"
                >
                  {isPaused ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Reprendre
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pause
                    </>
                  )}
                </button>

                {/* Contrôle du volume */}
                <VolumeControl onVolumeChange={handleVolumeChange} />
              </div>
            )}

            {/* Boutons interactifs - visibles uniquement à la fin de la vidéo */}
            {videoEnded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-16">
                <div className="flex gap-6">
                  {[1, 2, 3].map((number) => (
                    <button
                      key={number}
                      onClick={() => handleInteractiveButton(number)}
                      className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white text-xl px-8 py-4 rounded-lg transition-all transform hover:scale-110 hover:bg-blue-500 border-2 border-white"
                    >
                      Option {number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 