'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Helper to get metadata as an object
function getMetadata() {
    const rows = db.prepare('SELECT key, value FROM metadata').all();
    const metadata = {};
    rows.forEach(row => {
        // Try to parse JSON values, fallback to string
        try {
            metadata[row.key] = JSON.parse(row.value);
        } catch {
            metadata[row.key] = row.value;
        }
    });
    return metadata;
}

// Helper to set a metadata value
function setMetadata(key, value) {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare(`
        INSERT INTO metadata (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, valueStr);
}

// GET /api/metadata - Get project metadata
router.get('/', (req, res) => {
    try {
        const metadata = getMetadata();
        
        // Add computed fields
        const publishedCount = db.prepare(`
            SELECT COUNT(*) as count FROM chapters 
            WHERE status IN ('awaiting_feedback', 'validated')
        `).get().count;
        
        const totalChapters = metadata.total_chapters || 0;
        
        res.json({
            book_title: metadata.book_title || 'Mon Manuscrit',
            total_chapters: totalChapters,
            published_chapters: publishedCount,
            progress_percent: totalChapters > 0 
                ? Math.round((publishedCount / totalChapters) * 100) 
                : 0
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/metadata - Update project metadata (Admin only)
router.put('/', requireAdmin, (req, res) => {
    try {
        const { book_title, total_chapters } = req.body;
        
        if (book_title !== undefined) {
            if (typeof book_title !== 'string' || book_title.trim().length === 0) {
                return res.status(400).json({ error: 'book_title must be a non-empty string' });
            }
            setMetadata('book_title', book_title.trim());
        }
        
        if (total_chapters !== undefined) {
            if (!Number.isInteger(total_chapters) || total_chapters < 0) {
                return res.status(400).json({ error: 'total_chapters must be a non-negative integer' });
            }
            setMetadata('total_chapters', total_chapters);
        }
        
        res.json({ message: 'Metadata updated', ...getMetadata() });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
