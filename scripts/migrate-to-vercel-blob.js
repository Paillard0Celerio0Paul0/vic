// scripts/migrate-to-vercel-blob.js
import { config } from 'dotenv';
import { put } from '@vercel/blob';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
config();

// Vérifier les variables d'environnement
console.log('🔍 Vérification des variables d\'environnement...');
console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '✅ Présent' : '❌ Manquant');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Présent' : '❌ Manquant');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Présent' : '❌ Manquant');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN manquant');
  console.log('💡 Solutions:');
  console.log('1. Vérifiez que .env.local contient BLOB_READ_WRITE_TOKEN');
  console.log('2. Exécutez: vercel env pull');
  console.log('3. Ou créez le store Vercel Blob dans le dashboard');
  process.exit(1);
}

// Configuration Cloudinary
cloudinary.config({
  cloud_name: 'dpqjlqwcq',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Liste complète de vos fichiers
const mediaFiles = [
  // Vidéos principales
  'introduction', 'outro', 'generique',
  // POV
  'POV_1', 'POV_2', 'POV_3',
  // Objets
  'objet_velo', 'objet_boxe', 'objet_foot', 'objet_mapmonde',
  'objet_sablier', 'objet_plante', 'objet_cd', 'objet_chien',
  'objet_jeuxvideo', 'objet_photo',
  // Transitions
  '1_vers_2', '1_vers_3', '2_vers_1', '2_vers_3', '3_vers_1', '3_vers_2',
  'lit_vers_1',
  // Musiques
  'main_song', 'outro_song', 'boxe_song', 'foot_song', 'chien_song', 'jeuxvideo_song',
  // Vidéos explicatives
  'text_velo', 'text_boxe', 'text_foot', 'text_mapmonde', 'text_sablier',
  'text_plante', 'text_cd', 'text_chien', 'text_jeuxvideo', 'text_photo'
];

async function downloadFromCloudinary(publicId) {
  try {
    const url = cloudinary.url(publicId, { resource_type: 'video' });
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`⚠️  Fichier ${publicId} non trouvé sur Cloudinary`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`❌ Erreur téléchargement ${publicId}:`, error);
    return null;
  }
}

async function uploadToVercelBlob(fileName, fileBuffer) {
  try {
    const { url } = await put(fileName, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`✅ ${fileName} uploadé: ${url}`);
    return url;
  } catch (error) {
    console.error(`❌ Erreur upload ${fileName}:`, error);
    return null;
  }
}

async function migrateFiles() {
  const results = {};
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`🚀 Début de la migration de ${mediaFiles.length} fichiers...`);
  
  for (let i = 0; i < mediaFiles.length; i++) {
    const fileName = mediaFiles[i];
    console.log(`🔄 [${i+1}/${mediaFiles.length}] Migration de ${fileName}...`);
    
    // Télécharger depuis Cloudinary
    const fileBuffer = await downloadFromCloudinary(fileName);
    if (!fileBuffer) {
      errorCount++;
      continue;
    }
    
    // Uploader vers Vercel Blob
    const blobUrl = await uploadToVercelBlob(fileName, fileBuffer);
    if (blobUrl) {
      results[fileName] = blobUrl;
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pause pour éviter les limites de rate
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Sauvegarder les résultats
  fs.writeFileSync('blob-urls.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 Résumé de la migration:');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 URLs sauvegardées dans blob-urls.json`);
  
  return results;
}

migrateFiles().catch(console.error);