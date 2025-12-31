'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/chapters/:id/annotations - Get annotations for a chapter (nested tree)
router.get('/chapters/:id/annotations', (req, res) => {
    try {
        const annotations = db.prepare(`
            SELECT * FROM annotations 
            WHERE chapter_id = ?
            ORDER BY start_offset ASC, created_at ASC
        `).all(req.params.id);
        
        // Build nested tree
        const annotationMap = new Map();
        const rootAnnotations = [];
        
        annotations.forEach(annotation => {
            annotation.replies = [];
            annotationMap.set(annotation.id, annotation);
        });
        
        annotations.forEach(annotation => {
            if (annotation.parent_id) {
                const parent = annotationMap.get(annotation.parent_id);
                if (parent) {
                    parent.replies.push(annotation);
                }
            } else {
                rootAnnotations.push(annotation);
            }
        });
        
        res.json(rootAnnotations);
    } catch (error) {
        console.error('Error fetching annotations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/chapters/:id/annotations - Create new annotation
router.post('/chapters/:id/annotations', (req, res) => {
    try {
        const chapterId = req.params.id;
        const { pseudo, comment, start_offset, end_offset, selected_text } = req.body;
        
        if (!pseudo || !comment) {
            return res.status(400).json({ error: 'Pseudo and comment are required' });
        }
        
        // Check chapter exists and is open for feedback
        const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(chapterId);
        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' });
        }
        if (chapter.status === 'validated') {
            return res.status(400).json({ error: 'Cannot annotate a validated chapter' });
        }
        
        // Validate offsets if provided
        if (start_offset !== undefined && end_offset !== undefined) {
            if (start_offset < 0 || end_offset < start_offset) {
                return res.status(400).json({ error: 'Invalid offsets' });
            }
        }
        
        const result = db.prepare(`
            INSERT INTO annotations (chapter_id, pseudo, comment, start_offset, end_offset, selected_text)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(chapterId, pseudo, comment, start_offset, end_offset, selected_text);
        
        res.status(201).json({ id: result.lastInsertRowid, message: 'Annotation created' });
    } catch (error) {
        console.error('Error creating annotation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/annotations/:id/reply - Reply to an annotation
router.post('/annotations/:id/reply', (req, res) => {
    try {
        const parentId = req.params.id;
        const { pseudo, comment } = req.body;
        
        if (!pseudo || !comment) {
            return res.status(400).json({ error: 'Pseudo and comment are required' });
        }
        
        // Get parent annotation
        const parent = db.prepare('SELECT * FROM annotations WHERE id = ?').get(parentId);
        if (!parent) {
            return res.status(404).json({ error: 'Parent annotation not found' });
        }
        
        // Check chapter is still open
        const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(parent.chapter_id);
        if (chapter.status === 'validated') {
            return res.status(400).json({ error: 'Cannot reply on a validated chapter' });
        }
        
        const result = db.prepare(`
            INSERT INTO annotations (chapter_id, parent_id, pseudo, comment)
            VALUES (?, ?, ?, ?)
        `).run(parent.chapter_id, parentId, pseudo, comment);
        
        res.status(201).json({ id: result.lastInsertRowid, message: 'Reply created' });
    } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
