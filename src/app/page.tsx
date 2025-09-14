'use client';

import { useState, useEffect, useRef } from 'react';
import InteractiveZones from '../components/InteractiveZones';
import VideoPreloader from '../components/VideoPreloader';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoEnded, setVideoEnded] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<"introduction" | "POV_1" | "POV_2" | "POV_3" | 
    "objet_velo" | "objet_boxe" | "objet_foot" |
    "objet_mapmonde" | "objet_sablier" | "objet_plante" | "objet_cd" |
    "objet_chien" | "objet_jeuxvideo" | "objet_photo" | "outro" | "generique">("introduction");
  const [videoType, setVideoType] = useState<"introduction" | "lit" | "POV" | "transition" | "objet" | "outro" | "generique">("introduction");
  const [nextPOV, setNextPOV] = useState<"POV_1" | "POV_2" | "POV_3" | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isFading, setIsFading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [explanatoryVideo, setExplanatoryVideo] = useState<string | null>(null);
  const [showExplanatoryVideo, setShowExplanatoryVideo] = useState(false);
  const explanatoryVideoRef = useRef<HTMLVideoElement>(null);
  const [score, setScore] = useState(9);
  const [validatedObjects, setValidatedObjects] = useState<Set<string>>(new Set());
  const [showScore, setShowScore] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [outroPlayed, setOutroPlayed] = useState(false);
  const [generiquePlayed, setGeneriquePlayed] = useState(false);
  const [mainMusicPosition, setMainMusicPosition] = useState(0);

  // Fonction pour obtenir l'URL optimisée avec transformations Cloudinary
  const getOptimizedVideoUrl = (videoId: string) => {
    // URL simple sans transformations pour tester
    // Si cela fonctionne, on pourra réajouter les transformations
    const version = "v3"; // Changez ceci quand vous uploadez de nouvelles vidéos
    return `https://res.cloudinary.com/dpqjlqwcq/video/upload/${videoId}?v=${version}`;
  };

  // Fonction pour tester si une vidéo explicative existe
  const testExplanatoryVideo = (videoId: string) => {
    const testVideo = document.createElement('video');
    testVideo.src = getOptimizedVideoUrl(videoId);
    testVideo.load();
  };

  // Fonction pour masquer manuellement la vidéo explicative
  const hideExplanatoryVideo = () => {
    setShowExplanatoryVideo(false);
    setExplanatoryVideo(null);
    if (explanatoryVideoRef.current) {
      explanatoryVideoRef.current.pause();
      explanatoryVideoRef.current.currentTime = 0;
    }
  };


  // Fonction pour lancer la séquence de fin
  const launchEndSequence = () => {
    setCurrentVideo("outro");
    setVideoType("outro");
    
    // Arrêter la musique principale pendant la séquence de fin
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Remettre à zéro pour éviter les conflits
    }
    
    if (videoRef.current) {
      videoRef.current.src = getOptimizedVideoUrl("outro");
      videoRef.current.volume = 1.0; // Volume maximum pour la vidéo finale
      videoRef.current.muted = false; // S'assurer que le son n'est pas coupé
      videoRef.current.load();
      videoRef.current.onloadeddata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              // Masquer le score quelques secondes après le démarrage de l'outro
              setTimeout(() => {
                setShowScore(false);
              }, 3000); // 3 secondes après le démarrage
              
              // Après 6 secondes, lancer outro_song en parallèle
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.src = getOptimizedVideoUrl("outro_song");
                  audioRef.current.volume = videoVolume;
                  audioRef.current.loop = false; // Ne pas boucler la musique outro
                  audioRef.current.play();
                }
              }, 6000); // 6 secondes après le démarrage de outro
            })
            .catch((error) => {
              if (error.name === 'AbortError') {
                return;
              }
            });
        }
      };
    }
    setOutroPlayed(true);
    setVideoEnded(false);
  };

  // Fonction pour incrémenter le score
  const incrementScore = (objectType: string) => {
    if (!validatedObjects.has(objectType)) {
      setValidatedObjects(prev => new Set([...prev, objectType]));
      setScore(prev => {
        const newScore = prev + 1;
        
        // Vérifier si le jeu est terminé
        if (newScore === 10) {
          setGameCompleted(true);
          
          // Déclencher immédiatement la séquence de fin
          setTimeout(() => {
            launchEndSequence();
          }, 1000); // 1 seconde de délai pour laisser le temps à l'interface de se mettre à jour
        }
        
        return newScore;
      });
    }
  };

  // Timecodes d'arrêt pour chaque vidéo
  const videoEndTimes = {
    "introduction": 58,
    "POV_1": 25,
    "POV_2": 25,
    "POV_3": 25,
    "objet_velo": 13,
    "objet_boxe": 29,
    "objet_foot": 31,
    "objet_mapmonde": 31,
    "objet_sablier": 28,
    "objet_plante": 31,
    "objet_cd": 21,
    "objet_chien": 13,
    "objet_jeuxvideo": 17,
    "objet_photo": 33,
    "outro": 30, // Durée estimée pour outro
    "generique": 60 // Durée estimée pour générique
  } as const;

  // Liste des objets qui ont une musique associée
  const objectsWithMusic = ["boxe", "foot", "chien", "jeuxvideo"];

  // Timings pour les vidéos explicatives (en secondes)
  const explanatoryVideoTimings = {
    "velo": 6,      
    "boxe": 18,      
    "foot": 17,      
    "mapmonde": 22, 
    "sablier": 12,   
    "plante": 14,    
    "cd": 8,        
    "chien": 6,     
    "jeuxvideo": 6, 
    "photo": 16,     
  } as const;

  // Fonction pour créer un fondu audio
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
      transitionVideo = direction === "left" ? "1_vers_3" : "1_vers_2";
      nextVideo = direction === "left" ? "POV_3" : "POV_2";
    } else if (currentVideo === "POV_2") {
      transitionVideo = direction === "left" ? "2_vers_1" : "2_vers_3";
      nextVideo = direction === "left" ? "POV_1" : "POV_3";
    } else if (currentVideo === "POV_3") {
      transitionVideo = direction === "left" ? "3_vers_2" : "3_vers_1";
      nextVideo = direction === "left" ? "POV_2" : "POV_1";
    }

    // Stocker la vidéo POV suivante
    setNextPOV(nextVideo as "POV_1" | "POV_2" | "POV_3");

    // Changer la vidéo visible et la lancer
    if (videoRef.current) {
      videoRef.current.src = getOptimizedVideoUrl(transitionVideo);
      videoRef.current.volume = 0;
      videoRef.current.load();
      
      // Attendre que la vidéo soit chargée puis la lancer
      videoRef.current.onloadeddata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
            })
            .catch((error) => {
              if (error.name === 'AbortError') {
                return;
              }
            });
        }
      };
    }
    setVideoEnded(false);
    setIsPlaying(true);
    setVideoType("transition");
  };

  // Gestionnaire pour les clics sur les zones interactives
  const handleZoneClick = (zoneId: string) => {
    const objetVideo = `${zoneId}` as typeof currentVideo;
    setCurrentVideo(objetVideo);
    setVideoType("objet");
    
    // Préparer la vidéo explicative
    const explanatoryVideoId = `text_${zoneId}`;
    setExplanatoryVideo(explanatoryVideoId);
    setShowExplanatoryVideo(false);

    if (videoRef.current) {
      videoRef.current.src = getOptimizedVideoUrl(objetVideo);
      videoRef.current.volume = 0;
      videoRef.current.load();
      
      // Attendre que la vidéo soit chargée puis la lancer
      videoRef.current.onloadeddata = () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
            })
            .catch((error) => {
              if (error.name === 'AbortError') {
                return;
              }
            });
        }
      };
    }

    // Gérer la musique
    if (audioRef.current) {
      const objetType = zoneId;
      if (objectsWithMusic.includes(objetType)) {
        // Sauvegarder la position actuelle de la musique principale
        setMainMusicPosition(audioRef.current.currentTime);
        
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
    setIsPlaying(true);
  };

  // Gestionnaire pour vérifier le temps de la vidéo
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // À 39 secondes de la vidéo d'introduction : lancer la musique (5 secondes plus tôt)
      if (currentVideo === "introduction" && videoRef.current.currentTime >= 40 && audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
          audioRef.current.volume = videoVolume;
        }
      }
      
      // À 44 secondes de la vidéo d'introduction : afficher le score
      if (currentVideo === "introduction" && videoRef.current.currentTime >= 44) {
        if (!showScore) {
          setShowScore(true);
        }
      }
      
      // À 1:10 (70 secondes) de la vidéo d'introduction : lancer automatiquement lit_vers_1
      if (currentVideo === "introduction" && videoRef.current.currentTime >= 68) {
        setVideoType("lit");
        setCurrentVideo("lit_vers_1" as any);
        if (videoRef.current) {
          videoRef.current.src = getOptimizedVideoUrl("lit_vers_1");
          videoRef.current.volume = 0; // Pas de son pour les vidéos lit
          videoRef.current.load();
        }
        setVideoEnded(false);
      }
      
      // Si c'est la vidéo d'introduction, on vérifie le timecode d'arrêt
      if (currentVideo === "introduction" && videoRef.current.currentTime >= videoEndTimes.introduction) {
        // Ne plus faire d'arrêt sur image - laisser la vidéo se terminer naturellement
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
        // Passer automatiquement à POV_1
        setCurrentVideo("POV_1");
        setVideoType("POV");
        if (videoRef.current) {
          videoRef.current.src = getOptimizedVideoUrl("POV_1");
          videoRef.current.volume = 0; // Pas de son pour les vidéos POV
          videoRef.current.load();
        }
        setVideoEnded(false);
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
      // Séquence de fin de jeu
      else if (gameCompleted && videoRef.current) {
        // Générique après OUTRO
        if (outroPlayed && !generiquePlayed && videoRef.current.ended) {
          setCurrentVideo("generique");
          setVideoType("generique");
          
          // Continuer outro_song pendant le générique (ne pas l'arrêter)
          // La musique outro_song continue automatiquement
          
           if (videoRef.current) {
             videoRef.current.src = getOptimizedVideoUrl("generique");
             videoRef.current.volume = 0; // Pas de son pour le générique
             videoRef.current.muted = true; // Son coupé pour le générique
             videoRef.current.load();
             videoRef.current.onloadeddata = () => {
               if (videoRef.current) {
                 
                 videoRef.current.play()
                   .then(() => {
                   })
                   .catch((error) => {
                     if (error.name === 'AbortError') {
                       return;
                     }
                   });
               }
             };
           }
          setGeneriquePlayed(true);
          setVideoEnded(false);
        }
        // Rechargement de la page après générique
        else if (outroPlayed && generiquePlayed && videoRef.current.ended) {
          
          // Arrêter outro_song avant de recharger
          if (audioRef.current) {
            audioRef.current.pause();
          }
          
          // Attendre 2 secondes puis recharger la page
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
      // Si c'est une vidéo objet, on vérifie les timings pour les vidéos explicatives
      else if (videoType === "objet" && videoRef.current) {
        const objetType = currentVideo.replace("objet_", "");
        const timing = explanatoryVideoTimings[objetType as keyof typeof explanatoryVideoTimings];
        
        // Déclencher la vidéo explicative au bon timing
        if (timing && videoRef.current.currentTime >= timing && !showExplanatoryVideo && explanatoryVideo) {
          
          // Tester d'abord si la vidéo explicative existe
          testExplanatoryVideo(explanatoryVideo);
          
          setShowExplanatoryVideo(true);
          
          // Vérifier que la vidéo objet continue de jouer
          
          // Charger la vidéo explicative (le démarrage se fera automatiquement via onCanPlay)
          if (explanatoryVideoRef.current) {
            explanatoryVideoRef.current.src = getOptimizedVideoUrl(explanatoryVideo);
            explanatoryVideoRef.current.load();
          }
        }
        
        // Vérifier si la vidéo objet est terminée
        if (videoRef.current.ended) {
          // On ne fait rien, on attend le clic sur le bouton retour
          videoRef.current.pause();
          setVideoEnded(true);
        }
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

    // Démarrer la vidéo et l'audio
    if (videoRef.current && audioRef.current) {
      const videoUrl = getOptimizedVideoUrl(currentVideo);
      
      // S'assurer que la source est bien définie
      if (videoRef.current.src !== videoUrl) {
        videoRef.current.src = videoUrl;
      }
      
      videoRef.current.play()
        .then(() => {
        })
        .catch((error) => {
          // Ignorer les erreurs AbortError (conflits de chargement)
          if (error.name === 'AbortError') {
            return;
          }
        });
      
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

  // Effet typewriting pour "Chargement..."
  useEffect(() => {
    const text = "Chargement...";
    let currentIndex = 0;
    
    // Test de l'URL de la vidéo d'introduction
    const introUrl = getOptimizedVideoUrl("introduction");
    
    const typeInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setLoadingText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsLoadingComplete(true);
        // Ne plus démarrer automatiquement - attendre l'interaction utilisateur
      }
    }, 400); // Vitesse du typewriting plus lente (400ms par caractère)

    return () => clearInterval(typeInterval);
  }, []); // Se lance une seule fois au montage du composant



  // Gestionnaire pour démarrer la vidéo une fois chargée
  const handleVideoLoaded = () => {
    
    // Auto-démarrer les vidéos lit après chargement
    if (videoType === "lit" && videoRef.current) {
      videoRef.current.play()
        .then(() => {
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            return;
          }
        });
    }
    
    // Auto-démarrer les vidéos POV après chargement
    if (videoType === "POV" && videoRef.current) {
      videoRef.current.play()
        .then(() => {
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            return;
          }
        });
    }
    
    // Auto-démarrer les vidéos de transition après chargement
    if (videoType === "transition" && videoRef.current) {
      videoRef.current.play()
        .then(() => {
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            return;
          }
        });
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
    setVideoType("introduction");
    setCurrentVideo("introduction");

    // Reprendre la musique principale si elle était en pause
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.currentTime = mainMusicPosition;
      audioRef.current.play();
      audioRef.current.volume = videoVolume;
    }

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
    const objetType = currentVideo.replace("objet_", "");
    
    // POV_1 pour velo, boxe et foot
    if (["velo", "boxe", "foot"].includes(objetType)) {
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
    

    // Nettoyer les vidéos explicatives
    setExplanatoryVideo(null);
    setShowExplanatoryVideo(false);
    if (explanatoryVideoRef.current) {
      explanatoryVideoRef.current.pause();
      explanatoryVideoRef.current.currentTime = 0;
    }

    setCurrentVideo(povVideo);
    setVideoType("POV");
    
    // Reprendre la musique principale avec un fondu à la position sauvegardée
    if (audioRef.current) {
      setIsFading(true);
      fadeAudio(audioRef.current, 0, 500); // Fade out sur 500ms

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = getOptimizedVideoUrl("main_song");
          audioRef.current.volume = 0;
          
          // Reprendre à la position sauvegardée
          audioRef.current.currentTime = mainMusicPosition;
          
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
      } else if (currentVideo === "outro") {
        // Pour la vidéo outro, garder le son de la vidéo et arrêter la musique
        videoRef.current.volume = 1.0;
        videoRef.current.muted = false;
        audioRef.current.pause();
      } else if (currentVideo === "generique") {
        // Pour le générique, couper le son de la vidéo (seule outro_song doit jouer)
        videoRef.current.volume = 0;
        videoRef.current.muted = true;
        // NE PAS arrêter audioRef car outro_song doit continuer pendant le générique
        // S'assurer que outro_song continue à jouer
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play();
        }
      } else {
        videoRef.current.volume = 0;
        audioRef.current.volume = videoVolume;
      }
    }
  }, [videoVolume, currentVideo]);

  // Surveiller la création de la vidéo explicative
  useEffect(() => {
    if (showExplanatoryVideo && explanatoryVideo && explanatoryVideoRef.current) {
    }
  }, [showExplanatoryVideo, explanatoryVideo]);

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
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={handleVideoLoaded}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
        {/* Audio pour la musique de fond */}
        <audio
          ref={audioRef}
          src={getOptimizedVideoUrl("main_song")}
          loop
          preload="auto"
        />
        
        {/* Vidéo explicative superposée */}
        {showExplanatoryVideo && explanatoryVideo && (
          <video
            ref={explanatoryVideoRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src={getOptimizedVideoUrl(explanatoryVideo)}
            playsInline
            preload="auto"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 15, // Plus élevé que la vidéo principale (zIndex: 0)
              opacity: 1,
              transition: 'opacity 0.5s ease-in-out',
              // Mode de fusion pour rendre le noir transparent
              mixBlendMode: 'screen', // Essaie ceci d'abord
              // Ou utilisez 'screen' pour éclaircir
              // Ou 'overlay' pour un effet différent
            }}
            onLoadStart={() => {
            }}
            onLoadedMetadata={() => {
            }}
            onCanPlay={() => {
              
              // Démarrer automatiquement la vidéo explicative
              if (explanatoryVideoRef.current) {
                explanatoryVideoRef.current.play()
                  .then(() => {
                  })
                  .catch((error) => {
                    if (error.name === 'AbortError') {
                      return;
                    }
                  });
              }
            }}
            onError={(e) => {
            }}
            onEnded={() => {
              // Ne pas masquer la vidéo, la laisser sur la dernière image
              // setShowExplanatoryVideo(false);
              // setExplanatoryVideo(null);
            }}
          />
        )}
        

      
            {/* Affichage du score */}
            {showScore && (
              <div className="absolute top-8 right-8 text-right z-20">
                <div className="text-pink-500 text-2xl font-bold dogica-pink">
                  Score
                </div>
                <div className="text-white text-lg dogica-white">
                  {score} / 10
                </div>
              
              </div>
            )}
      </div>

      {/* Contenu interactif au premier plan */}
      <div className="relative w-full min-h-screen" style={{ zIndex: 10 }}>
        {!isPlaying && currentVideo === "introduction" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              {!isLoadingComplete ? (
                <div className="dogica-white text-2xl">
                  {loadingText}
                  <span className="animate-pulse">|</span>
                </div>
              ) : (
                <button
                  onClick={handlePlay}
                  className="dogica-white text-2xl bg-transparent border-2 border-white px-8 py-4 rounded-lg hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105"
                >
                  Commencer
                </button>
              )}
            </div>
          </div>
        ) : (
          <>


            {/* Flèches de navigation pour les vidéos POV */}
            {videoType === "POV" && currentVideo !== "introduction" && (
              <>
                {/* POV_1 : Flèche droite vers POV_2 */}
                {currentVideo === "POV_1" && (
                  <button
                    onClick={() => handleTransition("right")}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center"
                  >
                    <img 
                      src="/icons/fleche-right.svg" 
                      alt="Vers POV_2" 
                      className="w-12 h-12 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                    />
                  </button>
                )}

                {/* POV_2 : Flèche gauche vers POV_1 et flèche droite vers POV_3 */}
                {currentVideo === "POV_2" && (
                  <>
                    {/* Flèche gauche vers POV_1 */}
                    <button
                      onClick={() => handleTransition("left")}
                      className="absolute left-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center"
                    >
                      <img 
                        src="/icons/fleche-left.svg" 
                        alt="Vers POV_1" 
                        className="w-12 h-12 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                      />
                    </button>
                    
                    {/* Flèche droite vers POV_3 */}
                    <button
                      onClick={() => handleTransition("right")}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center"
                    >
                      <img 
                        src="/icons/fleche-right.svg" 
                        alt="Vers POV_3" 
                        className="w-12 h-12 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                      />
                    </button>
                  </>
                )}

                {/* POV_3 : Flèche gauche vers POV_2 */}
                {currentVideo === "POV_3" && (
                  <button
                    onClick={() => handleTransition("left")}
                    className="absolute left-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center"
                  >
                    <img 
                      src="/icons/fleche-left.svg" 
                      alt="Vers POV_2" 
                      className="w-12 h-12 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                    />
                  </button>
                )}
              </>
            )}

            {/* Ajouter les zones interactives pour les vidéos POV */}
            {videoType === "POV" && (
              <InteractiveZones
                currentVideo={currentVideo}
                onZoneClick={handleZoneClick}
              />
            )}

            {/* Flèche de retour - visible uniquement à la fin des vidéos d'objets */}
            {videoType === "objet" && videoEnded && (
              <button
                onClick={() => {
                  
                  // Incrémenter le score pour cet objet
                  const objectType = currentVideo.replace("objet_", "");
                  incrementScore(objectType);
                  
                  // Masquer d'abord la vidéo explicative si elle est visible
                  if (showExplanatoryVideo) {
                    hideExplanatoryVideo();
                  }
                  
                  // Si le jeu est terminé, ne pas retourner au POV
                  if (gameCompleted) {
                    return;
                  }
                  
                  handleReturnToPOV();
                }}
                className="absolute bottom-8 right-8 p-8 transition-all hover:scale-105 flex items-center justify-center"
              >
                <img 
                  src="/icons/fleche-right.svg" 
                  alt="Retour au POV" 
                  className="w-20 h-20 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
} 