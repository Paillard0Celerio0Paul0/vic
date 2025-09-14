'use client';

import { useEffect, useRef } from 'react';
import { getVideoConfig, getVimeoVideos } from '../utils/videoRouter';

interface VimeoPreloaderProps {
  currentVideo: string;
  videoType: string;
}

const VimeoPreloader = ({ currentVideo, videoType }: VimeoPreloaderProps) => {
  const preloadedVideos = useRef<Set<string>>(new Set());

  // Fonction pour précharger une vidéo Vimeo
  const preloadVimeoVideo = (videoId: string) => {
    if (preloadedVideos.current.has(videoId)) {
      return; // Déjà préchargée
    }

    const config = getVideoConfig(videoId);
    if (!config) return;

    // Pour Vimeo, on précharge les métadonnées via l'API
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${config.vimeoId}?autoplay=0&muted=1&controls=0&loop=0`;
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    
    iframe.addEventListener('load', () => {
      console.log(`[Vimeo] Préchargement démarré: ${videoId} (Compte: ${config.vimeoAccountId})`);
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
      preloadVimeoVideo(videoId);
    });
  };

  // Logique de préchargement intelligent basée sur l'état actuel
  const preloadBasedOnCurrentState = () => {
    // Vidéos critiques - toujours préchargées
    const criticalVideos = ['introduction', 'POV_1', 'POV_2', 'POV_3'];
    
    // Vidéos de transition
    const transitionVideos = ['lit_vers_1', 'lit_vers_2', 'lit_vers_3'];
    
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
      const possibleTransitions = [`lit_vers_${povNumber}`];
      
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

  return null; // Ce composant ne rend rien visuellement
};

export default VimeoPreloader;
