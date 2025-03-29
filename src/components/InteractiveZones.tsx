import React from 'react';
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

// Définition des zones cliquables pour chaque vidéo POV
const zonesByVideo: Record<string, Zone[]> = {
  "POV_1": [
    { id: "velo", x: 630, y: 410, width: 800, height: 370, color: 'rgba(255, 0, 0, 0.3)' },
    { id: "boxe", x: 690, y: 160, width: 150, height: 240, color: 'rgba(0, 255, 0, 0.3)' },
    { id: "foot", x: 1050, y: 790, width: 140, height: 120, color: 'rgba(0, 0, 255, 0.3)' },
  ],
  "POV_2": [
    { id: "cd", x: 150, y: 150, width: 100, height: 100 },
    { id: "mapmonde", x: 300, y: 200, width: 200, height: 150 },
    { id: "sablier", x: 550, y: 300, width: 80, height: 120 },
    { id: "plante", x: 200, y: 400, width: 120, height: 150 },
  ],
  "POV_3": [
    { id: "chien", x: 200, y: 100, width: 150, height: 150 },
    { id: "photo", x: 400, y: 200, width: 120, height: 100 },
    { id: "jeuxvideo", x: 150, y: 400, width: 200, height: 150 },
  ],
};

const InteractiveZones: React.FC<InteractiveZonesProps> = ({ currentVideo, onZoneClick }) => {
  const zones = zonesByVideo[currentVideo] || [];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {zones.map((zone) => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            left: zone.x,
            top: zone.y,
            width: zone.width,
            height: zone.height,
            cursor: `url("${process.env.NEXT_PUBLIC_BASE_URL || ''}/cursor.png") 0 0, pointer`,
            pointerEvents: 'auto',
            opacity: 0.3,
            backgroundColor: zone.color || 'rgba(255, 0, 0, 0.3)',
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