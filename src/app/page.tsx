'use client';

import React, { useState, useEffect, useRef } from 'react';
import VolumeControl from '../components/VolumeControl';
import InteractiveZones from '../components/InteractiveZones';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<"introduction" | "POV_1" | "POV_2" | "POV_3" | 
    "objet_velo" | "objet_boxe" | "objet_foot" |
    "objet_cd" | "objet_mapmonde" | "objet_sablier" | "objet_plante" |
    "objet_chien" | "objet_photo" | "objet_jeuxvideo">("introduction");
  const [videoType, setVideoType] = useState<"introduction" | "lit" | "POV" | "transition" | "objet">("introduction");
  const [nextPOV, setNextPOV] = useState<"POV_1" | "POV_2" | "POV_3" | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Timecodes d'arrêt pour chaque vidéo
  const videoEndTimes = {
    "introduction": 58,
    "POV_1": 25,
    "POV_2": 25,
    "POV_3": 25,
    "objet_velo": 15,
    "objet_boxe": 15,
    "objet_foot": 15,
    "objet_cd": 15,
    "objet_mapmonde": 15,
    "objet_sablier": 15,
    "objet_plante": 15,
    "objet_chien": 15,
    "objet_photo": 15,
    "objet_jeuxvideo": 15,
  } as const;

  const handleTransition = (direction: "left" | "right") => {
    let transitionVideo = "";
    let nextVideo = "";
    
    // Déterminer la vidéo de transition et la vidéo POV suivante
    if (currentVideo === "POV_1") {
      transitionVideo = direction === "left" ? "1_vers_2" : "1_vers_3";
      nextVideo = direction === "left" ? "POV_2" : "POV_3";
    } else if (currentVideo === "POV_2") {
      transitionVideo = direction === "left" ? "2_vers_1" : "2_vers_3";
      nextVideo = direction === "left" ? "POV_1" : "POV_3";
    } else if (currentVideo === "POV_3") {
      transitionVideo = direction === "left" ? "3_vers_1" : "3_vers_2";
      nextVideo = direction === "left" ? "POV_1" : "POV_2";
    }

    // Stocker la vidéo POV suivante
    setNextPOV(nextVideo as "POV_1" | "POV_2" | "POV_3");

    // Changer la vidéo visible
    if (videoRef.current) {
      videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${transitionVideo}`;
      videoRef.current.volume = 0;
      videoRef.current.load();
    }
    setVideoEnded(false);
    setVideoType("transition");
  };

  // Gestionnaire pour les clics sur les zones interactives
  const handleZoneClick = (zoneId: string) => {
    const objetVideo = `objet_${zoneId}` as typeof currentVideo;
    setCurrentVideo(objetVideo);
    setVideoType("objet");
    if (videoRef.current) {
      videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${objetVideo}`;
      videoRef.current.volume = 0;
      videoRef.current.load();
    }
    setVideoEnded(false);
  };

  // Gestionnaire pour vérifier le temps de la vidéo
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // Si c'est la vidéo d'introduction, on vérifie le timecode d'arrêt
      if (currentVideo === "introduction" && videoRef.current.currentTime >= videoEndTimes.introduction) {
        videoRef.current.currentTime = videoEndTimes.introduction;
        videoRef.current.pause();
        setVideoEnded(true);
      }
      // Si c'est une vidéo POV, on vérifie le timecode d'arrêt
      else if (videoType === "POV" && videoRef.current.currentTime >= videoEndTimes[currentVideo]) {
        videoRef.current.currentTime = videoEndTimes[currentVideo];
        videoRef.current.pause();
        setVideoEnded(true);
      }
      // Si c'est une vidéo lit, on vérifie si elle est terminée
      else if (videoType === "lit" && videoRef.current.ended) {
        // Passer à la vidéo POV correspondante
        const povNumber = currentVideo.split('_')[2];
        const newVideo = `POV_${povNumber}` as "POV_1" | "POV_2" | "POV_3";
        setCurrentVideo(newVideo);
        setVideoType("POV");
        if (videoRef.current) {
          videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${newVideo}`;
          videoRef.current.volume = 0;
          videoRef.current.load();
        }
      }
      // Si c'est une vidéo de transition (numero_vers_numero), on vérifie si elle est terminée
      else if (videoType === "transition" && videoRef.current.ended && nextPOV) {
        // Passer à la vidéo POV correspondante
        setCurrentVideo(nextPOV);
        setNextPOV(null);
        setVideoType("POV");
        if (videoRef.current) {
          videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${nextPOV}`;
          videoRef.current.volume = 0;
          videoRef.current.load();
        }
      }
      // Si c'est une vidéo objet, on vérifie si elle est terminée
      else if (videoType === "objet" && videoRef.current.ended) {
        // Retourner à la vidéo POV précédente
        const povNumber = currentVideo.split('_')[1];
        const povVideo = `POV_${povNumber}` as "POV_1" | "POV_2" | "POV_3";
        setCurrentVideo(povVideo);
        setVideoType("POV");
        if (videoRef.current) {
          videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${povVideo}`;
          videoRef.current.volume = 0;
          videoRef.current.load();
        }
      }
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
    const litVideo = `lit_vers_${buttonNumber}`;
    setVideoType("lit");
    setCurrentVideo(litVideo as any); // Mise à jour temporaire pour le type
    if (videoRef.current) {
      videoRef.current.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/${litVideo}`;
      videoRef.current.volume = 0;
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

            {/* Boutons d'options - visibles uniquement à la fin de la vidéo d'introduction */}
            {videoEnded && currentVideo === "introduction" && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex flex-row gap-4">
                <button
                  onClick={() => handleInteractiveButton(1)}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-4xl">🚪</span>
                  <span className="text-lg">1</span>
                </button>
                <button
                  onClick={() => handleInteractiveButton(2)}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-4xl">💼</span>
                  <span className="text-lg">2</span>
                </button>
                <button
                  onClick={() => handleInteractiveButton(3)}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-4xl">🗄️</span>
                  <span className="text-lg">3</span>
                </button>
              </div>
            )}

            {/* Boutons latéraux pour les vidéos POV */}
            {videoType === "POV" && currentVideo !== "introduction" && (
              <>
                {/* Bouton gauche */}
                <button
                  onClick={() => handleTransition("left")}
                  className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex items-center justify-center"
                >
                  <span className="text-4xl">
                    {currentVideo === "POV_1" ? "💼" : 
                     currentVideo === "POV_2" ? "🚪" : 
                     "🚪"}
                  </span>
                </button>

                {/* Bouton droit */}
                <button
                  onClick={() => handleTransition("right")}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex items-center justify-center"
                >
                  <span className="text-4xl">
                    {currentVideo === "POV_1" ? "🗄️" : 
                     currentVideo === "POV_2" ? "🗄️" : 
                     "💼"}
                  </span>
                </button>
              </>
            )}

            {/* Ajouter les zones interactives pour les vidéos POV */}
            {videoType === "POV" && (
              <InteractiveZones
                currentVideo={currentVideo}
                onZoneClick={handleZoneClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 