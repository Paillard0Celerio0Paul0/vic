'use client';

import React, { useState, useEffect, useRef } from 'react';
import VolumeControl from '../components/VolumeControl';
import InteractiveZones from '../components/InteractiveZones';
import VideoPreloader from '../components/VideoPreloader';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<"introduction" | "POV_1" | "POV_2" | "POV_3" | 
    "objet_vélo" | "objet_boxe" | "objet_foot" |
    "objet_mapmonde" | "objet_sablier" | "objet_plante" | "objet_cd" |
    "objet_chien" | "objet_jeuxvideo" | "objet_photo">("introduction");
  const [videoType, setVideoType] = useState<"introduction" | "lit" | "POV" | "transition" | "objet">("introduction");
  const [nextPOV, setNextPOV] = useState<"POV_1" | "POV_2" | "POV_3" | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [mainSongTime, setMainSongTime] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [logoOpacity, setLogoOpacity] = useState(1);

  // Fonction pour obtenir l'URL optimisée avec transformations Cloudinary
  const getOptimizedVideoUrl = (videoId: string) => {
    return `https://res.cloudinary.com/dpqjlqwcq/video/upload/q_auto,f_auto,w_1920/${videoId}`;
  };

  // Timecodes d'arrêt pour chaque vidéo
  const videoEndTimes = {
    "introduction": 58,
    "POV_1": 25,
    "POV_2": 25,
    "POV_3": 25,
    "objet_vélo": 13,
    "objet_boxe": 29,
    "objet_foot": 31,
    "objet_mapmonde": 31,
    "objet_sablier": 28,
    "objet_plante": 31,
    "objet_cd": 21,
    "objet_chien": 13,
    "objet_jeuxvideo": 17,
    "objet_photo": 33,
  } as const;

  // Liste des objets qui ont une musique associée
  const objectsWithMusic = ["boxe", "foot", "chien", "jeuxvideo"];

  // Fonction pour créer un fondu
  const fadeAudio = (audio: HTMLAudioElement, targetVolume: number, duration: number = 1000) => {
    const startVolume = audio.volume;
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    fade();
  };

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
      videoRef.current.src = getOptimizedVideoUrl(transitionVideo);
      videoRef.current.volume = 0;
      videoRef.current.load();
    }
    setVideoEnded(false);
    setVideoType("transition");
  };

  // Gestionnaire pour les clics sur les zones interactives
  const handleZoneClick = (zoneId: string) => {
    const objetVideo = `${zoneId}` as typeof currentVideo;
    setCurrentVideo(objetVideo);
    setVideoType("objet");
    
    // Sauvegarder le temps actuel de la musique principale
    if (audioRef.current) {
      setMainSongTime(audioRef.current.currentTime);
    }

    if (videoRef.current) {
      videoRef.current.src = getOptimizedVideoUrl(objetVideo);
      videoRef.current.volume = 0;
      videoRef.current.load();
    }

    // Gérer la musique
    if (audioRef.current) {
      const objetType = zoneId;
      if (objectsWithMusic.includes(objetType)) {
        // Si l'objet a une musique associée, on fait un fondu
        setIsFading(true);
        fadeAudio(audioRef.current, 0, 500); // Fade out sur 500ms

        // Après le fade out, on change la source et on fait un fade in
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = getOptimizedVideoUrl(`${objetType}_song`);
            audioRef.current.volume = 0;
            audioRef.current.play();
            fadeAudio(audioRef.current, videoVolume, 500); // Fade in sur 500ms
            setIsFading(false);
          }
        }, 500);
      } else {
        // Si l'objet n'a pas de musique associée, on continue la musique principale
        audioRef.current.volume = videoVolume;
      }
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
        videoRef.current.volume = 0;
        if (audioRef.current) {
          audioRef.current.play();
          audioRef.current.volume = videoVolume;
        }
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
          videoRef.current.src = getOptimizedVideoUrl(newVideo);
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
          videoRef.current.src = getOptimizedVideoUrl(nextPOV);
          videoRef.current.volume = 0;
          videoRef.current.load();
        }
      }
      // Si c'est une vidéo objet, on vérifie si elle est terminée
      else if (videoType === "objet" && videoRef.current.ended) {
        // On ne fait rien, on attend le clic sur le bouton retour
        videoRef.current.pause();
        setVideoEnded(true);
      }
    }
  };

  const handleVolumeChange = (volume: number) => {
    setVideoVolume(volume);
    if (videoRef.current && audioRef.current) {
      if (currentVideo === "introduction") {
        videoRef.current.volume = volume;
      } else {
        fadeAudio(audioRef.current, volume, 300); // Fade plus court pour le contrôle du volume
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setVideoEnded(false);
    setIsPaused(false);
    setShowLogo(true);
    setLogoOpacity(1);

    // Faire disparaître progressivement le logo et le fond avec une transition plus douce
    const startTime = Date.now();
    const fadeOut = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 10000, 1); // Augmentation à 10 secondes
      // Utilisation d'une courbe d'accélération plus douce
      const easedProgress = 1 - Math.pow(1 - progress, 4); // Courbe d'accélération quartique
      setLogoOpacity(1 - easedProgress);

      if (progress < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        setShowLogo(false);
      }
    };

    fadeOut();

    // Démarrer la vidéo et l'audio
    if (videoRef.current && audioRef.current) {
      videoRef.current.play();
      // Si c'est la vidéo d'introduction, on active son audio
      if (currentVideo === "introduction") {
        videoRef.current.volume = videoVolume;
        audioRef.current.pause();
      } else {
        videoRef.current.volume = 0;
        audioRef.current.play();
        audioRef.current.volume = videoVolume;
      }
    }
  };

  const handlePausePlay = () => {
    if (videoRef.current && audioRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        if (currentVideo === "introduction") {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        audioRef.current.pause();
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
      videoRef.current.src = getOptimizedVideoUrl(litVideo);
      videoRef.current.volume = 0;
      videoRef.current.load();
    }
    setVideoEnded(false);
  };

  // Gestionnaire pour démarrer la vidéo une fois chargée
  const handleVideoLoaded = () => {
    if (videoRef.current && !videoEnded && currentVideo !== "introduction") {
      videoRef.current.play();
    }
  };

  const handleReturn = () => {
    // D'abord, on arrête la vidéo actuelle
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    // Ensuite, on met à jour les états
    setVideoEnded(true);
    setIsPlaying(true);
    setIsPaused(false);
    setVideoType("introduction");
    setCurrentVideo("introduction");

    // Enfin, on charge la vidéo d'introduction
    if (videoRef.current) {
      videoRef.current.src = getOptimizedVideoUrl("introduction");
      videoRef.current.currentTime = videoEndTimes.introduction;
      videoRef.current.volume = 0;
      videoRef.current.pause();
    }
  };

  // Gestionnaire pour retourner à la vidéo POV
  const handleReturnToPOV = () => {
    // Déterminer le POV en fonction de la vidéo d'objet
    let povVideo: "POV_1" | "POV_2" | "POV_3";
   
    // Extraire le type d'objet en enlevant le préfixe "objet_"
    const objetType = currentVideo;
    // POV_1 pour vélo, boxe et foot
    if (["vélo", "boxe", "foot"].includes(objetType)) {
      povVideo = "POV_1";
    }
    // POV_2 pour mapmonde, cd, plante et sablier
    else if (["mapmonde", "cd", "plante", "sablier"].includes(objetType)) {
      povVideo = "POV_2";
    }
    // POV_3 pour chien, photo et jeuxvideo
    else if (["chien", "photo", "jeuxvideo"].includes(objetType)) {
      povVideo = "POV_3";
    } else {
      return; // Si l'objet n'est pas reconnu, on ne fait rien
    }

    setCurrentVideo(povVideo);
    setVideoType("POV");
    
    // Reprendre la musique principale avec un fondu
    if (audioRef.current) {
      setIsFading(true);
      fadeAudio(audioRef.current, 0, 500); // Fade out sur 500ms

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = getOptimizedVideoUrl("main_song");
          audioRef.current.currentTime = mainSongTime;
          audioRef.current.volume = 0;
          audioRef.current.play();
          fadeAudio(audioRef.current, videoVolume, 500); // Fade in sur 500ms
          setIsFading(false);
        }
      }, 500);
    }

    if (videoRef.current) {
      // D'abord, on arrête la vidéo actuelle
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      // Ensuite, on change la source
      videoRef.current.src = getOptimizedVideoUrl(povVideo);
      videoRef.current.volume = 0;
      
      // On attend que la vidéo soit chargée avant de la lancer
      videoRef.current.onloadeddata = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play();
          setVideoEnded(false);
          setIsPaused(false);
          setIsPlaying(true);
        }
      };
    }
  };

  // Gestionnaire pour la fin de la musique principale
  useEffect(() => {
    if (audioRef.current) {
      const handleAudioEnded = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      };

      audioRef.current.addEventListener('ended', handleAudioEnded);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleAudioEnded);
        }
      };
    }
  }, []);

  // Synchroniser les vidéos au chargement
  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      if (currentVideo === "introduction") {
        videoRef.current.volume = videoVolume;
        audioRef.current.pause();
      } else {
        videoRef.current.volume = 0;
        audioRef.current.volume = videoVolume;
      }
    }
  }, [videoVolume, currentVideo]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Préchargeur de vidéos */}
      <VideoPreloader currentVideo={currentVideo} videoType={videoType} />
      
      {/* Vidéo en arrière-plan absolu */}
      <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none"
          src={getOptimizedVideoUrl(currentVideo)}
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
        {/* Audio pour la musique de fond */}
        <audio
          ref={audioRef}
          src={getOptimizedVideoUrl("main_song")}
          loop
        />
      </div>

      {/* Contenu interactif au premier plan */}
      <div className="relative w-full min-h-screen" style={{ zIndex: 10 }}>
        {!isPlaying && currentVideo === "introduction" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <button
                onClick={handlePlay}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xl px-8 py-4 rounded-lg transition-colors transform hover:scale-105"
              >
                Jouer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Superposition du logo */}
            {showLogo && (
              <div 
                className="absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out"
                style={{ 
                  opacity: logoOpacity, 
                  zIndex: 20,
                  background: `rgba(0, 0, 0, ${logoOpacity})`,
                  transition: 'background 1s ease-in-out, opacity 1s ease-in-out'
                }}
              >
                <img 
                  src="/locg_logo.png" 
                  alt="Logo" 
                  className="max-w-[80%] max-h-[80%] object-contain transition-all duration-1000 ease-in-out"
                  style={{
                    opacity: logoOpacity,
                    transform: `scale(${0.8 + (logoOpacity * 0.2)})`,
                    transition: 'opacity 1s ease-in-out, transform 1s ease-in-out'
                  }}
                />
              </div>
            )}
            
            {/* Interface de contrôle superposée */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
             
              {!videoEnded && currentVideo === "introduction" && (
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
                  <img src="/icons/boxgloves.svg" alt="Boxing Gloves" className="w-12 h-12 invert brightness-0" />
                  <span className="text-lg">1</span>
                </button>
                <button
                  onClick={() => handleInteractiveButton(2)}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                >
                  <img src="/icons/desk.svg" alt="Desk" className="w-12 h-12 invert brightness-0" />
                  <span className="text-lg">2</span>
                </button>
                <button
                  onClick={() => handleInteractiveButton(3)}
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                >
                  <img src="/icons/armoire.svg" alt="Wardrobe" className="w-12 h-12 invert brightness-0" />
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
                  <img 
                    src={`/icons/${currentVideo === "POV_1" ? "desk" : 
                          currentVideo === "POV_2" ? "boxgloves" : 
                          "boxgloves"}.svg`} 
                    alt="Left transition" 
                    className="w-12 h-12 invert brightness-0" 
                  />
                </button>

                {/* Bouton droit */}
                <button
                  onClick={() => handleTransition("right")}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-6 rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm flex items-center justify-center"
                >
                  <img 
                    src={`/icons/${currentVideo === "POV_1" ? "armoire" : 
                          currentVideo === "POV_2" ? "armoire" : 
                          "desk"}.svg`} 
                    alt="Right transition" 
                    className="w-12 h-12 invert brightness-0" 
                  />
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

            {/* Bouton Continuer - visible uniquement à la fin des vidéos d'objets */}
            {videoType === "objet" && videoEnded && (
              <button
                onClick={handleReturnToPOV}
                className="absolute bottom-8 right-8 bg-black bg-opacity-50 hover:bg-opacity-75 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 backdrop-blur-sm"
              >
                <span className="text-lg">Continuer</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
} 