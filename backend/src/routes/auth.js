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
        const { name, email, password, role, rollNo, department, year } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        // Only Students can self-register
        if (role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only Student accounts can be self-registered.' });
        }

        // Check if user already exists
        const existing = await Student.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Check if rollNo is duplicate
        if (rollNo) {
            const existingRoll = await Student.findOne({ roll_no: rollNo });
            if (existingRoll) {
                return res.status(409).json({ success: false, message: 'An account with this Roll Number already exists.' });
            }
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Student({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'Student',
            roll_no: rollNo,
            department,
            year: year || 1
        });

        await newUser.save();

        const token = generateToken({ id: newUser._id, email: newUser.email, role: 'Student', name: newUser.name });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: sanitizeUser(newUser, 'Student'),
        });
    } catch (err) {
        console.error('[REGISTER ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/add-club-lead  (admin-only)
// Body: { clubName, email, password, description }
// ─────────────────────────────────────────────
router.post('/add-club-lead', protect, async (req, res) => {
    try {
        // Only admins can add club leads
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only admins can add club lead accounts.' });
        }

        const { clubName, email, password, description } = req.body;

        if (!clubName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Club name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        // Check if email already exists
        const existing = await Club.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A club with this email already exists.' });
        }

        // Check if club name already exists
        const existingName = await Club.findOne({ club_name: clubName });
        if (existingName) {
            return res.status(409).json({ success: false, message: 'A club with this name already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newClub = new Club({
            club_name: clubName,
            description: description || 'Club description to be updated.',
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await newClub.save();

        return res.status(201).json({
            success: true,
            message: `Club lead account for "${clubName}" created successfully.`,
            club: sanitizeUser(newClub, 'Club'),
        });
    } catch (err) {
        console.error('[ADD CLUB LEAD ERROR]', err);
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

// ─────────────────────────────────────────────
// PUT /api/auth/change-password  (protected)
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        const Model = getModelByRole(req.user.role);
        if (!Model) {
            return res.status(400).json({ success: false, message: 'Invalid user role.' });
        }

        const user = await Model.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        console.error('[CHANGE PASSWORD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
