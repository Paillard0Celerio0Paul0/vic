'use client';

import React, { useState, useEffect } from 'react';

interface VimeoPlayerProps {
  videoId: string;
  playing?: boolean;
  volume?: number;
  muted?: boolean;
  onTimeUpdate?: (time: number) => void;
  onLoadedData?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
  style?: React.CSSProperties;
  currentVideo?: string;
}

const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  videoId,
  playing = false,
  volume = 1,
  muted = false,
  onTimeUpdate,
  onLoadedData,
  onEnded,
  onError,
  className = '',
  style = {},
  currentVideo = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  useEffect(() => {
    // Test de l'URL Vimeo
    const testUrl = async () => {
      try {
        const response = await fetch(`https://player.vimeo.com/video/${videoId}`, {
          mode: 'no-cors'
        });
        console.log('✅ URL Vimeo accessible:', videoId);
      } catch (err) {
        console.error('❌ URL Vimeo inaccessible:', videoId, err);
        setError('URL Vimeo inaccessible');
        if (onError) {
          onError('URL Vimeo inaccessible');
        }
      }
    };

    testUrl();
  }, [videoId, onError]);

  // Reset states when video changes
  useEffect(() => {
    setIsLoaded(false);
    setIsPlayerVisible(false);
  }, [videoId]);

  // Gérer la visibilité du player selon l'état de lecture
  useEffect(() => {
    if (playing && isLoaded) {
      // Délai pour permettre le fondu sans flash
      setTimeout(() => {
        setIsPlayerVisible(true);
      }, 200);
    } else if (!playing) {
      setIsPlayerVisible(false);
    }
  }, [playing, isLoaded]);

  const handleIframeLoad = () => {
    console.log('✅ Iframe Vimeo chargé:', videoId);
    setIsLoaded(true);
    
    if (onLoadedData) {
      onLoadedData();
    }
  };

  const handleIframeError = () => {
    console.error('❌ Erreur de chargement iframe:', videoId);
    setError('Erreur de chargement iframe');
    if (onError) {
      onError('Erreur de chargement iframe');
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-red-900 text-white ${className}`} style={style}>
        <div className="text-center">
          <p className="text-lg mb-2">❌ {error}</p>
          <p className="text-sm">ID: {videoId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?autoplay=${playing ? 1 : 0}&muted=${muted ? 1 : 0}&controls=0&loop=0&playsinline=1&background=${playing ? 0 : 1}&dnt=1&transparent=0`}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isPlayerVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          visibility: isPlayerVisible ? 'visible' : 'hidden',
          transform: isPlayerVisible ? 'scale(1)' : 'scale(0.95)',
        }}
      />
    </div>
  );
};

export default VimeoPlayer;
