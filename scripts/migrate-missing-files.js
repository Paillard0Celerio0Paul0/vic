// scripts/migrate-missing-files.js
import { config } from 'dotenv';
import { put } from '@vercel/blob';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Charger les variables d'environnement
config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: 'dpqjlqwcq',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Mapping des noms de fichiers vers les IDs Cloudinary
const fileMapping = {
  // Objets - les IDs Cloudinary sont sans le préfixe "objet_"
  'objet_velo': 'velo',
  'objet_boxe': 'boxe', 
  'objet_foot': 'foot',
  'objet_mapmonde': 'mapmonde',
  'objet_sablier': 'sablier',
  'objet_plante': 'plante',
  'objet_cd': 'cd',
  'objet_chien': 'chien',
  'objet_jeuxvideo': 'jeuxvideo',
  'objet_photo': 'photo',
  // Transition manquante
  '3_vers_1': '3_vers_1'
};

async function downloadFromCloudinary(cloudinaryId) {
  try {
    const url = cloudinary.url(cloudinaryId, { resource_type: 'video' });
    console.log(`🔍 Tentative de téléchargement: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`⚠️  Fichier ${cloudinaryId} non trouvé sur Cloudinary (${response.status})`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`❌ Erreur téléchargement ${cloudinaryId}:`, error);
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

async function migrateMissingFiles() {
  const results = {};
  let successCount = 0;
  let errorCount = 0;
  
  const missingFiles = Object.keys(fileMapping);
  
  console.log(`🚀 Migration des ${missingFiles.length} fichiers manquants...`);
  console.log('📋 Mapping des fichiers:');
  Object.entries(fileMapping).forEach(([fileName, cloudinaryId]) => {
    console.log(`  ${fileName} → ${cloudinaryId}`);
  });
  
  for (let i = 0; i < missingFiles.length; i++) {
    const fileName = missingFiles[i];
    const cloudinaryId = fileMapping[fileName];
    
    console.log(`\n🔄 [${i+1}/${missingFiles.length}] Migration de ${fileName} (Cloudinary ID: ${cloudinaryId})...`);
    
    // Télécharger depuis Cloudinary avec le bon ID
    const fileBuffer = await downloadFromCloudinary(cloudinaryId);
    if (!fileBuffer) {
      errorCount++;
      continue;
    }
    
    // Uploader vers Vercel Blob avec le nom de fichier correct
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
  
  // Charger les URLs existantes
  const existingUrls = JSON.parse(fs.readFileSync('blob-urls.json', 'utf8'));
  
  // Fusionner avec les nouveaux résultats
  const allUrls = { ...existingUrls, ...results };
  
  // Sauvegarder les résultats complets
  fs.writeFileSync('blob-urls.json', JSON.stringify(allUrls, null, 2));
  
  console.log('\n📊 Résumé de la migration des fichiers manquants:');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 URLs mises à jour dans blob-urls.json`);
  console.log(`📈 Total des fichiers migrés: ${Object.keys(allUrls).length}`);
  
  return allUrls;
}

migrateMissingFiles().catch(console.error);
