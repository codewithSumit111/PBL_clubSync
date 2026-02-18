// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { findUserByEmail, findUserById, addUser } = require('../db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: generate JWT
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

// Helper: sanitize user (remove password before sending)
function sanitizeUser(user) {
    const { password, ...safe } = user;
    return safe;
}

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password, role }
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        const user = findUserByEmail(email);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Role must match
        if (user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `This account is registered as "${user.role}", not "${role}". Please select the correct role.`,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: sanitizeUser(user),
        });
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, role, ...extras }
// Admin cannot self-register.
// Student extras: rollNo, department, year
// Club extras:    clubName, department
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, rollNo, department, year, clubName } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
        }

        if (role === 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered.' });
        }

        if (!['Student', 'Club'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be "Student" or "Club".' });
        }

        const existing = findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(),
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            department: department || null,
            // Student-specific
            ...(role === 'Student' && { rollNo: rollNo || null, year: year || null }),
            // Club-specific
            ...(role === 'Club' && { clubName: clubName || name, clubId: uuidv4() }),
            createdAt: new Date().toISOString(),
        };

        addUser(newUser);

        const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: sanitizeUser(newUser),
        });
    } catch (err) {
        console.error('[REGISTER ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
    try {
        const user = findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({ success: true, user: sanitizeUser(user) });
    } catch (err) {
        console.error('[ME ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
