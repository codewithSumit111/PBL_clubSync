const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Club = require('../models/Club');
const Logbook = require('../models/Logbook'); // assuming this exists
const { protect } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get data for Admin Dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const totalStudents = await Student.countDocuments();
        const totalClubs = await Club.countDocuments();
        
        let pendingApprovals = 0;
        try {
            pendingApprovals = await Logbook.countDocuments({ status: 'Pending' });
        } catch (e) {
            console.log('Logbook model missing or error', e);
        }

        // Calculate CCA Participation %
        // Roughly, percentage of students registered for at least one club
        const activeStudents = await Student.countDocuments({
            'registered_clubs.0': { $exists: true }
        });
        const participationRate = totalStudents === 0 ? 0 : Math.round((activeStudents / totalStudents) * 100);

        // Recent Updates: Last 5 students joined
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name department createdAt role');

        return res.json({
            success: true,
            stats: {
                totalStudents,
                totalClubs,
                pendingApprovals,
                ccaParticipation: `${participationRate}%`
            },
            recentUpdates: recentStudents
        });

    } catch (err) {
        console.error('[ADMIN DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/admin/students
// @desc    Get all students with their CCA stats
router.get('/students', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const students = await Student.find().select('roll_no name department registered_clubs');
        
        const mappedStudents = students.map(s => {
            let hours = 0;
            let marks = 0;
            s.registered_clubs.forEach(rc => {
                hours += (rc.cca_hours || 0);
                if (rc.cca_marks && rc.cca_marks.total) marks += rc.cca_marks.total;
            });
            return {
                id: s._id,
                roll: s.roll_no,
                name: s.name,
                dept: s.department,
                hours,
                marks
            };
        });

        return res.json({ success: true, students: mappedStudents });
    } catch (err) {
        console.error('[ADMIN STUDENTS ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
