// src/utils/blobUrls.js
import blobUrls from '../../blob-urls.json';

export const getBlobUrl = (videoId) => {
  return blobUrls[videoId] || null;
};

export const getOptimizedVideoUrl = (videoId) => {
  const blobUrl = getBlobUrl(videoId);
  if (blobUrl) {
    return blobUrl;
  }
  
  // Erreur si le fichier n'est pas trouvé dans Vercel Blob
  console.error(`❌ Fichier ${videoId} non trouvé dans Vercel Blob`);
  throw new Error(`Fichier ${videoId} non trouvé dans Vercel Blob`);
};

// Fonction pour obtenir l'URL avec gestion des Range Requests
export const getOptimizedVideoUrlWithRange = (videoId) => {
  const blobUrl = getBlobUrl(videoId);
  if (blobUrl) {
    // Pour Vercel Blob, utiliser l'URL directe sans paramètres de range
    return blobUrl;
  }
  
  // Erreur si le fichier n'est pas trouvé dans Vercel Blob
  console.error(`❌ Fichier ${videoId} non trouvé dans Vercel Blob`);
  throw new Error(`Fichier ${videoId} non trouvé dans Vercel Blob`);
};

// Fonction pour obtenir l'URL sans Range Requests (pour les vidéos problématiques)
export const getOptimizedVideoUrlNoRange = (videoId) => {
  const blobUrl = getBlobUrl(videoId);
  if (blobUrl) {
    return blobUrl;
  }
  
  // Erreur si le fichier n'est pas trouvé dans Vercel Blob
  console.error(`❌ Fichier ${videoId} non trouvé dans Vercel Blob`);
  throw new Error(`Fichier ${videoId} non trouvé dans Vercel Blob`);
};

// Fonction pour vérifier si un fichier est disponible sur Vercel Blob
export const isBlobAvailable = (videoId) => {
  return blobUrls[videoId] !== undefined;
};

// Fonction pour obtenir la liste des fichiers migrés
export const getMigratedFiles = () => {
  return Object.keys(blobUrls);
};

// Fonction pour obtenir le statut de migration
export const getMigrationStatus = () => {
  const totalFiles = 35; // Nombre total de fichiers attendus
  const migratedFiles = Object.keys(blobUrls).length;
  const percentage = Math.round((migratedFiles / totalFiles) * 100);
  
  return {
    total: totalFiles,
    migrated: migratedFiles,
    missing: totalFiles - migratedFiles,
    percentage: percentage
  };
};
