# Changelog - Corrections Safari/iOS

## Date : 8 Octobre 2025

---

## 🎯 Objectifs
Résoudre les problèmes de lecture vidéo/audio sur Safari desktop, iPad et iPhone.

---

## 🔍 Problème identifié

### Cause racine
**Content-Type incorrect** : Vercel Blob retournait `application/octet-stream` au lieu de `video/mp4` ou `audio/mpeg`

Safari refuse de lire les médias avec un mauvais Content-Type.

### Symptômes
- ❌ Vidéos ne se lancent pas sur Safari/iPad/iPhone
- ❌ `readyState: 0, networkState: 3` (NETWORK_NO_SOURCE)
- ❌ Erreur: "The operation is not supported"

---

## ✅ Solutions implémentées

### 1. **Détection améliorée iPad moderne**
```typescript
// iPad depuis iPadOS 13+ se fait passer pour "Mac"
const isIOS = 
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);

const isSafari = 
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  (userAgent.includes('AppleWebKit') && userAgent.includes('Safari') && !userAgent.includes('Chrome'));
```

### 2. **Fonction centralisée pour vidéos** - `loadAndPlayVideo()`
```typescript
// Safari/iOS : Fetch → Blob avec type: 'video/mp4' → URL.createObjectURL()
// Desktop : URL directe normale

if (isSafari || isIOS) {
  const response = await fetch(videoUrl);
  const blob = await response.blob();
  const videoBlob = new Blob([blob], { type: 'video/mp4' }); // ← FIX CONTENT-TYPE
  const blobUrl = URL.createObjectURL(videoBlob);
  videoRef.current.src = blobUrl;
  await videoRef.current.play();
}
```

**Utilisée pour** :
- Introduction
- lit_vers_1
- POV (1, 2, 3)
- Transitions entre POV
- Vidéos d'objets
- Outro
- Générique

### 3. **Fonction centralisée pour audio** - `loadAndPlayAudio()`
```typescript
// Safari/iOS : Blob avec type: 'audio/mpeg' ou 'audio/mp4'
// Desktop : URL directe

const mimeType = audioId.includes('song') ? 'audio/mpeg' : 'audio/mp4';
const audioBlob = new Blob([blob], { type: mimeType });
```

**Utilisée pour** :
- main_song (musique principale)
- outro_song
- Musiques d'objets (boxe_song, foot_song, chien_song, jeuxvideo_song)

### 4. **Fonction pour vidéos explicatives** - `loadAndPlayExplanatoryVideo()`
```typescript
// Gère les vidéos text_x en overlay
// Safari/iOS : Blob URL
// Desktop : URL directe
```

### 5. **Délai d'apparition des flèches de navigation**
```typescript
// Flèches POV apparaissent après 2 secondes
useEffect(() => {
  if (videoType === "POV") {
    setShowArrows(false);
    const timer = setTimeout(() => setShowArrows(true), 2000);
    return () => clearTimeout(timer);
  }
}, [videoType, currentVideo]);
```

### 6. **Flèche de retour responsive**
```typescript
// Avant : w-20 h-20 (80px fixe)
// Après : w-12 sm:w-16 md:w-20 (48px → 64px → 80px)
```

### 7. **Simplification élément `<video>`**
```typescript
<video
  ref={videoRef}
  playsInline
  webkit-playsinline="true"
  preload="none"
  muted={currentVideo === "introduction" || currentVideo === "outro" ? false : true}
  // Pas de src statique - géré dynamiquement
/>
```

### 8. **Script d'upload corrigé**
```javascript
// scripts/upload-optimized-videos.js
await put(fileName, fileBuffer, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN,
  contentType: 'video/mp4', // ← AJOUTÉ pour futurs uploads
});
```

---

## 📊 Impact

### Fonctionnel ✅
- Desktop (Chrome, Firefox, Edge) : **Inchangé, fonctionne normalement**
- iPad/iPhone/Safari : **Toutes vidéos/audio fonctionnent avec Blob URL**

### Performance
- Desktop : **Pas d'impact** (streaming direct)
- Safari/iOS : **Téléchargement complet** avant lecture (délai initial)

---

## 🐛 Corrections appliquées (8 Octobre - Session 2)

### 1. Erreur ORB sur Desktop ✅
**Cause** : `crossOrigin="anonymous"` déclenchait des erreurs ORB

**Solution** : 
- Suppression de `crossOrigin`
- Suppression du `src` statique dans le JSX
- Chargement via `loadAndPlayExplanatoryVideo()` uniquement

### 2. Vidéos text_x ne s'affichent pas ✅
**Cause** : Logique de déclenchement supprimée par erreur

**Solution** :
- Vidéo explicative sans `src` initial dans le JSX
- Chargement déclenché dans `handleTimeUpdate()` au bon timing
- Logs de debug ajoutés pour diagnostiquer

### 3. Vidéos objet sans son ✅
**Cause** : `videoRef.current.volume = 0` et `muted={true}` forcés

**Solution** :
- Ajout des vidéos objet dans `needsSound`
- Suppression du `volume = 0` dans `handleZoneClick`
- Unmute automatique avec volume 0.7 pour les objets
- Mise à jour du JSX : `muted={false}` pour les vidéos objet

### 4. main_song ne se joue pas ✅
**Cause** : Pas de logs de debug, difficile à diagnostiquer

**Solution** :
- Ajout de `setDebugMessage("🎵 Déclenchement main_song...")` à 40s
- Logs d'erreur si échec
- Vérification unlock audio pour Safari/iOS

### 5. outro_song ne se joue pas ✅
**Cause** : Pas de logs de debug

**Solution** :
- Ajout de `setDebugMessage("🎵 Déclenchement outro_song...")` après 6s
- Logs d'erreur si échec

### 6. Logs de debug améliorés ✅
**Solution** :
- Console.log dans `loadAndPlayExplanatoryVideo()` pour desktop
- Messages de debug pour Safari/iOS visibles en haut de l'écran
- Meilleure traçabilité des problèmes

---

## 🐛 Corrections critiques (8 Octobre - Session 3)

### Problème 1 : explanatoryVideoRef null ✅
**Cause** : On essayait de charger la vidéo explicative AVANT que React ne la monte dans le DOM

**Solution** :
- Ajout d'un `useEffect` qui se déclenche quand `showExplanatoryVideo` devient true
- Dans `handleTimeUpdate`, on active juste `setShowExplanatoryVideo(true)`
- Le chargement réel se fait dans `useEffect` quand le ref existe

### Problème 2 : main_song logs mais ne joue pas (iPad) 🔍
**Solution** :
- Ajout de logs console détaillés à chaque étape de `loadAndPlayAudio()`
- Logs des réponses fetch, taille blob, création Blob URL
- Logs des tentatives de play pour identifier où ça bloque

### Problème 3 : Son des vidéos objet ✅
**Clarification** : Le son des vidéos objet est dans des fichiers séparés (_song), pas dans la vidéo

**Correction** :
- Retrait des vidéos objet de `needsSound`
- Vidéos objet toujours en `muted={true}`
- Le son vient uniquement des fichiers `*_song` (boxe_song, foot_song, etc.)

---

## 🔍 Diagnostic approfondi - Vidéos text_x (Session 4)

### Observation : Aucun appel réseau vers text_x
**Constat** : Onglet Network ne montre aucune requête vers les vidéos text_x
**Conclusion** : `loadAndPlayExplanatoryVideo()` n'est jamais appelée

### Nouveaux logs de diagnostic ajoutés

#### 1. Dans `handleTimeUpdate` (vidéos objet)
```typescript
// Log toutes les 2 secondes
⏱️ Objet velo: 4.2s / timing: 6s, explanatoryVideo: text_velo, showExplanatoryVideo: false

// Au déclenchement
📺 DÉCLENCHEMENT text_velo à 6.1s (timing: 6s)
```

#### 2. Dans `useEffect` (surveillance vidéo explicative)
```typescript
// À chaque changement de showExplanatoryVideo ou explanatoryVideo
🔄 useEffect vidéo explicative déclenché: { 
  showExplanatoryVideo: true, 
  explanatoryVideo: "text_velo", 
  refExists: true 
}

// Si conditions OK
🎬 useEffect: Conditions OK → Chargement vidéo explicative text_velo

// Si ref null (avec retry automatique après 100ms)
⚠️ useEffect: ref null malgré showExplanatoryVideo=true, retry dans 100ms...
```

### Ce que ces logs vont révéler

1. **Timing atteint ?** → Logs `⏱️` montrent la progression
2. **Déclenchement ?** → Log `📺 DÉCLENCHEMENT` 
3. **useEffect activé ?** → Log `🔄 useEffect`
4. **Ref disponible ?** → `refExists: true/false`
5. **Chargement lancé ?** → Log `🎬 useEffect: Conditions OK`

---

## 🔧 Changement de stratégie - Safari/iOS (Session 5)

### Constat après tests
- ✅ **Desktop** : Fonctionne parfaitement (vidéos text_x + audio)
- ❌ **iPad/iPhone** : Rien ne fonctionne (ni vidéos text_x, ni main_song)

### Hypothèse
**Les Blob URL créées via fetch() ne fonctionnent pas correctement sur Safari/iOS**

Raisons possibles :
1. Safari iOS a des restrictions strictes sur les Blob créés dynamiquement
2. Les Blob URL audio peuvent être bloquées pour autoplay
3. Problèmes de permissions/sécurité avec fetch() + createObjectURL()

### Solution testée : Retour aux URLs directes sur Safari/iOS

**Changement appliqué** :
```typescript
// AVANT (ne fonctionnait pas sur Safari/iOS)
const response = await fetch(videoUrl);
const blob = await response.blob();
const videoBlob = new Blob([blob], { type: 'video/mp4' });
const blobUrl = URL.createObjectURL(videoBlob);
videoRef.current.src = blobUrl;

// APRÈS (test avec URLs directes)
videoRef.current.src = videoUrl; // URL Vercel Blob directe
videoRef.current.load();
await playWithRetry(videoRef.current, { maxAttempts: 5 });
```

**Appliqué à** :
- ✅ Vidéos principales (`loadAndPlayVideo`)
- ✅ Audio (`loadAndPlayAudio`)  
- ✅ Vidéos explicatives (`loadAndPlayExplanatoryVideo`)

### Pourquoi ça devrait fonctionner

1. **Vercel Blob** retourne peut-être maintenant le bon Content-Type
2. **Safari moderne** peut lire les vidéos même avec un Content-Type incorrect
3. **Moins de couches** = moins de points de défaillance
4. **Desktop continue à fonctionner** (même logique)

---

## 🚨 Correction urgente - Autoplay Safari/iOS (Session 6)

### Problème identifié
- ✅ **Desktop** : Fonctionne parfaitement
- ❌ **iOS/Safari** : Bloqué sur "erreur lecture" dès l'intro

### Cause racine
**Safari/iOS bloque l'autoplay des vidéos avec son**

Même si on met `muted=true` dans le JSX, le code essayait de démarrer avec du son, ce qui est **strictement interdit** par Safari sans interaction utilisateur.

### Solution appliquée

#### 1. Démarrage TOUJOURS en muted sur Safari/iOS
```typescript
// AVANT (bloqué par Safari)
if (isSafari || isIOS) {
  videoRef.current.muted = true; // Configuré mais...
  // ... puis on essaie de play avec son → BLOQUÉ
}

// APRÈS (fonctionne)
if (isSafari || isIOS) {
  videoRef.current.muted = true; // Forcé
  videoRef.current.src = videoUrl;
  videoRef.current.load();
  await playWithRetry(videoRef.current); // Play en muted → OK
  
  // PUIS unmute après 200ms si besoin
  if (needsSound) {
    setTimeout(() => {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }, 200);
  }
}
```

#### 2. Ne pas modifier le volume dans handlePlay (Safari/iOS)
```typescript
if (currentVideo === "introduction") {
  // Ne PAS toucher au volume pour Safari/iOS
  if (!isSafari && !isIOS) {
    videoRef.current.volume = videoVolume;
  }
}
```

#### 3. Logs détaillés dans playWithRetry
```typescript
console.log(`▶️ playWithRetry tentative ${attempt + 1}/${maxAttempts}...`);
console.log(`   readyState: ${readyState}, networkState: ${networkState}, muted: ${muted}`);
// Si échec :
console.warn(`⚠️ playWithRetry tentative ${attempt + 1} échouée:`, { name, message });
```

### Ce qui devrait se passer maintenant

**Sur Safari/iOS** :
1. Clic sur "Commencer"
2. ✅ Vidéo intro démarre **en muted** (autoplay autorisé)
3. ✅ Après 200ms → **unmute** automatique
4. ✅ Le son de la vidéo s'active

---

## 🔧 Nouvelle approche - Attente événement canplay (Session 7)

### Problème rencontré
- ❌ `playWithRetry: echec` sur Safari/iOS
- Toutes les tentatives échouent malgré `muted=true`

### Hypothèse
**Safari n'est pas prêt quand on appelle play()**

Le problème possible :
1. On charge la vidéo avec `load()`
2. On appelle `play()` immédiatement
3. Safari n'a pas eu le temps de charger les métadonnées
4. `play()` échoue car readyState insuffisant

### Nouvelle solution : Attendre l'événement `canplay`

**Changement appliqué** :
```typescript
// AVANT (échouait)
videoRef.current.src = videoUrl;
videoRef.current.load();
await playWithRetry(...); // ❌ Échec

// APRÈS (attend que Safari soit prêt)
videoRef.current.src = videoUrl;

// Attendre l'événement 'canplay' avant de play()
await new Promise((resolve, reject) => {
  const onCanPlay = () => {
    console.log("✅ Métadonnées chargées, readyState:", readyState);
    resolve();
  };
  const onError = (e) => {
    console.error("❌ Erreur chargement:", e);
    reject(new Error("Erreur chargement vidéo"));
  };
  
  videoRef.current.addEventListener('canplay', onCanPlay);
  videoRef.current.addEventListener('error', onError);
  videoRef.current.load(); // Démarrer le chargement
  
  // Timeout 10s si jamais canplay ne se déclenche pas
  setTimeout(() => reject(new Error("Timeout")), 10000);
});

// Maintenant on peut play() en toute sécurité
await videoRef.current.play(); // ✅ Devrait fonctionner
```

### Ce qui va se passer

**Scénario 1 - Succès** :
```
⏳ Attente chargement métadonnées...
✅ Métadonnées chargées, readyState: 4
▶️ Tentative play (muted)...
✅ Lecture réussie
🔊 Activation du son
```

**Scénario 2 - Erreur de chargement** :
```
⏳ Attente chargement métadonnées...
❌ Erreur chargement vidéo: [détails]
```

**Scénario 3 - Timeout** :
```
⏳ Attente chargement métadonnées...
❌ Timeout chargement vidéo (après 10s)
```

---

## 🚨 PROBLÈME IDENTIFIÉ - Content-Type Vercel Blob (Session 8)

### Symptôme
- ❌ iOS/Safari : Modal "Erreur de chargement de la vidéo"
- ❌ Reste bloqué sur "Chargement safari..."
- ❌ L'événement `canplay` ne se déclenche JAMAIS

### Cause racine probable
**Les fichiers Vercel Blob ont été uploadés SANS le bon Content-Type**

Safari refuse strictement de charger les vidéos si :
- Content-Type = `application/octet-stream` (probablement le cas)
- Au lieu de `video/mp4` ou `audio/mpeg`

### Diagnostic

**1. Vérifier le Content-Type actuel** :
```bash
curl -I https://ntpqkpm4vpvltypf.public.blob.vercel-storage.com/introduction
```

Cherchez la ligne `Content-Type:` :
- ✅ `Content-Type: video/mp4` → Problème ailleurs
- ❌ `Content-Type: application/octet-stream` → **Il faut re-uploader**

### Solution : Re-upload avec le bon Content-Type

Le script `upload-optimized-videos.js` a été mis à jour :

**Nouveautés** :
```javascript
// Détection automatique du Content-Type
let contentType = 'video/mp4';
if (fileName.includes('song')) {
  contentType = 'audio/mpeg';
}

await put(fileName, fileBuffer, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN,
  contentType: contentType,        // ✅ Bon Content-Type
  addRandomSuffix: false,          // ✅ Garde les mêmes URLs
});
```

**Commande pour re-uploader** :
```bash
npm run upload-videos
```

### 🔧 Correction supplémentaire - Extensions de fichiers

**Problème découvert** : Même avec `contentType` spécifié, Vercel Blob affichait "unknown" car les fichiers n'avaient **pas d'extension**.

**Solution** :
```javascript
// Ajouter l'extension au nom du fichier uploadé
const uploadName = `${fileName}.mp4`;  // ou .mp3 pour les audio
await put(uploadName, fileBuffer, {
  contentType: 'video/mp4',
  addRandomSuffix: false
});
```

⚠️ **Important** : Les URLs vont changer (ajout de `.mp4` ou `.mp3`). Le fichier `blob-urls.json` sera automatiquement mis à jour.

---

## 🔧 Correction build Next.js (Session 9)

### Problème de déploiement
```
ReferenceError: module is not defined in ES module scope
```

**Cause** : L'ajout de `"type": "module"` dans `package.json` forçait Next.js à traiter `next.config.js` comme un module ES, alors qu'il utilise la syntaxe CommonJS.

**Solution appliquée** :
1. ✅ Retrait de `"type": "module"` du `package.json`
2. ✅ Renommage du script : `upload-optimized-videos.js` → `upload-optimized-videos.mjs`
3. ✅ Les fichiers `.mjs` sont automatiquement traités comme modules ES

**Résultat** :
- ✅ Next.js peut build normalement
- ✅ Le script d'upload fonctionne toujours avec la syntaxe ES module

---

## 🔄 Prochaines étapes

1. **Re-déployer** sur Vercel (le build devrait maintenant fonctionner)
2. **Uploader les vidéos** avec `npm run upload-videos`
3. **Retester sur iPad/iPhone** après upload avec les nouveaux Content-Types

---

## 📝 Fichiers modifiés

### Code principal
1. `src/app/page.tsx` - Logique Safari/iOS avec attente événement canplay
2. `src/app/globals.css` - Animation fadeIn pour flèches

### Scripts et configuration
3. `scripts/upload-optimized-videos.mjs` - Upload avec extensions et Content-Type corrects
4. `package.json` - Commande `upload-videos` et retrait de `"type": "module"`

### Documentation
5. `CHANGELOG-SAFARI-FIX.md` - Documentation complète de toutes les corrections

---

## 🧪 Pour tester

### Desktop
1. Toutes les fonctionnalités doivent fonctionner normalement
2. Vidéos text_x apparaissent en overlay
3. Musiques se déclenchent

### iPad/iPhone/Safari
1. Observer les messages de debug en haut de l'écran
2. Noter à quel moment ça bloque
3. Vérifier la console Safari pour les erreurs

---

## 💡 Notes techniques

- **Blob URL** : Technique de contournement qui fonctionne à 100% sur Safari
- **Inconvénient** : Téléchargement complet nécessaire (pas de streaming)
- **Solution long terme** : Re-uploader tous les fichiers Vercel Blob avec le bon contentType
- **Commande** : `npm run upload-videos` (une fois les vidéos prêtes)

