// api/index.js — Vercel Serverless Function entry point
// This wraps the Express backend for Vercel's serverless environment.
try { require('dotenv').config(); } catch (_) { /* no .env on Vercel */ }
const express = require('express');
const cors = require('cors');
const connectDB = require('../backend/src/db');

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());

// ── DB Connection (cached across warm invocations) ──
const mongoose = require('mongoose');
const ensureDB = async () => {
    const state = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state === 0 || state === 3) {
        await connectDB();
    }
    // If state === 2 (connecting), wait for it to finish
    if (mongoose.connection.readyState === 2) {
        await new Promise((resolve, reject) => {
            mongoose.connection.once('connected', resolve);
            mongoose.connection.once('error', reject);
        });
    }
};

// Ensure DB is connected BEFORE any route handler runs
app.use(async (req, res, next) => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('[CRITICAL] MONGO_URI is not set in environment variables.');
            return res.status(500).json({ 
                success: false, 
                message: 'Internal configuration error: MONGO_URI missing.',
                tip: 'Ensure MONGO_URI is added to your Vercel Project Settings > Environment Variables.'
            });
        }
        if (!process.env.JWT_SECRET) {
            console.error('[CRITICAL] JWT_SECRET is not set in environment variables.');
            return res.status(500).json({
                success: false,
                message: 'Internal configuration error: JWT_SECRET missing.',
                tip: 'Ensure JWT_SECRET is added to your Vercel Project Settings > Environment Variables.'
            });
        }
        await ensureDB();
        next();
    } catch (err) {
        console.error('[DB CONNECTION ERROR]', err.message);
        // On Vercel, this often happens if the MongoDB IP allowlist is not set to 0.0.0.0/0
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed.', 
            error: err.message,
            tip: 'Check your MONGO_URI and ensure MongoDB Atlas IP Allowlist includes 0.0.0.0/0' 
        });
    }
});

// ── Routes (AFTER DB middleware) ────────────
app.use('/api/auth', require('../backend/src/routes/auth'));
app.use('/api/clubs', require('../backend/src/routes/club'));
app.use('/api', require('../backend/src/routes/attendance')); // Attendance has /clubs/events/ and /students/ paths
app.use('/api/logbooks', require('../backend/src/routes/logbook'));
app.use('/api/achievements', require('../backend/src/routes/achievement'));
app.use('/api/students', require('../backend/src/routes/student'));
app.use('/api/notices', require('../backend/src/routes/notice'));
app.use('/api/uploads', require('../backend/src/routes/upload'));
app.use('/api/events', require('../backend/src/routes/event'));
app.use('/api/admin', require('../backend/src/routes/admin'));

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
