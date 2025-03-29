import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface InteractiveZonesProps {
  currentVideo: string;
  onZoneClick: (zoneId: string) => void;
}

// Définition des zones cliquables pour chaque vidéo POV (en pourcentages)
const zonesByVideo: Record<string, Zone[]> = {
  "POV_1": [
    { id: "velo", x: 33, y: 50, width: 42, height: 36, color: 'rgba(255, 0, 0, 0.3)' },
    { id: "boxe", x: 36, y: 18, width: 8, height: 25, color: 'rgba(0, 255, 0, 0.3)' },
    { id: "foot", x: 55, y: 86, width: 7, height: 13, color: 'rgba(0, 0, 255, 0.3)' },
  ],
  "POV_2": [
    { id: "cd", x: 47, y: 72, width: 9, height: 15, color: 'rgba(255, 0, 0, 0.3)' },
    { id: "mapmonde", x: 34, y: 25, width: 12, height:28, color: 'rgba(0, 255, 0, 0.3)' },
    { id: "sablier", x: 54, y: 55, width: 3, height: 13, color: 'rgba(0, 0, 255, 0.3)' },
    { id: "plante", x: 58, y: 59, width: 5, height: 14, color: 'rgba(255, 255, 0, 0.3)' },
  ],
  "POV_3": [
    { id: "chien", x: 26, y: 45, width: 19, height: 26, color: 'rgba(255, 0, 0, 0.3)' },
    { id: "photo", x: 66, y: 49, width: 11, height: 16, color: 'rgba(0, 255, 0, 0.3)' },
    { id: "jeuxvideo", x: 47, y: 47, width: 17, height: 21, color: 'rgba(0, 0, 255, 0.3)' },
  ],
};

const InteractiveZones: React.FC<InteractiveZonesProps> = ({ currentVideo, onZoneClick }) => {
  const zones = zonesByVideo[currentVideo] || [];
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Mise à jour initiale
    updateDimensions();

    // Écouteur d'événement pour le redimensionnement
    window.addEventListener('resize', updateDimensions);

    // Nettoyage
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {zones.map((zone) => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
            cursor: `url("${process.env.NEXT_PUBLIC_BASE_URL || ''}/cursor.png") 0 0, pointer`,
            pointerEvents: 'auto',
            opacity: 0.3,
            backgroundColor: zone.color || 'transparent',
            border: '2px solid white',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={() => onZoneClick(zone.id)}
        />
      ))}
    </div>
  );
};

export default InteractiveZones; 