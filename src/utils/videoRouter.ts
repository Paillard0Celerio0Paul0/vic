// Configuration des comptes Vimeo
export interface VimeoAccount {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  videoCount: number; // Nombre de vidéos actuellement sur ce compte
  maxVideos: number; // Limite du compte (10 pour gratuit)
}

// Configuration des vidéos et leur plateforme d'hébergement
export interface VideoConfig {
  id: string;
  platform: 'vimeo';
  vimeoId: string; // ID Vimeo
  vimeoAccountId: string; // ID du compte Vimeo utilisé
  size?: number; // Taille en MB (optionnel, pour référence)
}

// Configuration des comptes Vimeo
export const VIMEO_ACCOUNTS: Record<string, VimeoAccount> = {
  'vimeo_account_1': {
    id: 'vimeo_account_1',
    name: 'Compte Vimeo Principal',
    clientId: process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID_1 || '',
    clientSecret: process.env.VIMEO_CLIENT_SECRET_1 || '',
    videoCount: 5,
    maxVideos: 10
  },
  'vimeo_account_2': {
    id: 'vimeo_account_2',
    name: 'Compte Vimeo Secondaire',
    clientId: process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID_2 || '',
    clientSecret: process.env.VIMEO_CLIENT_SECRET_2 || '',
    videoCount: 10,
    maxVideos: 10
  },
  'vimeo_account_3': {
    id: 'vimeo_account_3',
    name: 'Compte Vimeo Tertiaire',
    clientId: process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID_3 || '',
    clientSecret: process.env.VIMEO_CLIENT_SECRET_3 || '',
    videoCount: 9,
    maxVideos: 10
  },
  // Ajoutez autant de comptes que nécessaire
};

// Configuration de toutes vos vidéos Vimeo
export const VIDEO_CONFIGS: Record<string, VideoConfig> = {
  // VIMEO ACCOUNT 1 - Vidéos principales
  'introduction': {
    id: 'introduction',
    platform: 'vimeo',
    vimeoId: '1118358438',
    vimeoAccountId: 'vimeo_account_1',
    size: 50
  },
  'outro': {
    id: 'outro',
    platform: 'vimeo',
    vimeoId: '1118358428',
    vimeoAccountId: 'vimeo_account_1',
    size: 30
  },
  'POV_1': {
    id: 'POV_1',
    platform: 'vimeo',
    vimeoId: '1118358576', // pov velo
    vimeoAccountId: 'vimeo_account_1',
    size: 80
  },
  'POV_2': {
    id: 'POV_2',
    platform: 'vimeo',
    vimeoId: '1118358594', // pov bureau
    vimeoAccountId: 'vimeo_account_1',
    size: 75
  },
  'POV_3': {
    id: 'POV_3',
    platform: 'vimeo',
    vimeoId: '1118358607', // pov armoire
    vimeoAccountId: 'vimeo_account_1',
    size: 85
  },

  // VIMEO ACCOUNT 2 - Vidéos d'objets
  'objet_jeuxvideo': {
    id: 'objet_jeuxvideo',
    platform: 'vimeo',
    vimeoId: '1118359144',
    vimeoAccountId: 'vimeo_account_2',
    size: 35
  },
  'objet_foot': {
    id: 'objet_foot',
    platform: 'vimeo',
    vimeoId: '1118359114',
    vimeoAccountId: 'vimeo_account_2',
    size: 45
  },
  'objet_chien': {
    id: 'objet_chien',
    platform: 'vimeo',
    vimeoId: '1118359102',
    vimeoAccountId: 'vimeo_account_2',
    size: 25
  },
  'objet_boxe': {
    id: 'objet_boxe',
    platform: 'vimeo',
    vimeoId: '1118359074',
    vimeoAccountId: 'vimeo_account_2',
    size: 40
  },
  'objet_photo': {
    id: 'objet_photo',
    platform: 'vimeo',
    vimeoId: '1118359055',
    vimeoAccountId: 'vimeo_account_2',
    size: 40
  },
  'objet_mapmonde': {
    id: 'objet_mapmonde',
    platform: 'vimeo',
    vimeoId: '1118359031',
    vimeoAccountId: 'vimeo_account_2',
    size: 35
  },
  'objet_sablier': {
    id: 'objet_sablier',
    platform: 'vimeo',
    vimeoId: '1118359002',
    vimeoAccountId: 'vimeo_account_2',
    size: 25
  },
  'objet_cd': {
    id: 'objet_cd',
    platform: 'vimeo',
    vimeoId: '1118358979', // rap
    vimeoAccountId: 'vimeo_account_2',
    size: 20
  },
  'objet_plante': {
    id: 'objet_plante',
    platform: 'vimeo',
    vimeoId: '1118358956',
    vimeoAccountId: 'vimeo_account_2',
    size: 30
  },
  'object_velo': {
    id: 'objet_velo',
    platform: 'vimeo',
    vimeoId: '1118358932',
    vimeoAccountId: 'vimeo_account_2',
    size: 30
  },

  // VIMEO ACCOUNT 3 - Vidéos de transition
  'lit_vers_1': {
    id: 'lit_vers_1',
    platform: 'vimeo',
    vimeoId: '1118359128', // lit vers velo
    vimeoAccountId: 'vimeo_account_3',
    size: 15
  },
  'lit_vers_2': {
    id: 'lit_vers_2',
    platform: 'vimeo',
    vimeoId: '1118359147', // lit vers bureau
    vimeoAccountId: 'vimeo_account_3',
    size: 15
  },
  'lit_vers_3': {
    id: 'lit_vers_3',
    platform: 'vimeo',
    vimeoId: '1118359100', // lit vers armoire
    vimeoAccountId: 'vimeo_account_3',
    size: 15
  }
};

// Fonction pour obtenir la configuration d'une vidéo
export const getVideoConfig = (videoId: string): VideoConfig | null => {
  return VIDEO_CONFIGS[videoId] || null;
};

// Fonction pour obtenir toutes les vidéos Vimeo
export const getVimeoVideos = (): VideoConfig[] => {
  return Object.values(VIDEO_CONFIGS);
};

// Fonction pour obtenir les vidéos d'un compte Vimeo spécifique
export const getVideosByVimeoAccount = (accountId: string): VideoConfig[] => {
  return Object.values(VIDEO_CONFIGS).filter(config => config.vimeoAccountId === accountId);
};

// Fonction pour vérifier si une vidéo existe
export const videoExists = (videoId: string): boolean => {
  return videoId in VIDEO_CONFIGS;
};

// Fonction pour obtenir l'URL complète d'une vidéo Vimeo
export const getVideoUrl = (videoId: string): string | null => {
  const config = getVideoConfig(videoId);
  if (!config) return null;

  return `https://vimeo.com/${config.vimeoId}`;
};

// Fonction pour obtenir le meilleur compte Vimeo disponible
export const getBestVimeoAccount = (): VimeoAccount | null => {
  const accounts = Object.values(VIMEO_ACCOUNTS);
  
  // Trouver le compte avec le moins de vidéos
  const availableAccounts = accounts.filter(account => account.videoCount < account.maxVideos);
  
  if (availableAccounts.length === 0) {
    console.warn('Aucun compte Vimeo disponible');
    return null;
  }
  
  // Retourner le compte avec le moins de vidéos
  return availableAccounts.reduce((best, current) => 
    current.videoCount < best.videoCount ? current : best
  );
};

// Fonction pour assigner automatiquement un compte Vimeo à une vidéo
export const assignVimeoAccount = (videoId: string): string | null => {
  const bestAccount = getBestVimeoAccount();
  if (!bestAccount) return null;
  
  // Mettre à jour le compteur de vidéos
  VIMEO_ACCOUNTS[bestAccount.id].videoCount++;
  
  console.log(`Vidéo ${videoId} assignée au compte ${bestAccount.name} (${bestAccount.videoCount}/${bestAccount.maxVideos})`);
  
  return bestAccount.id;
};

// Fonction pour obtenir les statistiques des comptes Vimeo
export const getVimeoAccountsStats = () => {
  const accounts = Object.values(VIMEO_ACCOUNTS);
  const totalVideos = accounts.reduce((sum, account) => sum + account.videoCount, 0);
  const totalCapacity = accounts.reduce((sum, account) => sum + account.maxVideos, 0);
  
  return {
    accounts: accounts.map(account => ({
      name: account.name,
      used: account.videoCount,
      max: account.maxVideos,
      available: account.maxVideos - account.videoCount,
      percentage: Math.round((account.videoCount / account.maxVideos) * 100)
    })),
    total: {
      used: totalVideos,
      capacity: totalCapacity,
      available: totalCapacity - totalVideos,
      percentage: Math.round((totalVideos / totalCapacity) * 100)
    }
  };
};

// Fonction pour réinitialiser les compteurs (utile pour les tests)
export const resetVimeoCounters = () => {
  Object.keys(VIMEO_ACCOUNTS).forEach(accountId => {
    VIMEO_ACCOUNTS[accountId].videoCount = 0;
  });
  console.log('Compteurs Vimeo réinitialisés');
};
