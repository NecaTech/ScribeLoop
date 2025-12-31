Technical Architecture - ScribeLoop

Version: 2.0 (Final)
Architect: Winston
Status: Approved for Development
Target: Full-Stack Developer (Phase 4)

1. High-Level Overview

ScribeLoop is a minimalist, collaborative feedback platform for authors. The system is designed to be self-hosted or run locally with zero external dependencies beyond the Node.js runtime.

Core Philosophy: "Boring Technology". Stability over novelty.
Immutability Rule: Once a chapter is in "Awaiting Feedback", its text content is locked to ensure annotation offsets remain valid.

The Stack (Frozen)

Runtime: Node.js (LTS v18+)

Framework: Express.js (chosen for ubiquity and simplicity)

Database: SQLite (via better-sqlite3 driver)

Frontend: Vanilla JavaScript (ES Modules). No build step (Webpack/Vite) required.

Styling: CSS Variables (Native).

Markdown Engine: markdown-it.

2. File System Structure

The developer must initialize the project using exactly this structure to ensure separation of concerns.

scribeloop/
├── database/
│   └── scribeloop.sqlite     # Created automatically on startup
├── public/                   # Static Assets (served by Express)
│   ├── css/
│   │   ├── style.css         # Global styles & Typography
│   │   └── reader.css        # Specific styles for the reading view
│   ├── js/
│   │   ├── app.js            # Main entry point (router logic)
│   │   ├── api.js            # Fetch wrapper for backend communication
│   │   ├── reader.js         # Chapter rendering logic
│   │   └── annotator.js      # Selection & Highlighting logic (The core complexity)
│   └── icons/                # SVG icons
├── src/
│   ├── app.js                # Express App setup
│   ├── database.js           # SQLite connection & Schema initialization
│   └── routes/
│       ├── chapters.js       # CRUD for chapters
│       └── annotations.js    # CRUD for comments
├── .env                      # Environment variables (PORT, ADMIN_SECRET)
├── package.json
└── README.md


3. Database Schema (SQLite)

We use better-sqlite3 for synchronous, crash-safe operations.

3.1. Initialization SQL

This script must run on server startup (src/database.js) if the file does not exist.

-- 1. Metadata (Project Settings)
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 2. Chapters
CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    status TEXT CHECK(status IN ('planned', 'awaiting_feedback', 'validated')) DEFAULT 'planned',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Annotations
CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,   -- If NULL, it's a root comment. If set, it's a reply.
    pseudo TEXT NOT NULL,
    comment TEXT NOT NULL,
    selected_text TEXT,               -- Context for fallback
    start_offset INTEGER,             -- Absolute character index in the rendered text
    end_offset INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id),
    FOREIGN KEY(parent_id) REFERENCES annotations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(sort_order);
CREATE INDEX IF NOT EXISTS idx_annotations_chapter ON annotations(chapter_id);


4. API Contract (REST)

All responses must be JSON. Errors must return standard HTTP codes (400, 404, 500).

4.1. Chapters

GET /api/chapters: Returns list of chapters (id, title, status).

GET /api/chapters/:id: Returns full content + HTML rendered server-side (optional) or Markdown.

POST /api/chapters (Admin): Create/Update chapter content.

4.2. Annotations

GET /api/chapters/:id/annotations: Returns nested tree of comments.

POST /api/chapters/:id/annotations:

Payload: { pseudo, comment, start_offset, end_offset, selected_text }

Logic: Validate that start_offset and end_offset are within bounds.

POST /api/annotations/:id/reply:

Payload: { pseudo, comment }

5. The Annotation Engine (Frontend Logic)

This is the most critical technical component. It handles the "Selection" to "Storage" mapping.

5.1. The "Offset" Strategy

We cannot rely on DOM Node logic (e.g., "Paragraph 3, childNode 2") because it is brittle.
Strategy: We treat the entire chapter text as a single linear string for calculation purposes.

Selection: User selects text.

Calculation: annotator.js calculates the absolute offset of the selection relative to the root container (#chapter-content).

Note: We must normalize line breaks to ensure consistency between Browsers.

Storage: Send start_offset (int) and end_offset (int) to DB.

Re-hydration (Rendering):

Load Chapter text.

Load Annotations.

Sort annotations by start_offset.

Insert <span class="highlight" data-id="123"> tags into the HTML at the specific indices.

5.2. Mobile Interactions (Touch)

To satisfy the Mobile User Story:

Listen for selectionchange.

If text is selected on a touch device, wait 500ms.

If selection persists, display a custom "Annotate" floating button near the selection (using window.getSelection().getRangeAt(0).getBoundingClientRect()).

This bypasses the need to override the native context menu aggressively.

6. Security & Admin

Authentication: Minimalist.

Readers: No Auth. Just provide a pseudo (stored in localStorage).

Admin: A simple x-admin-token header required for POST /api/chapters. The token is set in .env.

7. Development Roadmap (Phase 4)

Setup: npm init, install express better-sqlite3 markdown-it.

Backend Core: Setup SQLite and basic Routes.

Frontend Reader: Fetch Markdown, render HTML.

Annotation Logic: Implement the selection calculator (The hardest part, do this carefully).

UI Polish: CSS Variables for typography and spacing.