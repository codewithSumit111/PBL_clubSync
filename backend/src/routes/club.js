const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

// @route   GET /api/clubs
// @desc    Get all clubs with category, tagline, and member count
router.get('/', async (req, res) => {
    try {
        const clubs = await Club.find().select(
            'club_name description department category tagline faculty_coordinators events analytics official_website registered_students'
        );

        // Map to include member count
        const clubsWithCount = clubs.map(c => {
            const obj = c.toObject();
            obj.member_count = obj.registered_students ? obj.registered_students.length : 0;
            delete obj.registered_students; // don't leak student IDs
            return obj;
        });

        res.json({ success: true, clubs: clubsWithCount });
    } catch (err) {
        console.error('Error fetching clubs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/clubs/intake-status
// @desc    Check if intake window is currently open
router.get('/intake-status', async (req, res) => {
    try {
        // Find any admin with an active intake window
        const admin = await Admin.findOne({ 'intake_window.is_active': true }).lean();

        if (!admin || !admin.intake_window) {
            return res.json({ success: true, is_open: false });
        }

        const now = new Date();
        const { start_date, end_date, max_preferences, is_active } = admin.intake_window;

        const isOpen = is_active &&
            (!start_date || now >= new Date(start_date)) &&
            (!end_date || now <= new Date(end_date));

        return res.json({
            success: true,
            is_open: isOpen,
            max_preferences: max_preferences || 3,
            start_date,
            end_date
        });
    } catch (err) {
        console.error('Error checking intake status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/clubs/preferences
// @desc    Student submits top-N club preferences
router.post('/preferences', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can submit preferences' });
        }

        const { preferences } = req.body; // Array of club IDs in order: [1st, 2nd, 3rd]

        if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one club preference' });
        }

        if (preferences.length > 3) {
            return res.status(400).json({ success: false, message: 'You can select a maximum of 3 preferences' });
        }

        // Check for duplicates
        const unique = new Set(preferences);
        if (unique.size !== preferences.length) {
            return res.status(400).json({ success: false, message: 'Duplicate club selections are not allowed' });
        }

        // Verify all clubs exist
        const clubs = await Club.find({ _id: { $in: preferences } });
        if (clubs.length !== preferences.length) {
            return res.status(400).json({ success: false, message: 'One or more selected clubs do not exist' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Remove any existing pending preference applications
        student.registered_clubs = student.registered_clubs.filter(
            rc => rc.status !== 'Pending'
        );

        // Add new preferences
        preferences.forEach((clubId, index) => {
            student.registered_clubs.push({
                club: clubId,
                status: 'Pending',
                preference_order: index + 1
            });
        });

        await student.save();

        const clubNames = clubs.map(c => c.club_name);
        res.json({
            success: true,
            message: `Preferences submitted successfully! Your choices: ${clubNames.join(', ')}`,
            preferences: preferences.map((id, idx) => ({
                club_id: id,
                club_name: clubs.find(c => c._id.toString() === id)?.club_name,
                preference_order: idx + 1
            }))
        });
    } catch (err) {
        console.error('Error submitting preferences:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/clubs/register/:club_id
// @desc    Student registers for a club
router.post('/register/:club_id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can register for clubs' });
        }

        const club = await Club.findById(req.params.club_id);
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        const student = await Student.findById(req.user.id);

        // Check if student already applied or is registered
        const alreadyRegistered = student.registered_clubs.find(
            rc => rc.club.toString() === req.params.club_id
        );

        if (alreadyRegistered) {
            return res.status(400).json({ success: false, message: 'You have already applied or registered for this club' });
        }

        const { preference_order } = req.body;

        student.registered_clubs.push({
            club: req.params.club_id,
            status: 'Pending',
            preference_order: preference_order || (student.registered_clubs.length + 1)
        });

        await student.save();

        res.status(200).json({ success: true, message: `Application to ${club.club_name} submitted successfully!` });
    } catch (err) {
        console.error('Error registering for club:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/clubs/applications/:student_id
// @desc    Club approves/rejects a student application
router.put('/applications/:student_id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const student = await Student.findById(req.params.student_id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const application = student.registered_clubs.find(rc => rc.club.toString() === req.user.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'No application found for this student to your club' });
        }

        application.status = status;
        await student.save();

        if (status === 'Approved') {
            const club = await Club.findById(req.user.id);
            if (!club.registered_students.includes(student._id)) {
                club.registered_students.push(student._id);
                await club.save();
            }
        }

        res.json({ success: true, message: `Application ${status.toLowerCase()}` });
    } catch (err) {
        console.error('Error handling application:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
