import { config } from 'dotenv';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

config();

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
    const filePath = path.join('optimized-videos', `${fileName}_optimized.mp4`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fichier ${filePath} non trouvé`);
      return null;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const { url } = await put(fileName, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'video/mp4', // IMPORTANT pour Safari
    });
    
    console.log(`✅ ${fileName} uploadé: ${(fileBuffer.length/1024/1024).toFixed(1)}MB`);
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
  
  // Sauvegarder les nouvelles URLs
  fs.writeFileSync('blob-urls-optimized.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 Résumé de l\'upload:');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`📁 URLs sauvegardées dans blob-urls-optimized.json`);
  
  return results;
}

uploadAllOptimizedVideos().catch(console.error);
