'use client';

import React, { useState, useEffect } from 'react';
import { getVimeoAccountsStats, resetVimeoCounters, assignVimeoAccount } from '../utils/videoRouter';

const VimeoAccountManager: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Mettre à jour les statistiques
  const updateStats = () => {
    const currentStats = getVimeoAccountsStats();
    setStats(currentStats);
  };

  // Effet pour mettre à jour les stats au montage
  useEffect(() => {
    updateStats();
  }, []);

  // Fonction pour tester l'assignation automatique
  const testAssignment = () => {
    const testVideoId = `test_video_${Date.now()}`;
    const assignedAccount = assignVimeoAccount(testVideoId);
    
    if (assignedAccount) {
      console.log(`✅ Vidéo ${testVideoId} assignée au compte ${assignedAccount}`);
      updateStats();
    } else {
      console.log('❌ Aucun compte disponible');
    }
  };

  // Fonction pour réinitialiser les compteurs
  const handleReset = () => {
    resetVimeoCounters();
    updateStats();
    console.log('🔄 Compteurs réinitialisés');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors z-50"
      >
        📊 Stats Vimeo
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">📊 Comptes Vimeo</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {stats && (
        <div className="space-y-3">
          {/* Statistiques globales */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Total</h4>
            <div className="text-sm text-gray-600">
              <div>Vidéos utilisées: {stats.total.used}/{stats.total.capacity}</div>
              <div>Disponibles: {stats.total.available}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.total.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{stats.total.percentage}% utilisé</div>
            </div>
          </div>

          {/* Détails par compte */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Par compte</h4>
            {stats.accounts.map((account: any, index: number) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">{account.name}</span>
                  <span className="text-gray-600">{account.used}/{account.max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      account.percentage > 80 ? 'bg-red-500' : 
                      account.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${account.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {account.available} disponibles ({account.percentage}% utilisé)
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2 border-t">
            <button
              onClick={testAssignment}
              className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
            >
              🧪 Test
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VimeoAccountManager;

