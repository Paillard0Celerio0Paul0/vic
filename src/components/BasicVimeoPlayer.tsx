'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const ReactPlayer = dynamic(() => import('react-player'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p>Chargement du lecteur...</p>
      </div>
    </div>
  )
});

interface BasicVimeoPlayerProps {
  videoId: string;
  playing?: boolean;
  volume?: number;
  onTimeUpdate?: (time: number) => void;
  onLoadedData?: () => void;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const BasicVimeoPlayer: React.FC<BasicVimeoPlayerProps> = ({
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
    console.log('BasicVimeoPlayer: Ready for video', videoId);
    setIsReady(true);
    if (onLoadedData) {
      onLoadedData();
    }
  };

  const handleError = (error: any) => {
    console.error('BasicVimeoPlayer: Error for video', videoId, error);
    setError('Erreur de chargement de la vidéo');
  };

  const handleProgress = (state: any) => {
    if (onTimeUpdate) {
      onTimeUpdate(state.playedSeconds);
    }
  };

  const handleEnded = () => {
    console.log('BasicVimeoPlayer: Ended for video', videoId);
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
          <p className="text-sm text-gray-400">URL: {vimeoUrl}</p>
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

export default BasicVimeoPlayer;
