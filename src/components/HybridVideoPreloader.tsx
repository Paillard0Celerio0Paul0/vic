'use client';

import { useEffect, useRef } from 'react';
import { getVideoConfig, getCloudinaryVideos, getVimeoVideos } from '../utils/videoRouter';

interface HybridVideoPreloaderProps {
  currentVideo: string;
  videoType: string;
}

const HybridVideoPreloader = ({ currentVideo, videoType }: HybridVideoPreloaderProps) => {
  const preloadedVideos = useRef<Set<string>>(new Set());

  // Fonction pour précharger une vidéo Cloudinary
  const preloadCloudinaryVideo = (videoId: string) => {
    if (preloadedVideos.current.has(videoId)) {
      return; // Déjà préchargée
    }

    const config = getVideoConfig(videoId);
    if (!config || config.platform !== 'cloudinary') return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/q_auto,f_auto,w_1920/${config.cloudinaryId}`;
    video.style.display = 'none';
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    
    video.addEventListener('loadstart', () => {
      console.log(`[Cloudinary] Début du préchargement: ${videoId}`);
    });
    
    video.addEventListener('loadedmetadata', () => {
      console.log(`[Cloudinary] Métadonnées chargées: ${videoId}`);
      preloadedVideos.current.add(videoId);
    });
    
    video.addEventListener('error', (e) => {
      console.error(`[Cloudinary] Erreur de préchargement pour ${videoId}:`, e);
    });

    document.body.appendChild(video);
  };

  // Fonction pour précharger une vidéo Vimeo
  const preloadVimeoVideo = (videoId: string) => {
    if (preloadedVideos.current.has(videoId)) {
      return; // Déjà préchargée
    }

    const config = getVideoConfig(videoId);
    if (!config || config.platform !== 'vimeo') return;

    // Pour Vimeo, on précharge les métadonnées via l'API
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${config.vimeoId}?autoplay=0&muted=1&controls=0&loop=0`;
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    
    iframe.addEventListener('load', () => {
      console.log(`[Vimeo] Préchargement démarré: ${videoId}`);
      preloadedVideos.current.add(videoId);
    });
    
    iframe.addEventListener('error', (e) => {
      console.error(`[Vimeo] Erreur de préchargement pour ${videoId}:`, e);
    });

    document.body.appendChild(iframe);
  };

  // Fonction pour précharger un ensemble de vidéos
  const preloadVideoSet = (videoIds: string[]) => {
    videoIds.forEach(videoId => {
      const config = getVideoConfig(videoId);
      if (!config) return;

      if (config.platform === 'cloudinary') {
        preloadCloudinaryVideo(videoId);
      } else if (config.platform === 'vimeo') {
        preloadVimeoVideo(videoId);
      }
    });
  };

  // Logique de préchargement intelligent basée sur l'état actuel
  const preloadBasedOnCurrentState = () => {
    // Vidéos critiques - toujours préchargées
    const criticalVideos = ['introduction', 'POV_1', 'POV_2', 'POV_3'];
    
    // Vidéos de transition
    const transitionVideos = ['1_vers_2', '1_vers_3', '2_vers_1', '2_vers_3', '3_vers_1', '3_vers_2'];
    
    // Vidéos d'objets
    const objectVideos = [
      'velo', 'objet_boxe', 'objet_foot', 'objet_mapmonde', 
      'objet_sablier', 'objet_plante', 'objet_cd', 'objet_chien', 
      'objet_jeuxvideo', 'objet_photo'
    ];

    // Précharger les vidéos critiques immédiatement
    preloadVideoSet(criticalVideos);

    // Précharger les vidéos de transition après 1 seconde
    setTimeout(() => {
      preloadVideoSet(transitionVideos);
    }, 1000);

    // Précharger les vidéos d'objets après 3 secondes
    setTimeout(() => {
      preloadVideoSet(objectVideos);
    }, 3000);

    // Préchargement contextuel basé sur la vidéo actuelle
    if (currentVideo === 'introduction') {
      // Si on est dans l'introduction, précharger les POV en priorité
      setTimeout(() => {
        preloadVideoSet(['POV_1', 'POV_2', 'POV_3']);
      }, 500);
    } else if (currentVideo.startsWith('POV_')) {
      // Si on est dans un POV, précharger les transitions possibles
      const povNumber = currentVideo.split('_')[1];
      const possibleTransitions = [
        `${povNumber}_vers_1`, 
        `${povNumber}_vers_2`, 
        `${povNumber}_vers_3`
      ].filter(transition => transition !== `${povNumber}_vers_${povNumber}`);
      
      setTimeout(() => {
        preloadVideoSet(possibleTransitions);
      }, 500);
    }
  };

  // Effet principal pour le préchargement
  useEffect(() => {
    // Préchargement initial
    preloadBasedOnCurrentState();
  }, []);

  // Préchargement contextuel quand la vidéo change
  useEffect(() => {
    preloadBasedOnCurrentState();
  }, [currentVideo, videoType]);

  // Préchargement de la musique principale (Cloudinary)
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = 'https://res.cloudinary.com/dpqjlqwcq/video/upload/q_auto,f_auto/main_song';
    audio.style.display = 'none';
    audio.style.position = 'absolute';
    audio.style.left = '-9999px';
    
    audio.addEventListener('loadedmetadata', () => {
      console.log('[Cloudinary] Musique principale préchargée');
    });

    document.body.appendChild(audio);
  }, []);

  // Préchargement des musiques d'objets (Cloudinary)
  useEffect(() => {
    const objectsWithMusic = ['boxe', 'foot', 'chien', 'jeuxvideo'];
    
    setTimeout(() => {
      objectsWithMusic.forEach(objectType => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = `https://res.cloudinary.com/dpqjlqwcq/video/upload/q_auto,f_auto/${objectType}_song`;
        audio.style.display = 'none';
        audio.style.position = 'absolute';
        audio.style.left = '-9999px';
        
        audio.addEventListener('loadedmetadata', () => {
          console.log(`[Cloudinary] Musique ${objectType} préchargée`);
        });

        document.body.appendChild(audio);
      });
    }, 2000);
  }, []);

  return null; // Ce composant ne rend rien visuellement
};

export default HybridVideoPreloader;

