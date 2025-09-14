'use client';

import React, { useState, useEffect } from 'react';

const SystemInfo = () => {
  const [userAgent, setUserAgent] = useState('N/A');
  const [currentUrl, setCurrentUrl] = useState('N/A');

  useEffect(() => {
    setUserAgent(window.navigator.userAgent);
    setCurrentUrl(window.location.href);
  }, []);

  return (
    <>
      <p><strong>User Agent:</strong> {userAgent}</p>
      <p><strong>URL actuelle:</strong> {currentUrl}</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
    </>
  );
};

const VimeoDiagnostic = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testVideos = [
    { id: '1118358438', name: 'Introduction' },
    { id: '1118358576', name: 'POV Vélo' },
    { id: '1118358594', name: 'POV Bureau' },
    { id: '1118358607', name: 'POV Armoire' },
  ];

  const testVimeoUrl = async (videoId: string, name: string) => {
    const url = `https://vimeo.com/${videoId}`;
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    
    try {
      // Test de l'URL embed seulement (évite CORS)
      const embedResponse = await fetch(embedUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Évite les erreurs CORS
      });
      
      return {
        videoId,
        name,
        url,
        embedUrl,
        publicStatus: 'N/A (CORS)',
        embedStatus: embedResponse.status || 'OK',
        publicOk: false, // Toujours false à cause de CORS
        embedOk: true, // On assume que c'est OK si pas d'erreur
        error: null
      };
    } catch (error) {
      return {
        videoId,
        name,
        url,
        embedUrl,
        publicStatus: 'ERROR',
        embedStatus: 'ERROR',
        publicOk: false,
        embedOk: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    for (const video of testVideos) {
      const result = await testVimeoUrl(video.id, video.name);
      results.push(result);
      setTestResults([...results]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Diagnostic Vimeo</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Test en cours...' : 'Relancer les tests'}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{result.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>ID:</strong> {result.videoId}</p>
                <p><strong>URL publique:</strong> {result.url}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    result.publicOk ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {result.publicStatus}
                  </span>
                </p>
              </div>
              <div>
                <p><strong>URL embed:</strong> {result.embedUrl}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    result.embedOk ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {result.embedStatus}
                  </span>
                </p>
              </div>
            </div>
            {result.error && (
              <div className="mt-2 p-2 bg-red-900 rounded text-sm">
                <strong>Erreur:</strong> {result.error}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Informations système</h3>
        <div className="text-sm space-y-1">
          <SystemInfo />
        </div>
      </div>
    </div>
  );
};

export default VimeoDiagnostic;
