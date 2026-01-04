# ScribeLoop

Plateforme de feedback collaboratif pour auteurs. Permet à un cercle de confiance de lecteurs de laisser des annotations contextuelles directement sur le manuscrit.

## 🌐 Production

**URL** : [https://scribeloop.web.app](https://scribeloop.web.app)

## Stack Technique

- **Hébergement** : Firebase Hosting (gratuit)
- **Base de données** : Cloud Firestore (NoSQL)
- **Frontend** : Vanilla JavaScript (ES Modules)
- **Markdown** : markdown-it (CDN)

## Installation locale

```bash
# Servir les fichiers statiques
npx serve public -l 3000
```

L'app se connecte à Firestore en production, donc les données sont partagées.

## Configuration

Les credentials Firebase sont dans `public/js/firebase-api.js`.

Le mot de passe admin est défini dans le même fichier (variable `ADMIN_SECRET`).

## Déploiement

```bash
# Connexion (une seule fois)
firebase login

# Déployer
firebase deploy
```

## Structure du Projet

```
scribeloop/
├── public/             # Assets statiques (hébergés sur Firebase)
│   ├── css/           # Styles
│   ├── js/            # Modules JavaScript
│   │   ├── app.js           # Point d'entrée principal
│   │   ├── firebase-api.js  # SDK Firestore
│   │   ├── reader.js        # Rendu des chapitres
│   │   └── annotator.js     # Moteur d'annotation
│   └── index.html     # SPA unique
├── firebase.json      # Configuration Firebase Hosting
├── firestore.rules    # Règles de sécurité Firestore
└── .firebaserc        # Projet Firebase lié
```

## Collections Firestore

| Collection | Description |
|------------|-------------|
| `metadata` | Paramètres du projet (titre, chapitres prévus) |
| `chapters` | Chapitres avec contenu Markdown |
| `annotations` | Annotations et réponses des lecteurs |

## Admin

- Accès : `https://scribeloop.web.app/#admin`
- Mot de passe : configuré dans `firebase-api.js`

## Documentation

- [prd.md](./prd.md) - Product Requirements
- [architecture.md](./architecture.md) - Architecture technique
- [user_story.md](./user_story.md) - User Stories
- [ux-design.md](./ux-design.md) - Spécifications UX/UI
