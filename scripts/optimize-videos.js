import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const videoCategories = {
  main: ['introduction', 'outro', 'generique'],
  pov: ['POV_1', 'POV_2', 'POV_3'],
  objects: ['velo', 'boxe', 'foot', 'mapmonde', 'sablier', 'plante', 'cd', 'chien', 'jeuxvideo', 'photo'],
  transitions: ['1_vers_2', '1_vers_3', '2_vers_1', '2_vers_3', '3_vers_1', '3_vers_2', 'lit_vers_1'],
  explanatory: ['text_velo', 'text_boxe', 'text_foot', 'text_mapmonde', 'text_sablier', 'text_plante', 'text_cd', 'text_chien', 'text_jeuxvideo', 'text_photo'],
  music: ['main_song', 'outro_song', 'boxe_song', 'foot_song', 'chien_song', 'jeuxvideo_song']
};

function getOptimizationParams(category) {
  switch (category) {
    case 'main':
      return '-crf 23 -preset slow -b:a 128k';
    case 'pov':
    case 'objects':
      return '-crf 26 -preset medium -b:a 96k';
    case 'transitions':
      return '-crf 28 -preset fast -b:a 64k';
    case 'explanatory':
      return '-crf 28 -preset fast -b:a 64k';
    case 'music':
      return '-crf 30 -preset fast -b:a 128k';
    default:
      return '-crf 28 -preset medium -b:a 96k';
  }
}

async function optimizeVideo(inputPath, outputPath, category) {
  const params = getOptimizationParams(category);
  const command = `ffmpeg -i "${inputPath}" -c:v libx264 ${params} -c:a aac -movflags +faststart "${outputPath}"`;
  
  try {
    await execAsync(command);
    return true;
  } catch (error) {
    console.error(`Erreur FFmpeg: ${error.message}`);
    return false;
  }
}

async function optimizeAllVideos() {
  const inputDir = './original-videos';
  const outputDir = './optimized-videos';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let successCount = 0;
  
  for (const [category, videos] of Object.entries(videoCategories)) {
    console.log(`\n🎬 Optimisation des vidéos ${category}...`);
    
    for (const video of videos) {
      const inputPath = path.join(inputDir, `${video}.mp4`);
      const outputPath = path.join(outputDir, `${video}_optimized.mp4`);
      
      if (fs.existsSync(inputPath)) {
        try {
          console.log(`  🔄 Optimisation de ${video}...`);
          
          const success = await optimizeVideo(inputPath, outputPath, category);
          
          if (success) {
            const originalSize = fs.statSync(inputPath).size;
            const optimizedSize = fs.statSync(outputPath).size;
            const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
            
            totalOriginalSize += originalSize;
            totalOptimizedSize += optimizedSize;
            successCount++;
            
            console.log(`  ✅ ${video}: ${(originalSize/1024/1024).toFixed(1)}MB → ${(optimizedSize/1024/1024).toFixed(1)}MB (-${reduction}%)`);
          } else {
            console.log(`  ❌ Échec optimisation ${video}`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur optimisation ${video}:`, error.message);
        }
      } else {
        console.log(`  ⚠️  Fichier ${video}.mp4 non trouvé`);
      }
    }
  }
  
  const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
  
  console.log('\n📊 Résumé de l\'optimisation:');
  console.log(`✅ Vidéos optimisées: ${successCount}`);
  console.log(`📦 Taille totale: ${(totalOriginalSize/1024/1024).toFixed(1)}MB → ${(totalOptimizedSize/1024/1024).toFixed(1)}MB`);
  console.log(`💾 Réduction: ${totalReduction}%`);
  console.log(`💰 Économie estimée: ${((totalOriginalSize - totalOptimizedSize)/1024/1024 * 0.15).toFixed(2)}€/mois`);
}

optimizeAllVideos().catch(console.error);
