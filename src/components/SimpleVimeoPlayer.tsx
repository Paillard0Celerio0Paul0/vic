'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const ReactPlayer = dynamic(() => import('react-player'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
      <p>Chargement du lecteur...</p>
    </div>
  </div>
});

interface SimpleVimeoPlayerProps {
  videoId: string;
  playing?: boolean;
  volume?: number;
  onTimeUpdate?: (time: number) => void;
  onLoadedData?: () => void;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SimpleVimeoPlayer: React.FC<SimpleVimeoPlayerProps> = ({
  videoId,
  playing = false,
  volume = 1,
  onTimeUpdate,
  onLoadedData,
  onEnded,
  className = '',
  style = {},
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vimeoUrl = `https://vimeo.com/${videoId}`;

  const handleReady = () => {
    console.log('SimpleVimeoPlayer: Ready');
    setIsReady(true);
    if (onLoadedData) {
      onLoadedData();
    }
  };

  const handleError = (error: any) => {
    console.error('SimpleVimeoPlayer: Error', error);
    setError('Erreur de chargement');
  };

  const handleProgress = (state: any) => {
    if (onTimeUpdate) {
      onTimeUpdate(state.playedSeconds);
    }
  };

  const handleEnded = () => {
    console.log('SimpleVimeoPlayer: Ended');
    if (onEnded) {
      onEnded();
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 text-white ${className}`} style={style}>
        <div className="text-center">
          <p className="text-lg mb-2">❌ {error}</p>
          <p className="text-sm text-gray-400">ID: {videoId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ReactPlayer
        url={vimeoUrl}
        playing={playing}
        volume={volume}
        width="100%"
        height="100%"
        onReady={handleReady}
        onError={handleError}
        onProgress={handleProgress}
        onEnded={handleEnded}
        config={{
          vimeo: {
            playerOptions: {
              responsive: true,
              autopause: false,
              autoplay: false,
              controls: false,
              loop: false,
              muted: false,
              volume: volume,
              playsinline: true,
            }
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

export default SimpleVimeoPlayer;
