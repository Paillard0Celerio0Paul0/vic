'use client';

import { useState, useEffect, useRef } from 'react';
import InteractiveZones from '../components/InteractiveZones';
import VideoPreloader from '../components/VideoPreloader';
import { getOptimizedVideoUrl, getOptimizedVideoUrlWithRange, getOptimizedVideoUrlNoRange, getBlobUrl } from '../utils/blobUrls';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextVideoSrc, setNextVideoSrc] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [explanatoryVideo, setExplanatoryVideo] = useState<string | null>(null);
  const [showExplanatoryVideo, setShowExplanatoryVideo] = useState(false);
  const explanatoryVideoRef = useRef<HTMLVideoElement>(null);
  const [score, setScore] = useState(0);
  const [validatedObjects, setValidatedObjects] = useState<Set<string>>(new Set());
  const [showScore, setShowScore] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [outroPlayed, setOutroPlayed] = useState(false);
  const [generiquePlayed, setGeneriquePlayed] = useState(false);
  const [mainMusicPosition, setMainMusicPosition] = useState(0);
  const [introductionUrl] = useState("https://ntpqkpm4vpvltypf.public.blob.vercel-storage.com/introduction");
  const [showArrows, setShowArrows] = useState(false);

  // Détection iOS/Safari et gestion du déverrouillage audio
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // Détection iPad moderne (iPadOS 13+) qui se fait passer pour Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    // Détection via touch sur Mac (probablement iPad)
    (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document)
  );
  const isSafari = typeof navigator !== 'undefined' && (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
    // Détection explicite WebKit + Safari version
    (navigator.userAgent.includes('AppleWebKit') && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'))
  );
  
  // Log de détection au montage (optionnel en dev)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Détections navigateur:', { isIOS, isSafari, platform: navigator.platform });
    }
  }, []);
  
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [needAudioEnableUI, setNeedAudioEnableUI] = useState(false);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Fonction centralisée pour charger et jouer une vidéo
  const loadAndPlayVideo = async (videoId: string) => {
    if (!videoRef.current) return;
    
    try {
      let videoUrl: string;
      
      // Obtenir l'URL correcte selon le type de vidéo
      if (videoId === "introduction") {
        videoUrl = introductionUrl;
      } else if (videoId === "outro" || videoId === "generique") {
        videoUrl = getBlobUrl(videoId);
      } else {
        videoUrl = getOptimizedVideoUrlWithRange(videoId);
      }
      
      // Pour Safari/iOS, utiliser Blob URL avec bon Content-Type
      if (isSafari || isIOS) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const videoBlob = new Blob([blob], { type: 'video/mp4' });
        const blobUrl = URL.createObjectURL(videoBlob);
        
        videoRef.current.src = blobUrl;
        await videoRef.current.play();
      } else {
        // Pour les autres navigateurs
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        await playWithRetry(videoRef.current, { maxAttempts: 5, baseDelayMs: 300 });
      }
    } catch (error) {
      console.error("Erreur chargement vidéo:", error);
    }
  };

  const unlockAudioFromGesture = async () => {
    if (!audioRef.current) return;
    try {
      const previousMuted = audioRef.current.muted;
      const previousVolume = audioRef.current.volume;
      audioRef.current.muted = true;
      audioRef.current.volume = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.muted = previousMuted;
      audioRef.current.volume = previousVolume;
      setAudioUnlocked(true);
      setNeedAudioEnableUI(false);
    } catch (e) {
      setNeedAudioEnableUI(true);
    }
  };

  const playWithRetry = async (
    element: HTMLMediaElement,
    { maxAttempts = 4, baseDelayMs = 200 }: { maxAttempts?: number; baseDelayMs?: number } = {}
  ) => {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        await element.play();
        return;
      } catch (err: any) {
        const name = err?.name || '';
        const isGate = name === 'NotAllowedError';
        if (isGate && (isIOS || isSafari)) {
          setNeedAudioEnableUI(true);
        }
        try {
          element.load();
        } catch {}
        attempt += 1;
        await wait(baseDelayMs * Math.pow(2, attempt - 1));
      }
    }
    throw new Error('playWithRetry: echec');
  };

  // Fonction pour obtenir l'URL optimisée avec Vercel Blob

  // Fonction pour tester si une vidéo explicative existe
  const testExplanatoryVideo = (videoId: string) => {
    // Vérifier d'abord si le fichier existe dans Vercel Blob
    const blobUrl = getOptimizedVideoUrlNoRange(videoId);
    
    const testVideo = document.createElement('video');
    testVideo.src = blobUrl;
    testVideo.preload = 'metadata';
    
    
    testVideo.addEventListener('error', (e) => {
      console.error(`❌ Erreur chargement vidéo explicative ${videoId}:`, e);
    });
    
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
  const launchEndSequence = async () => {
    setCurrentVideo("outro");
    setVideoType("outro");
    
    // Arrêter la musique principale pendant la séquence de fin
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Remettre à zéro pour éviter les conflits
    }
    
    // Précharger la vidéo outro pour éviter les flashes
    setIsTransitioning(true);
    const outroUrl = getBlobUrl("outro");
    setNextVideoSrc(outroUrl);
    
    // Charger et lancer la vidéo outro
    if (videoRef.current) {
      videoRef.current.volume = 1.0;
      videoRef.current.muted = false;
      
      loadAndPlayVideo("outro").then(() => {
        // Masquer le score quelques secondes après le démarrage
        setTimeout(() => {
          setShowScore(false);
        }, 3000);
        
        // Après 6 secondes, lancer outro_song
        setTimeout(async () => {
          if (audioRef.current) {
            audioRef.current.src = getBlobUrl("outro_song");
            audioRef.current.volume = videoVolume;
            audioRef.current.loop = false;
            try {
              await playWithRetry(audioRef.current);
            } catch (error) {
              console.error("❌ Erreur lecture outro_song:", error);
            }
          }
        }, 6000);
      });
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

  // Fonction de préchargement optimisée pour mobile - DÉSACTIVÉE pour économiser les coûts
  const preloadVideoForMobile = (videoUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      // Préchargement désactivé - chargement direct
      resolve();
    });
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
      transitionVideo = direction === "left" ? "3_vers_2" : "3_vers_2";
      nextVideo = direction === "left" ? "POV_2" : "POV_1";
    }

    // Stocker la vidéo POV suivante
    setNextPOV(nextVideo as "POV_1" | "POV_2" | "POV_3");
    
    setVideoEnded(false);
    setIsPlaying(true);
    setVideoType("transition");
    
    // Charger et lancer la vidéo de transition
    if (videoRef.current) {
      videoRef.current.volume = 0;
      loadAndPlayVideo(transitionVideo);
    }
  };

  // Gestionnaire pour les clics sur les zones interactives
  const handleZoneClick = (zoneId: string) => {
    const objetVideo = `objet_${zoneId}` as typeof currentVideo;
    setCurrentVideo(objetVideo);
    setVideoType("objet");
    
    // Préparer la vidéo explicative
    const explanatoryVideoId = `text_${zoneId}`;
    setExplanatoryVideo(explanatoryVideoId);
    setShowExplanatoryVideo(false);
    
    // Forcer la réinitialisation de la vidéo explicative
    if (explanatoryVideoRef.current) {
      explanatoryVideoRef.current.pause();
      explanatoryVideoRef.current.currentTime = 0;
    }

    // Charger et lancer la vidéo objet
    if (videoRef.current) {
      videoRef.current.volume = 0;
      loadAndPlayVideo(objetVideo);
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
        setTimeout(async () => {
          if (audioRef.current) {
            audioRef.current.src = getBlobUrl(`${objetType}_song`);
            audioRef.current.volume = 0;
            audioRef.current.load();
            try {
              await playWithRetry(audioRef.current, { maxAttempts: 5, baseDelayMs: 300 });
              fadeAudio(audioRef.current, videoVolume, 500); // Fade in sur 500ms
              setIsFading(false);
            } catch (error) {
              console.error(`❌ Erreur lecture ${objetType}_song:`, error);
              setIsFading(false);
            }
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
          (async () => {
            try {
              if ((isIOS || isSafari) && !audioUnlocked) {
                await unlockAudioFromGesture();
              }
              // Charger et jouer main_song
              audioRef.current!.src = getBlobUrl("main_song");
              audioRef.current!.load();
              await playWithRetry(audioRef.current!, { maxAttempts: 5, baseDelayMs: 300 });
              audioRef.current!.volume = videoVolume;
              setNeedAudioEnableUI(false);
            } catch (error) {
              console.error("❌ Erreur lecture main_song:", error);
              setNeedAudioEnableUI(true);
            }
          })();
        }
      }
      
      // À 44 secondes de la vidéo d'introduction : afficher le score
      if (currentVideo === "introduction" && videoRef.current.currentTime >= 44) {
        if (!showScore) {
          setShowScore(true);
        }
      }
      
      // À 1:10 (70 secondes) de la vidéo d'introduction : lancer automatiquement lit_vers_1
      if (currentVideo === "introduction" && videoRef.current.currentTime >= 68 && videoType === "introduction") {
        setVideoType("lit");
        setCurrentVideo("lit_vers_1" as any);
        if (videoRef.current) {
          videoRef.current.volume = 0; // Pas de son pour les vidéos lit
          loadAndPlayVideo("lit_vers_1");
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
          videoRef.current.volume = 0; // Pas de son pour les vidéos POV
          loadAndPlayVideo("POV_1");
        }
        setVideoEnded(false);
      }
      // Si c'est une vidéo de transition (numero_vers_numero), on vérifie si elle est terminée
      else if (videoType === "transition" && videoRef.current.ended && nextPOV) {
        // Passer à la vidéo POV correspondante
        const povToPlay = nextPOV;
        setCurrentVideo(nextPOV);
        setNextPOV(null);
        setVideoType("POV");
        if (videoRef.current) {
          videoRef.current.volume = 0;
          loadAndPlayVideo(povToPlay);
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
          
          // Charger et lancer le générique
          if (videoRef.current) {
            videoRef.current.volume = 0;
            videoRef.current.muted = true;
            loadAndPlayVideo("generique");
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
        if (timing && videoRef.current.currentTime >= timing && explanatoryVideo) {
      
          
          if (!showExplanatoryVideo) {
            setShowExplanatoryVideo(true);
            
            // Charger la vidéo explicative (le démarrage se fera automatiquement via onCanPlay)
            if (explanatoryVideoRef.current) {
              // Ne pas modifier src ici, laisser le JSX gérer le changement
              explanatoryVideoRef.current.load();
            }
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
        videoRef.current.muted = false; // Important pour mobile
      } else {
        fadeAudio(audioRef.current, volume, 300); // Fade plus court pour le contrôle du volume
      }
    }
  };

  const handlePlay = async () => {
    setIsPlaying(true);
    setVideoEnded(false);

    if (audioRef.current && (isIOS || isSafari) && !audioUnlocked) {
      await unlockAudioFromGesture();
    }

    // Charger et démarrer la vidéo
    await loadAndPlayVideo(currentVideo);
    
    // Gérer l'audio
    if (videoRef.current && audioRef.current) {
      if (currentVideo === "introduction") {
        // Unmute pour la vidéo d'introduction
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = videoVolume;
          }
        }, 200);
        audioRef.current.pause();
      } else {
        videoRef.current.volume = 0;
        try {
          await playWithRetry(audioRef.current);
          audioRef.current.volume = videoVolume;
        } catch {
          setNeedAudioEnableUI(true);
        }
      }
    }
  };

  // Détection mobile et effet typewriting pour "Chargement..."
  useEffect(() => {
    // Détecter si on est sur mobile
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth <= 768 ||
                           ('ontouchstart' in window) ||
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || // iPad moderne
                           (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document); // iPad via touch
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const text = "Chargement...";
    let currentIndex = 0;
    
    // Test de l'URL de la vidéo d'introduction (éviter le log multiple)
    const introUrl = introductionUrl;
    
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

    return () => {
      clearInterval(typeInterval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []); // Se lance une seule fois au montage du composant



  // Gestionnaire pour démarrer la vidéo une fois chargée
  const handleVideoLoaded = async () => {
    // Les vidéos sont maintenant gérées par loadAndPlayVideo
    // Ce handler n'est plus utilisé pour l'auto-start
  };

  const handleReturn = async () => {
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
      try {
        await playWithRetry(audioRef.current, { maxAttempts: 5, baseDelayMs: 300 });
        audioRef.current.volume = videoVolume;
      } catch (error) {
        console.error("❌ Erreur reprise audio après retour:", error);
      }
    }

    // Enfin, on charge la vidéo d'introduction
    loadAndPlayVideo("introduction").then(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = videoEndTimes.introduction;
        videoRef.current.pause();
      }
    });
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
    setVideoEnded(false);
    setIsPlaying(true);
    
    // Charger et lancer la vidéo POV
    if (videoRef.current) {
      videoRef.current.volume = 0;
      loadAndPlayVideo(povVideo);
    }
    
    // Reprendre la musique principale avec un fondu à la position sauvegardée
    if (audioRef.current) {
      setIsFading(true);
      fadeAudio(audioRef.current, 0, 500);

      setTimeout(async () => {
        if (audioRef.current) {
          if (audioRef.current.src !== getBlobUrl("main_song")) {
            audioRef.current.src = getBlobUrl("main_song");
            audioRef.current.load();
          }
          audioRef.current.volume = 0;
          audioRef.current.currentTime = mainMusicPosition;
          
          try {
            await playWithRetry(audioRef.current, { maxAttempts: 5, baseDelayMs: 300 });
            fadeAudio(audioRef.current, videoVolume, 500);
            setIsFading(false);
          } catch (error) {
            console.error("❌ Erreur reprise main_song:", error);
            setIsFading(false);
          }
        }
      }, 500);
    }
  };

  // Gestionnaire pour la fin de la musique principale
  useEffect(() => {
    if (audioRef.current) {
      const handleAudioEnded = async () => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          try {
            await playWithRetry(audioRef.current, { maxAttempts: 5, baseDelayMs: 300 });
          } catch (error) {
            console.error("❌ Erreur reprise audio en boucle:", error);
          }
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
        videoRef.current.muted = false; // Important pour mobile
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
          playWithRetry(audioRef.current, { maxAttempts: 5, baseDelayMs: 300 })
            .catch(error => console.error("❌ Erreur reprise outro_song:", error));
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

  // Gérer l'apparition des flèches de navigation POV avec un délai de 3 secondes
  useEffect(() => {
    if (videoType === "POV" && currentVideo !== "introduction") {
      // Masquer les flèches immédiatement quand on change de POV
      setShowArrows(false);
      
      // Les afficher après 3 secondes
      const timer = setTimeout(() => {
        setShowArrows(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      // Si on n'est pas sur un POV, masquer les flèches
      setShowArrows(false);
    }
  }, [videoType, currentVideo]);

  // Relance prudente à la reprise de visibilité (utile iOS Safari)
  useEffect(() => {
    const onVisibility = async () => {
      if (!audioRef.current) return;
      if (document.visibilityState === 'visible') {
        if ((isIOS || isSafari) && audioUnlocked) {
          try {
            if (audioRef.current.paused) {
              await playWithRetry(audioRef.current, { maxAttempts: 2, baseDelayMs: 150 });
              audioRef.current.volume = videoVolume;
            }
          } catch {}
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onVisibility);
    };
  }, [audioUnlocked, videoVolume]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Préchargeur de vidéos - DÉSACTIVÉ pour économiser les coûts Vercel */}
      {/* <VideoPreloader currentVideo={currentVideo} videoType={videoType} /> */}
      
      {/* Vidéo en arrière-plan absolu */}
      <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
        {/* Overlay noir simple pendant les transitions */}
        {isTransitioning && (
          <div 
            className="absolute inset-0 bg-black" 
            style={{ 
              zIndex: 5,
              width: '100vw',
              height: '100vh',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }} 
          />
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none"
          playsInline
          webkit-playsinline="true"
          preload="none"
          muted={isMobile || isSafari || isIOS}
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={handleVideoLoaded}
          onError={(e) => console.error('❌ Erreur vidéo:', e)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: isMobile ? 'contain' : 'cover', // contain sur mobile pour éviter le rognage
            opacity: isPlaying && !isTransitioning ? 1 : 0,
            transition: isMobile ? 'opacity 1.2s ease-in-out' : 'opacity 0.8s ease-in-out',
            backgroundColor: isMobile ? 'black' : 'transparent', // Fond noir sur mobile pour objectFit contain
            // Propriétés spécifiques mobile
            ...(isMobile && {
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              perspective: '1000px'
            })
          }}
        />
        {/* Audio pour la musique de fond */}
        <audio
          ref={audioRef}
          src={getBlobUrl("main_song")}
          loop
          preload={isSafari ? "metadata" : "none"}
          crossOrigin={isSafari || isIOS ? undefined : "anonymous"}
        />
        
        {/* Vidéo explicative superposée */}
        {showExplanatoryVideo && explanatoryVideo && (() => {
          const videoUrl = getOptimizedVideoUrlNoRange(explanatoryVideo);
          return (
            <video
              ref={explanatoryVideoRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src={videoUrl}
              playsInline
              webkit-playsinline="true"
              preload="metadata"
              crossOrigin={isSafari || isIOS ? undefined : "anonymous"}
              muted={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: isMobile ? 'contain' : 'cover', // contain sur mobile pour éviter le rognage
              zIndex: 15, // Plus élevé que la vidéo principale (zIndex: 0)
              opacity: 1,
              transition: 'opacity 0.5s ease-in-out',
              backgroundColor: isMobile ? 'black' : 'transparent', // Fond noir sur mobile pour objectFit contain
              // Mode de fusion pour rendre le noir transparent
              mixBlendMode: 'screen', // Essaie ceci d'abord
              // Ou utilisez 'screen' pour éclaircir
              // Ou 'overlay' pour un effet différent
            }}
            onCanPlay={async () => {
              // Démarrer automatiquement la vidéo explicative
              if (explanatoryVideoRef.current) {
                try {
                  // Pour Safari, charger explicitement la vidéo avant de jouer
                  if (isSafari) {
                    explanatoryVideoRef.current.load();
                    // Attendre un peu que le load se fasse
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                  
                  // Utiliser playWithRetry pour Safari
                  await playWithRetry(explanatoryVideoRef.current, { maxAttempts: 5, baseDelayMs: 300 });
                } catch (error: any) {
                  console.error(`❌ Erreur lancement vidéo explicative ${explanatoryVideo}:`, error);
                  if (error?.name === 'AbortError') {
                    return;
                  }
                  
                  // Fallback pour Safari: essayer avec muted puis unmute
                  if (isSafari && explanatoryVideoRef.current) {
                    try {
                      explanatoryVideoRef.current.muted = true;
                      await explanatoryVideoRef.current.play();
                      explanatoryVideoRef.current.muted = false;
                    } catch {}
                  }
                }
              }
            }}
            onLoadedData={() => {
              // Pour Safari, essayer de lancer dès que les données sont chargées
              if (isSafari && explanatoryVideoRef.current && explanatoryVideoRef.current.paused) {
                playWithRetry(explanatoryVideoRef.current, { maxAttempts: 3, baseDelayMs: 200 })
                  .catch((error) => {
                    console.error(`❌ Erreur loadedData vidéo explicative ${explanatoryVideo}:`, error);
                  });
              }
            }}
            onError={(e) => {
              console.error(`❌ Erreur vidéo explicative ${explanatoryVideo}:`, e);
            }}
            onEnded={() => {
              // Ne pas masquer la vidéo, la laisser sur la dernière image
              // setShowExplanatoryVideo(false);
              // setExplanatoryVideo(null);
            }}
          />
          );
        })()}
      
            {/* Affichage du score */}
            {showScore && (
              <div 
                className="absolute text-center z-20 p-0.5 sm:p-3 md:p-4"
                style={{
                  top: isMobile ? '4px' : '64px',
                  right: isMobile ? '4px' : '32px'
                }}
              >
                <div className="text-xs sm:text-xl md:text-2xl font-bold dogica-pink">
                  Score
                </div>
                <div className="text-xs sm:text-base md:text-lg dogica-white">
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
            {videoType === "POV" && currentVideo !== "introduction" && showArrows && (
              <>
                {/* POV_1 : Flèche droite vers POV_2 */}
                {currentVideo === "POV_1" && (
                  <button
                    onClick={() => handleTransition("right")}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center opacity-0 animate-fadeIn"
                    style={{
                      animation: 'fadeIn 0.5s ease-in forwards'
                    }}
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
                      className="absolute left-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center opacity-0 animate-fadeIn"
                      style={{
                        animation: 'fadeIn 0.5s ease-in forwards'
                      }}
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
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center opacity-0 animate-fadeIn"
                      style={{
                        animation: 'fadeIn 0.5s ease-in forwards'
                      }}
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
                  <>
                    {/* Flèche gauche vers POV_2 */}
                    <button
                      onClick={() => handleTransition("left")}
                      className="absolute left-8 top-1/2 transform -translate-y-1/2 p-6 transition-all hover:scale-105 flex items-center justify-center opacity-0 animate-fadeIn"
                      style={{
                        animation: 'fadeIn 0.5s ease-in forwards'
                      }}
                    >
                      <img 
                        src="/icons/fleche-left.svg" 
                        alt="Vers POV_2" 
                        className="w-12 h-12 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                      />
                    </button>
                    
                  </>
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

            {/* Bouton fallback Activer le son pendant le jeu */}

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
                className="absolute bottom-8 sm:bottom-16 right-4 sm:right-8 p-4 sm:p-6 md:p-8 transition-all hover:scale-105 flex items-center justify-center"
              >
                <img 
                  src="/icons/fleche-right.svg" 
                  alt="Retour au POV" 
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 filter drop-shadow-lg hover:drop-shadow-xl transition-all" 
                />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
} 