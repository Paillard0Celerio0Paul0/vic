'use client';

import React, { useState, useEffect } from 'react';

interface DebugVimeoPlayerProps {
  videoId: string;
  playing?: boolean;
  onLoadedData?: () => void;
  onError?: (error: any) => void;
}

const DebugVimeoPlayer: React.FC<DebugVimeoPlayerProps> = ({
  videoId,
  playing = false,
  onLoadedData,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const vimeoUrl = `https://vimeo.com/${videoId}`;

  useEffect(() => {
    console.log('🔍 DebugVimeoPlayer: Initialisation pour', videoId);
    console.log('🔍 URL Vimeo:', vimeoUrl);
    console.log('🔍 Playing:', playing);
    
    // Reset states when video changes
    setIsLoaded(false);
    setPlayerReady(false);
    setIsPlayerVisible(false);
  }, [videoId]);

  // Gérer la visibilité du player selon l'état de lecture
  useEffect(() => {
    if (playing && isLoaded) {
      // Délai pour éviter le flash de la première image
      setTimeout(() => {
        setIsPlayerVisible(true);
      }, 100);
    } else if (!playing) {
      setIsPlayerVisible(false);
    }
  }, [playing, isLoaded]);

  useEffect(() => {
    // Test de l'URL Vimeo
    const testUrl = async () => {
      try {
        console.log('🔍 Test de l\'URL Vimeo...');
        const response = await fetch(`https://player.vimeo.com/video/${videoId}`, {
          mode: 'no-cors'
        });
        console.log('✅ URL Vimeo accessible');
      } catch (err) {
        console.error('❌ URL Vimeo inaccessible:', err);
        setError('URL Vimeo inaccessible');
      }
    };

    testUrl();
  }, [videoId]);

  const handleIframeLoad = () => {
    console.log('✅ Iframe Vimeo chargé');
    setIsLoaded(true);
    setPlayerReady(true);
    
    // Ne rendre le player visible que si on est en mode lecture
    if (playing) {
      setIsPlayerVisible(true);
    }
    
    if (onLoadedData) {
      onLoadedData();
    }
  };

  const handleIframeError = () => {
    console.error('❌ Erreur de chargement iframe');
    setError('Erreur de chargement iframe');
    if (onError) {
      onError('Erreur de chargement iframe');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-900 text-white">
        <div className="text-center">
          <p className="text-lg mb-2">❌ {error}</p>
          <p className="text-sm">ID: {videoId}</p>
          <p className="text-sm">URL: {vimeoUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Iframe Vimeo direct */}
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?autoplay=${playing ? 1 : 0}&muted=0&controls=0&loop=0&playsinline=1&background=0&dnt=1&transparent=0`}
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
          opacity: playing ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          visibility: playing ? 'visible' : 'hidden',
        }}
      />
      
      {/* Overlay de debug */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 text-xs rounded">
        <div>ID: {videoId}</div>
        <div>Playing: {playing ? 'Oui' : 'Non'}</div>
        <div>Loaded: {isLoaded ? 'Oui' : 'Non'}</div>
        <div>Ready: {playerReady ? 'Oui' : 'Non'}</div>
      </div>
    </div>
  );
};

export default DebugVimeoPlayer;
