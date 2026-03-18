const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// @route   GET /api/clubs
// @desc    Get all clubs (Public or Student)
router.get('/', async (req, res) => {
    try {
        const clubs = await Club.find().select('club_name description department faculty_coordinators events analytics official_website');
        res.json({ success: true, clubs });
    } catch (err) {
        console.error('Error fetching clubs:', err);
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

        const { preference_order } = req.body; // UI should send 1, 2, 3 etc

        // Add to student's pending list
        student.registered_clubs.push({
            club: req.params.club_id,
            status: 'Pending',
            preference_order: preference_order || (student.registered_clubs.length + 1)
        });

        await student.save();

        // Also add logic to put student in Club's pending queue if applicable,
        // For now, depending on student's registered_clubs array for the source of truth
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

        // Find the application for this club in student's array
        const application = student.registered_clubs.find(rc => rc.club.toString() === req.user.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'No application found for this student to your club' });
        }

        application.status = status;
        await student.save();

        // If approved, add student to the Club's registered_students list 
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

// @route   GET /api/clubs/dashboard
// @desc    Get dashboard metrics for a club
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized as club' });
        }

        const club = await Club.findById(req.user.id).populate('registered_students');
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        // Stats needed: total members, pending approvals, active events
        const pendingApprovalsCount = await Student.countDocuments({
            registered_clubs: { $elemMatch: { club: club._id, status: 'Pending' } }
        });

        return res.json({
            success: true,
            stats: {
                totalMembers: club.registered_students.length,
                pendingApprovals: pendingApprovalsCount,
                activeEvents: club.events.length,
            }
        });
    } catch (err) {
        console.error('[CLUB DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
