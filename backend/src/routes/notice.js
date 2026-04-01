// backend/src/routes/notice.js
const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect } = require('../middleware/auth');

// @route   GET /api/notices
// @desc    Get all active notices
router.get('/', async (req, res) => {
    try {
        const notices = await Notice.find({ is_active: true })
            .populate('posted_by', 'name')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, notices });
    } catch (err) {
        console.error('Error fetching notices:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/notices
// @desc    Create a notice (Admin only)
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only admins can post notices' });
        }

        const { title, message, category } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        const notice = new Notice({
            title,
            message,
            category: category || 'General',
            posted_by: req.user.id
        });

        await notice.save();
        res.status(201).json({ success: true, notice });
    } catch (err) {
        console.error('Error creating notice:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/notices/:id
// @desc    Delete a notice (Admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only admins can delete notices' });
        }
        await Notice.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Notice deleted' });
    } catch (err) {
        console.error('Error deleting notice:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
