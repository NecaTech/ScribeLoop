'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');

// Initialize database (creates tables if not exist)
const db = require('./database');

// Import routes
const chaptersRouter = require('./routes/chapters');
const annotationsRouter = require('./routes/annotations');
const metadataRouter = require('./routes/metadata');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/chapters', chaptersRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api', annotationsRouter);

// Serve index.html for all other routes (SPA fallback)
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`ScribeLoop server running on http://localhost:${PORT}`);
});

module.exports = app;
