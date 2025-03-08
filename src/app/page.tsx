'use client';

import React, { useState, useEffect, useRef } from 'react';
import VolumeControl from '@/components/VolumeControl';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<"introduction" | "choix1" | "choix2" | "choix3">("introduction");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Timecodes d'arrêt pour chaque vidéo
  const videoEndTimes = {
    "introduction": 58,
    "choix1": 25,
    "choix2": 25,
    "choix3": 25,
  } as const;

  // Gestionnaire pour vérifier le temps de la vidéo
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= videoEndTimes[currentVideo]) {
      // On garde la frame à la fin sur la vidéo visible
      videoRef.current.currentTime = videoEndTimes[currentVideo];
      videoRef.current.pause();
      setVideoEnded(true);
    }
  };

  const handleVolumeChange = (volume: number) => {
    setVideoVolume(volume);
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.volume = volume;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setVideoEnded(false);
    setIsPaused(false);
    if (videoRef.current && hiddenVideoRef.current) {
      videoRef.current.play();
      hiddenVideoRef.current.play();
      videoRef.current.volume = 0;
      hiddenVideoRef.current.volume = videoVolume;
    }
  };

  const handlePausePlay = () => {
    if (videoRef.current && hiddenVideoRef.current) {
      if (videoRef.current.paused || hiddenVideoRef.current.paused) {
        videoRef.current.play();
        hiddenVideoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        hiddenVideoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleInteractiveButton = (buttonNumber: number) => {
    // Changer la vidéo visible tout en gardant la musique de fond
    const newVideo = `choix${buttonNumber}` as "choix1" | "choix2" | "choix3";
    setCurrentVideo(newVideo);
    if (videoRef.current) {
      videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${newVideo}`;
      videoRef.current.volume = 0; // Garder la vidéo muette
      // Attendre que la vidéo soit chargée avant de la jouer
      videoRef.current.load();
    }
    setVideoEnded(false);
  };

  // Gestionnaire pour démarrer la vidéo une fois chargée
  const handleVideoLoaded = () => {
    if (videoRef.current && !videoEnded) {
      videoRef.current.play();
    }
  };

  const handleReturn = () => {
    setCurrentVideo("introduction");
    if (videoRef.current) {
      videoRef.current.src = "https://res.cloudinary.com/dpqjlqwcq/video/upload/introduction";
      videoRef.current.currentTime = videoEndTimes.introduction;
      videoRef.current.volume = 0;
    }
    setVideoEnded(true);
  };

  // Synchroniser les vidéos au chargement
  useEffect(() => {
    if (videoRef.current && hiddenVideoRef.current) {
      videoRef.current.volume = 0; // La vidéo principale reste muette
      hiddenVideoRef.current.volume = videoVolume;
    }
  }, [videoVolume]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Vidéo en arrière-plan absolu */}
      <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none"
          src={`https://res.cloudinary.com/dpqjlqwcq/video/upload/${currentVideo}`}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={handleVideoLoaded}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        />
        {/* Vidéo cachée pour le son de fond */}
        <video
          ref={hiddenVideoRef}
          className="hidden"
          src="https://res.cloudinary.com/dpqjlqwcq/video/upload/introduction"
          playsInline
          loop
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
            {/* Interface de contrôle superposée */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
              {/* Bouton Retour - visible seulement pendant les vidéos de choix */}
              {currentVideo !== "introduction" && (
                <button
                  onClick={handleReturn}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour
                </button>
              )}

              {/* Bouton Pause/Play - visible seulement pendant la lecture */}
              {!videoEnded && (
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
              )}

              {/* Contrôle du volume - toujours visible */}
              <VolumeControl onVolumeChange={handleVolumeChange} />
            </div>

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