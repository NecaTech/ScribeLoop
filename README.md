# ScribeLoop

Plateforme de feedback collaboratif pour auteurs. Permet à un cercle de confiance de lecteurs de laisser des annotations contextuelles directement sur le manuscrit.

## Stack Technique

- **Runtime**: Node.js (LTS v18+)
- **Framework**: Express.js
- **Database**: SQLite (via better-sqlite3)
- **Frontend**: Vanilla JavaScript (ES Modules)
- **Markdown**: markdown-it

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine (déjà inclus par défaut) :

```
PORT=3000
ADMIN_SECRET=dev_secret_change_me
```

## Lancement

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## Structure du Projet

```
scribeloop/
├── database/           # Base SQLite (créée automatiquement)
├── public/             # Assets statiques
│   ├── css/           # Styles
│   ├── js/            # Modules JavaScript
│   └── icons/         # Icônes SVG
├── src/
│   ├── app.js         # Serveur Express
│   ├── database.js    # Connexion SQLite & Schéma
│   └── routes/        # Routes API
└── .env               # Variables d'environnement
```

## API

### Chapters
- `GET /api/chapters` - Liste des chapitres
- `GET /api/chapters/:id` - Détail d'un chapitre
- `POST /api/chapters` - Créer un chapitre (Admin)

### Annotations
- `GET /api/chapters/:id/annotations` - Annotations d'un chapitre
- `POST /api/chapters/:id/annotations` - Nouvelle annotation
- `POST /api/annotations/:id/reply` - Répondre à une annotation
