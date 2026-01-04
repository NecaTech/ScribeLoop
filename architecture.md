Technical Architecture - ScribeLoop

Version: 3.0 (Firebase)
Architect: Winston
Status: Production
Target: Full-Stack Developer

## 1. High-Level Overview

ScribeLoop is a minimalist, collaborative feedback platform for authors. The system is deployed as a serverless application using Firebase.

**Core Philosophy**: "Boring Technology". Stability over novelty.
**Immutability Rule**: Once a chapter is in "Awaiting Feedback", its text content is locked to ensure annotation offsets remain valid.

### The Stack

| Component | Technology |
|-----------|------------|
| Hosting | Firebase Hosting (CDN) |
| Database | Cloud Firestore (NoSQL) |
| Frontend | Vanilla JavaScript (ES Modules) |
| Styling | CSS Variables (Native) |
| Markdown | markdown-it (CDN) |

## 2. File System Structure

```
scribeloop/
├── public/                   # Static Assets (served by Firebase)
│   ├── css/
│   │   ├── style.css         # Global styles & Typography
│   │   └── reader.css        # Specific styles for the reading view
│   ├── js/
│   │   ├── app.js            # Main entry point (router logic)
│   │   ├── firebase-api.js   # Firestore SDK integration
│   │   ├── reader.js         # Chapter rendering logic
│   │   └── annotator.js      # Selection & Highlighting logic
│   └── index.html            # Single Page Application
├── firebase.json             # Firebase Hosting configuration
├── firestore.rules           # Firestore security rules
├── .firebaserc               # Firebase project link
└── README.md
```

## 3. Database Schema (Firestore)

### 3.1. Collections

#### `metadata` (document: "project")
```json
{
  "book_title": "Mon Manuscrit",
  "total_chapters": 10
}
```

#### `chapters` (documents: auto-generated IDs)
```json
{
  "title": "Chapter Title",
  "content_md": "# Markdown content...",
  "status": "planned | awaiting_feedback | validated",
  "sort_order": 1,
  "created_at": Timestamp
}
```

#### `annotations` (documents: auto-generated IDs)
```json
{
  "chapter_id": "abc123",
  "parent_id": null,
  "pseudo": "LecteurX",
  "comment": "Great passage!",
  "quote": "selected text",
  "start_offset": 150,
  "end_offset": 175,
  "created_at": Timestamp
}
```

## 4. API (Firestore SDK)

All API calls are made directly from the browser using the Firestore JavaScript SDK.

### 4.1. Chapters

| Method | Description |
|--------|-------------|
| `chapters.list()` | Returns list of all chapters |
| `chapters.get(id)` | Returns single chapter |
| `chapters.create(data, adminToken)` | Create chapter (admin only) |
| `chapters.update(id, data, adminToken)` | Update chapter (admin only) |

### 4.2. Annotations

| Method | Description |
|--------|-------------|
| `annotations.list(chapterId)` | Returns annotations for a chapter |
| `annotations.create(chapterId, data)` | Create new annotation |
| `annotations.reply(annotationId, data)` | Reply to annotation |

## 5. The Annotation Engine (Frontend Logic)

### 5.1. The "Offset" Strategy

We treat the entire chapter text as a single linear string for calculation purposes.

1. **Selection**: User selects text.
2. **Calculation**: `annotator.js` calculates the absolute offset relative to `#chapter-content`.
3. **Storage**: Send `start_offset` and `end_offset` to Firestore.
4. **Re-hydration**: Load annotations → Sort by offset → Insert `<span class="highlight">` tags.

### 5.2. Mobile Interactions

- Listen for `selectionchange`
- If text is selected on touch device, wait 500ms
- Display custom "Annotate" floating button

## 6. Security

### 6.1. Authentication Model

| Role | Method |
|------|--------|
| Readers | No auth, pseudo stored in localStorage |
| Admin | Client-side token verification (MVP) |

### 6.2. Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true; // MVP: open, admin check in app
    }
  }
}
```

> **Note**: For production beyond MVP, implement Firebase Authentication.

## 7. Deployment

```bash
# One-time login
firebase login

# Deploy hosting + rules
firebase deploy
```

### URLs

- **Production**: https://scribeloop.web.app
- **Admin Console**: https://scribeloop.web.app/#admin