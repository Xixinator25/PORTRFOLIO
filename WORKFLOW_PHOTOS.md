# 📸 Workflow pour ajouter des photos à ton portfolio

## ✅ Méthode simple (recommandée)

### 1. Ajoute tes photos dans le dossier de l'album
```
images/2026-01-11_Coupe_de_France_FCSM_vs_RC_LENS/IMG_5666.jpg
images/2026-01-11_Coupe_de_France_FCSM_vs_RC_LENS/IMG_5828.jpg
```

### 2. Ajoute les chemins dans `albums.json`
```json
{
    "title": "FCSM vs RC LENS",
    "category": "COUPE DE FRANCE",
    "cover": "images/2026-01-11_Coupe_de_France_FCSM_vs_RC_LENS/IMG_5642_resultat.webp",
    "images": [
        "images/2026-01-11_Coupe_de_France_FCSM_vs_RC_LENS/IMG_5642_resultat.webp",
        "images/2026-01-11_Coupe_de_France_FCSM_vs_RC_LENS/IMG_5666.jpg",
        "images/2026-01-11_Coupe_de_France_FCSM_vs_RC_LENS/IMG_5828.jpg"
    ]
}
```

### 3. Lance le script d'optimisation
```bash
node optimize_images.js
```

**Ce script va automatiquement créer :**
- IMG_5666_tiny.webp
- IMG_5666_small.webp
- IMG_5666_medium.webp
- IMG_5666_large.webp
- IMG_5828_tiny.webp
- IMG_5828_small.webp
- IMG_5828_medium.webp
- IMG_5828_large.webp

### 4. Déploie
```bash
git add .
git commit -m "Ajout photos album LENS"
git push origin main
```

## 🎯 Workflow complet

1. **Ajoute tes photos** dans le dossier de l'album
2. **Édite `albums.json`** pour ajouter les chemins
3. **Lance `node optimize_images.js`** pour créer les versions optimisées
4. **Déploie** avec git

## ⚠️ Important

- ✅ Le script `optimize_images.js` utilise **Sharp** (déjà installé)
- ✅ Pas besoin d'ImageMagick !
- ✅ Les versions optimisées sont créées automatiquement
- ✅ Tu peux utiliser `.jpg` ou `.webp` comme source

## 🚀 Exemple complet

```bash
# 1. Ajoute tes photos dans le dossier
# 2. Édite albums.json
# 3. Optimise
node optimize_images.js

# 4. Déploie
git add .
git commit -m "Ajout photos"
git push origin main
```

C'est tout ! 🎉
