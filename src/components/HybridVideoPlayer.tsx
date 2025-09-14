'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface HybridVideoPlayerProps {
  videoId: string;
  videoType: 'cloudinary' | 'vimeo';
  className?: string;
  style?: React.CSSProperties;
  onTimeUpdate?: (time: number) => void;
  onLoadedData?: () => void;
  onEnded?: () => void;
  volume?: number;
  muted?: boolean;
  playsInline?: boolean;
}

const HybridVideoPlayer: React.FC<HybridVideoPlayerProps> = ({
  videoId,
  videoType,
  className,
  style,
  onTimeUpdate,
  onLoadedData,
  onEnded,
  volume = 1,
  muted = false,
  playsInline = true,
}) => {
  const playerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fonction pour obtenir l'URL optimisée Cloudinary
  const getCloudinaryUrl = (id: string) => {
    return `https://res.cloudinary.com/dpqjlqwcq/video/upload/q_auto,f_auto,w_1920/${id}`;
  };

  // Fonction pour obtenir l'URL Vimeo
  const getVimeoUrl = (id: string) => {
    return `https://vimeo.com/${id}`;
  };

  // Déterminer l'URL selon le type
  const getVideoUrl = () => {
    switch (videoType) {
      case 'cloudinary':
        return getCloudinaryUrl(videoId);
      case 'vimeo':
        return getVimeoUrl(videoId);
      default:
        return '';
    }
  };

  // Gestionnaire de changement de temps
  const handleProgress = (state: any) => {
    if (onTimeUpdate) {
      onTimeUpdate(state.playedSeconds);
    }
  };

  // Gestionnaire de chargement
  const handleReady = () => {
    setIsLoaded(true);
    if (onLoadedData) {
      onLoadedData();
    }
  };

  // Gestionnaire de fin de vidéo
  const handleEnded = () => {
    if (onEnded) {
      onEnded();
    }
  };

  // Configuration du lecteur
  const playerConfig = {
    url: getVideoUrl(),
    volume: volume,
    muted: muted,
    playing: false, // Contrôlé par le composant parent
    onProgress: handleProgress,
    onReady: handleReady,
    onEnded: handleEnded,
    config: {
      vimeo: {
        playerOptions: {
          responsive: true,
          autopause: false,
          autoplay: false,
          controls: false, // Contrôles personnalisés
          loop: false,
          muted: muted,
          volume: volume,
        }
      }
    }
  };

  // Mise à jour du volume
  useEffect(() => {
    if (playerRef.current && isLoaded) {
      const player = playerRef.current.getInternalPlayer();
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(volume);
      }
    }
  }, [volume, isLoaded]);

  // Mise à jour du mute
  useEffect(() => {
    if (playerRef.current && isLoaded) {
      const player = playerRef.current.getInternalPlayer();
      if (player && typeof player.setMuted === 'function') {
        player.setMuted(muted);
      }
    }
  }, [muted, isLoaded]);

  return (
    <div className={className} style={style}>
      <ReactPlayer
        ref={playerRef}
        {...playerConfig}
        width="100%"
        height="100%"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

export default HybridVideoPlayer;

