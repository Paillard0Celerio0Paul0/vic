import { config } from 'dotenv';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtenir le répertoire du script actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet (un niveau au-dessus de scripts/)
config({ path: path.join(__dirname, '..', '.env') });

const optimizedVideos = [
  // Vidéos principales
  'introduction', 'outro', 'generique',
  // POV
  'POV_1', 'POV_2', 'POV_3',
  // Objets
  'velo', 'boxe', 'foot', 'mapmonde', 'sablier', 'plante', 'cd', 'chien', 'jeuxvideo', 'photo',
  // Transitions
  '1_vers_2', '1_vers_3', '2_vers_1', '2_vers_3', '3_vers_1', '3_vers_2', 'lit_vers_1',
  // Musiques
  'main_song', 'outro_song', 'boxe_song', 'foot_song', 'chien_song', 'jeuxvideo_song',
  // Vidéos explicatives
  'text_velo', 'text_boxe', 'text_foot', 'text_mapmonde', 'text_sablier', 'text_plante', 'text_cd', 'text_chien', 'text_jeuxvideo', 'text_photo'
];

async function uploadOptimizedVideo(fileName) {
  try {
    const filePath = path.join('scripts/optimized-videos', `${fileName}_optimized.mp4`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fichier ${filePath} non trouvé`);
      return null;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // Déterminer le Content-Type et l'extension selon le fichier
    let contentType, extension, uploadName;
    if (fileName.includes('song')) {
      // Les fichiers audio sont en MP3 généralement
      contentType = 'audio/mpeg';
      extension = '.mp3';
    } else {
      contentType = 'video/mp4';
      extension = '.mp4';
    }
    
    // IMPORTANT : Ajouter l'extension au nom pour que Vercel Blob détecte le bon Content-Type
    uploadName = `${fileName}${extension}`;
    
    const { url } = await put(uploadName, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: contentType,
      addRandomSuffix: false, // Pour éviter de changer les URLs
    });
    
    console.log(`✅ ${fileName} uploadé: ${(fileBuffer.length/1024/1024).toFixed(1)}MB (${contentType})`);
    console.log(`   URL: ${url}`);
    
    // Retourner le nom SANS extension pour le JSON (pour garder la compatibilité)
    return { fileName, url };
  } catch (error) {
    console.error(`❌ Erreur upload ${fileName}:`, error);
    return null;
  }
}

async function uploadAllOptimizedVideos() {
  const results = {};
  let successCount = 0;
  
  console.log(`🚀 Upload de ${optimizedVideos.length} vidéos optimisées...`);
  
  for (let i = 0; i < optimizedVideos.length; i++) {
    const fileName = optimizedVideos[i];
    console.log(`🔄 [${i+1}/${optimizedVideos.length}] Upload de ${fileName}...`);
    
    const result = await uploadOptimizedVideo(fileName);
    if (result) {
      results[result.fileName] = result.url;
      successCount++;
    }
    
    // Pause pour éviter les limites de rate
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Sauvegarder les nouvelles URLs dans le fichier à la racine
  const outputPath = path.join(__dirname, '..', 'blob-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('\n📊 Résumé de l\'upload:');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`📁 URLs sauvegardées dans blob-urls.json`);
  
  return results;
}

uploadAllOptimizedVideos().catch(console.error);

