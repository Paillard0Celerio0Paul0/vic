'use client';

import React, { useState } from 'react';
import VimeoPlayer from './VimeoPlayer';

const VimeoTest = () => {
  const [currentVideo, setCurrentVideo] = useState('1118358438'); // ID de l'introduction
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const testVideos = [
    { id: '1118358438', name: 'Introduction' },
    { id: '1118358576', name: 'POV Vélo' },
    { id: '1118358594', name: 'POV Bureau' },
    { id: '1118358607', name: 'POV Armoire' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test VimeoPlayer</h1>
      
      <div className="mb-6">
        <h2 className="text-xl mb-4">Contrôles</h2>
        <div className="space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <label className="flex items-center space-x-2">
            <span>Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-32"
            />
            <span>{Math.round(volume * 100)}%</span>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-4">Sélectionner une vidéo</h2>
        <div className="grid grid-cols-2 gap-4">
          {testVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => setCurrentVideo(video.id)}
              className={`p-4 rounded border ${
                currentVideo === video.id 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
              }`}
            >
              {video.name}
              <br />
              <span className="text-sm text-gray-400">ID: {video.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-4">Lecteur vidéo</h2>
        <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <VimeoPlayer
            videoId={currentVideo}
            playing={isPlaying}
            volume={volume}
            onTimeUpdate={(time) => console.log('Time:', time)}
            onLoadedData={() => console.log('Vidéo chargée')}
            onEnded={() => console.log('Vidéo terminée')}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <div className="text-sm text-gray-400">
        <p>Vidéo actuelle: {currentVideo}</p>
        <p>État: {isPlaying ? 'Lecture' : 'Pause'}</p>
        <p>Volume: {Math.round(volume * 100)}%</p>
      </div>
    </div>
  );
};

export default VimeoTest;
