// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth'); // Re-enabled

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────
app.use('/api/auth', authRoutes); // Auth routes connected to DB
app.use('/api/clubs', require('./routes/club'));
app.use('/api/logbooks', require('./routes/logbook'));
app.use('/api/achievements', require('./routes/achievement'));

// Connect to MongoDB
connectDB();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ClubSync API is running.', timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[UNHANDLED ERROR]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 ClubSync API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Auth:   http://localhost:${PORT}/api/auth/login\n`);
});
