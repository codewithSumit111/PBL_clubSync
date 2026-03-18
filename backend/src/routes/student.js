const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// @route   GET /api/students/dashboard
// @desc    Get dashboard metrics for current student
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Not authorized as student' });
        }

        const student = await Student.findById(req.user.id)
            .populate('achievements')
            .populate('logbook_entries');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Calculate hours from registered clubs (based on the schema properties)
        let totalHours = 0;
        let totalCurrentMarks = 0;
        let activeClubsCount = 0;

        if (student.registered_clubs) {
            student.registered_clubs.forEach(rc => {
                totalHours += (rc.cca_hours || 0);
                if (rc.cca_marks && rc.cca_marks.total) {
                    totalCurrentMarks += rc.cca_marks.total;
                }
                if (rc.status === 'Approved') {
                    activeClubsCount += 1;
                }
            });
        }

        return res.json({
            success: true,
            stats: {
                totalCcaHours: totalHours,
                currentMarks: `${totalCurrentMarks}/25`,
                activeClubs: activeClubsCount,
                achievements: student.achievements ? student.achievements.length : 0
            }
        });

    } catch (err) {
        console.error('[STUDENT DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
