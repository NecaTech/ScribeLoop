'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'scribeloop.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const initSchema = () => {
    db.exec(`
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
            parent_id INTEGER DEFAULT NULL,
            pseudo TEXT NOT NULL,
            comment TEXT NOT NULL,
            selected_text TEXT,
            start_offset INTEGER,
            end_offset INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(chapter_id) REFERENCES chapters(id),
            FOREIGN KEY(parent_id) REFERENCES annotations(id) ON DELETE CASCADE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(sort_order);
        CREATE INDEX IF NOT EXISTS idx_annotations_chapter ON annotations(chapter_id);
    `);

    console.log('Database schema initialized successfully');
};

// Run initialization
initSchema();

module.exports = db;
