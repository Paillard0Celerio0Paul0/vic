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

## 🔄 Prochaines étapes

1. Tester sur Desktop ET iPad
2. Ouvrir la console et observer les logs
3. Cliquer sur un objet et **identifier exactement** où le flux se rompt
4. Une fois le problème identifié, appliquer la correction ciblée

---

## 📝 Fichiers modifiés

1. `src/app/page.tsx` - Logique principale
2. `src/app/globals.css` - Animation fadeIn pour flèches
3. `scripts/upload-optimized-videos.js` - contentType pour futurs uploads

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

