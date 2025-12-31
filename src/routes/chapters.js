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

// GET /api/chapters - List all chapters
router.get('/', (req, res) => {
    try {
        const chapters = db.prepare(`
            SELECT id, title, status, sort_order, created_at
            FROM chapters
            ORDER BY sort_order ASC
        `).all();
        res.json(chapters);
    } catch (error) {
        console.error('Error fetching chapters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/chapters/:id - Get single chapter with full content
router.get('/:id', (req, res) => {
    try {
        const chapter = db.prepare(`
            SELECT * FROM chapters WHERE id = ?
        `).get(req.params.id);
        
        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' });
        }
        res.json(chapter);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/chapters - Create new chapter (Admin only)
router.post('/', requireAdmin, (req, res) => {
    try {
        const { title, content_md, status = 'planned', sort_order = 0 } = req.body;
        
        if (!title || !content_md) {
            return res.status(400).json({ error: 'Title and content_md are required' });
        }
        
        const result = db.prepare(`
            INSERT INTO chapters (title, content_md, status, sort_order)
            VALUES (?, ?, ?, ?)
        `).run(title, content_md, status, sort_order);
        
        res.status(201).json({ id: result.lastInsertRowid, message: 'Chapter created' });
    } catch (error) {
        console.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/chapters/:id - Update chapter (Admin only)
router.put('/:id', requireAdmin, (req, res) => {
    try {
        const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
        
        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' });
        }
        
        // Immutability rule: cannot modify content if status is 'awaiting_feedback'
        if (chapter.status === 'awaiting_feedback' && req.body.content_md) {
            return res.status(400).json({ 
                error: 'Cannot modify content of a chapter awaiting feedback (immutability rule)' 
            });
        }
        
        const { title, content_md, status, sort_order } = req.body;
        
        db.prepare(`
            UPDATE chapters 
            SET title = COALESCE(?, title),
                content_md = COALESCE(?, content_md),
                status = COALESCE(?, status),
                sort_order = COALESCE(?, sort_order)
            WHERE id = ?
        `).run(title, content_md, status, sort_order, req.params.id);
        
        res.json({ message: 'Chapter updated' });
    } catch (error) {
        console.error('Error updating chapter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
