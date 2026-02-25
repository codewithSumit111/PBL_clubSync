// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Club = require('../models/Club');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: generate JWT
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

// Helper: sanitize user (remove password before sending)
function sanitizeUser(user, fallbackRole) {
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;
    if (safeUser._id) {
        safeUser.id = safeUser._id;
    }
    if (!safeUser.role && fallbackRole) {
        safeUser.role = fallbackRole;
    }
    return safeUser;
}

// Helper: Get Model based on role
function getModelByRole(role) {
    if (role === 'Student') return Student;
    if (role === 'Club') return Club;
    if (role === 'Admin') return Admin;
    return null;
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

        const Model = getModelByRole(role);
        if (!Model) {
            return res.status(400).json({ success: false, message: 'Invalid role provided.' });
        }

        const user = await Model.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken({ id: user._id, email: user.email, role: user.role || role, name: user.name || user.club_name });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: sanitizeUser(user, role),
        });
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, role, ...extras }
// Student extras: rollNo, department, year
// Club extras:    clubName, department
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, rollNo, department, year, clubName } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        if (role === 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered.' });
        }

        if (!['Student', 'Club'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be "Student" or "Club".' });
        }

        const Model = getModelByRole(role);

        // Check if user already exists
        const existing = await Model.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Also check if rollNo is duplicate for students
        if (role === 'Student' && rollNo) {
            const existingRoll = await Student.findOne({ roll_no: rollNo });
            if (existingRoll) {
                return res.status(409).json({ success: false, message: 'An account with this Roll Number already exists.' });
            }
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser;

        if (role === 'Student') {
            newUser = new Student({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'Student',
                roll_no: rollNo,
                department,
                year: year || 1 // Fallback to 1 if missing from the request
            });
        } else if (role === 'Club') {
            newUser = new Club({
                club_name: clubName || name, // UI might pass name instead of clubName
                description: 'Please update your club description in the dashboard.', // Default description
                email: email.toLowerCase(),
                password: hashedPassword
            });
        }

        await newUser.save();

        const token = generateToken({ id: newUser._id, email: newUser.email, role: newUser.role || role, name: newUser.name || newUser.club_name });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: sanitizeUser(newUser, role),
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
router.get('/me', protect, async (req, res) => {
    try {
        const role = req.user.role;
        const Model = getModelByRole(role);

        if (!Model) {
            return res.status(404).json({ success: false, message: 'Invalid user role.' });
        }

        const user = await Model.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({ success: true, user: sanitizeUser(user, role) });
    } catch (err) {
        console.error('[ME ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
