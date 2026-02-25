const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const { protect } = require('../middleware/auth');

// @route   POST /api/achievements
// @desc    Submit a new achievement (Student or Club)
router.post('/', protect, async (req, res) => {
    try {
        const { club_id, title, description, level, date, certificate_url } = req.body;

        if (!title || !description || !date) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Determine student_id and club_id based on who is creating it
        let studentToCredit = req.user.id;
        let clubToCredit = club_id;

        if (req.user.role === 'Club') {
            studentToCredit = req.body.student_id; // Club must provide which student they are tagging
            clubToCredit = req.user.id;

            if (!studentToCredit) {
                return res.status(400).json({ success: false, message: 'Must specify a student to tag with this achievement' });
            }
        } else if (req.user.role === 'Student') {
            if (!clubToCredit) {
                return res.status(400).json({ success: false, message: 'Must specify which club this achievement is for' });
            }
        } else {
            return res.status(403).json({ success: false, message: 'Admins cannot create personal achievements' });
        }

        const newAchievement = new Achievement({
            student_id: studentToCredit,
            club_id: clubToCredit,
            title,
            description,
            level: level || 'College',
            date,
            certificate_url: certificate_url || null
        });

        await newAchievement.save();
        res.status(201).json({ success: true, achievement: newAchievement });

    } catch (err) {
        console.error('Error submitting achievement:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/achievements/mine
// @desc    Get all achievements for the logged-in student
router.get('/mine', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const achievements = await Achievement.find({ student_id: req.user.id }).populate('club_id', 'club_name');
        res.json({ success: true, achievements });
    } catch (err) {
        console.error('Error fetching student achievements:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/achievements/club
// @desc    Get all achievements tagged to the logged-in club
router.get('/club', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const achievements = await Achievement.find({ club_id: req.user.id }).populate('student_id', 'name roll_no department');
        res.json({ success: true, achievements });
    } catch (err) {
        console.error('Error fetching club achievements:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
