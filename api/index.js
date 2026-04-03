// api/index.js — Vercel Serverless Function entry point
// This wraps the Express backend for Vercel's serverless environment.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../backend/src/db');
const authRoutes = require('../backend/src/routes/auth');

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
    origin: true, // Allow all origins in production (Vercel handles security)
    credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clubs', require('../backend/src/routes/club'));
app.use('/api/logbooks', require('../backend/src/routes/logbook'));
app.use('/api/achievements', require('../backend/src/routes/achievement'));
app.use('/api/students', require('../backend/src/routes/student'));
app.use('/api/notices', require('../backend/src/routes/notice'));
app.use('/api/uploads', require('../backend/src/routes/upload'));
app.use('/api/events', require('../backend/src/routes/event'));
app.use('/api/admin', require('../backend/src/routes/admin'));

// Connect to MongoDB
connectDB();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ClubSync API is running on Vercel.', timestamp: new Date().toISOString() });
});

// 404 fallback for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[UNHANDLED ERROR]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

module.exports = app;
