'use client';

import { useEffect, useRef } from 'react';
import { getOptimizedVideoUrl, getOptimizedVideoUrlWithRange, getOptimizedVideoUrlNoRange, getBlobUrl } from '../utils/blobUrls';

interface VideoPreloaderProps {
  currentVideo: string;
  videoType: string;
}

const VideoPreloader = ({ currentVideo, videoType }: VideoPreloaderProps) => {
  const preloadedVideos = useRef<Set<string>>(new Set());

  // Fonction pour obtenir l'URL optimisée avec transformations Cloudinary
  // Fonction pour précharger une vidéo
  const preloadVideo = (videoId: string) => {
    if (preloadedVideos.current.has(videoId)) {
      return; // Déjà préchargée
    }

    const video = document.createElement('video');
    video.preload = 'metadata'; // Précharge les métadonnées et le début de la vidéo
    video.src = getOptimizedVideoUrlNoRange(videoId);
    video.style.display = 'none';
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    
    // Ajouter des gestionnaires d'événements pour le débogage
    
    video.addEventListener('loadedmetadata', () => {
      preloadedVideos.current.add(videoId);
    });
    
    video.addEventListener('error', (e) => {

    });

    document.body.appendChild(video);
  };

  // Fonction pour précharger un ensemble de vidéos
  const preloadVideoSet = (videoIds: string[]) => {
    videoIds.forEach(videoId => {
      preloadVideo(videoId);
    });
  };

  // Logique de préchargement intelligent basée sur l'état actuel
  const preloadBasedOnCurrentState = () => {
    // Vidéos critiques - toujours préchargées
    const criticalVideos = ['introduction', 'POV_1', 'POV_2', 'POV_3'];
    
    // Vidéos de transition
    const transitionVideos = ['1_vers_2', '1_vers_3', '2_vers_1', '2_vers_3', '3_vers_2'];
    
    // Vidéos d'objets
    const objectVideos = [
      'objet_velo', 'objet_boxe', 'objet_foot', 'objet_mapmonde', 
      'objet_sablier', 'objet_plante', 'objet_cd', 'objet_chien', 
      'objet_jeuxvideo', 'objet_photo'
    ];

    // Vidéos de fin de jeu
    const endGameVideos = ['outro', 'generique'];

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

    // Précharger les vidéos de fin de jeu après 5 secondes
    setTimeout(() => {
      preloadVideoSet(endGameVideos);
    }, 5000);

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
      
      // Précharger les musiques des objets de ce POV en priorité
      setTimeout(() => {
        const objectsWithMusic = ['boxe', 'foot', 'chien', 'jeuxvideo'];
        objectsWithMusic.forEach(objectType => {
          const audio = document.createElement('audio');
          audio.preload = 'auto';
          audio.src = getOptimizedVideoUrlNoRange(`${objectType}_song`);
          audio.style.display = 'none';
          audio.style.position = 'absolute';
          audio.style.left = '-9999px';


          document.body.appendChild(audio);
        });
      }, 200);
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

  // Préchargement de la musique principale
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.preload = 'auto'; // Précharger complètement pour un démarrage instantané
    audio.src = getOptimizedVideoUrl('main_song');
    audio.style.display = 'none';
    audio.style.position = 'absolute';
    audio.style.left = '-9999px';
    document.body.appendChild(audio);
  }, []);

  // Préchargement des musiques d'objets
  useEffect(() => {
    const objectsWithMusic = ['boxe', 'foot', 'chien', 'jeuxvideo'];
    
    // Précharger les musiques d'objets plus tôt pour un démarrage plus rapide
    setTimeout(() => {
      objectsWithMusic.forEach(objectType => {
        const audio = document.createElement('audio');
        audio.preload = 'auto'; // Précharger complètement au lieu de juste les métadonnées
        audio.src = getOptimizedVideoUrlNoRange(`${objectType}_song`);
        audio.style.display = 'none';
        audio.style.position = 'absolute';
        audio.style.left = '-9999px';
      

        document.body.appendChild(audio);
      });
    }, 1000); // Réduit de 2000ms à 1000ms pour un préchargement plus rapide
  }, []);

  return null; // Ce composant ne rend rien visuellement
};

export default VideoPreloader;
