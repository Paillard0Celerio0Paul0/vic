'use client';

import { useState, useEffect } from 'react';

interface VideoStartOverlayProps {
  isPlaying: boolean;
  hasUserInteracted: boolean;
  isVideoLoaded: boolean;
  onStartVideo: () => void;
}

const VideoStartOverlay = ({ isPlaying, hasUserInteracted, isVideoLoaded, onStartVideo }: VideoStartOverlayProps) => {
  const [jouerText, setJouerText] = useState('');

  useEffect(() => {
    if (hasUserInteracted || isPlaying) {
      return;
    }

    // Bloquer toutes les interactions sur la page
    document.body.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';

    // Effet de machine à écrire pour "CHARGEMENT..."
    const text = "CHARGEMENT...";
    let index = 0;
    
    const typeWriter = setInterval(() => {
      if (index < text.length) {
        setJouerText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeWriter);
        
        // Lancer la vidéo automatiquement après 1.5 secondes une fois "CHARGEMENT..." écrit
        const timer = setTimeout(() => {
          console.log('🎬 Lancement automatique de la vidéo après 1.5 secondes');
          // Réactiver les interactions avant de lancer la vidéo
          document.body.style.pointerEvents = 'auto';
          document.body.style.userSelect = 'auto';
          onStartVideo();
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }, 500); // 500ms entre chaque lettre

    return () => {
      clearInterval(typeWriter);
      // Nettoyer les styles en cas de démontage du composant
      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';
    };
  }, [hasUserInteracted, isPlaying, onStartVideo]);

  if (hasUserInteracted || isPlaying) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-50 pointer-events-none">
      <div className="text-center relative z-10">
        {/* Affichage CHARGEMENT avec effet de machine à écrire */}
        <div className="relative">
          <h1 className="text-6xl font-dogica-pixel text-white">
            {jouerText}
            <span className="animate-pulse">|</span>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default VideoStartOverlay;