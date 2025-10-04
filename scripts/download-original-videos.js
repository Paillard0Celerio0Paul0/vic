import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

config();

cloudinary.config({
  cloud_name: 'dpqjlqwcq',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const videoFiles = [
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

async function downloadVideo(publicId) {
  try {
    const url = cloudinary.url(publicId, { resource_type: 'video' });
    console.log(`📥 Téléchargement de ${publicId}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`⚠️  ${publicId} non trouvé (${response.status})`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const outputPath = path.join('original-videos', `${publicId}.mp4`);
    
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`✅ ${publicId} téléchargé: ${(buffer.byteLength/1024/1024).toFixed(1)}MB`);
    return outputPath;
  } catch (error) {
    console.error(`❌ Erreur téléchargement ${publicId}:`, error);
    return null;
  }
}

async function downloadAllVideos() {
  console.log(`🚀 Téléchargement de ${videoFiles.length} vidéos...`);
  
  for (let i = 0; i < videoFiles.length; i++) {
    const videoId = videoFiles[i];
    await downloadVideo(videoId);
    
    // Pause pour éviter les limites de rate
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Téléchargement terminé !');
}

downloadAllVideos().catch(console.error);
