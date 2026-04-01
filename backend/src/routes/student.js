// backend/src/routes/student.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Logbook = require('../models/Logbook');
const Notice = require('../models/Notice');
const { protect } = require('../middleware/auth');

// @route   GET /api/students/dashboard
// @desc    Get student dashboard data (clubs, CCA hours, action items, notices)
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can access this dashboard' });
        }

        // 1. Fetch student with populated club data
        const student = await Student.findById(req.user.id)
            .populate('registered_clubs.club', 'club_name description department')
            .lean();

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 2. Build joined clubs list (only Approved clubs)
        const joinedClubs = student.registered_clubs
            .filter(rc => rc.status === 'Approved')
            .map(rc => ({
                _id: rc.club?._id,
                club_name: rc.club?.club_name || 'Unknown Club',
                description: rc.club?.description || '',
                department: rc.club?.department || '',
                cca_hours: rc.cca_hours || 0,
                cca_marks: rc.cca_marks || {}
            }));

        // 3. Calculate CCA hours progress
        const totalCCAHours = joinedClubs.reduce((sum, c) => sum + c.cca_hours, 0);
        const mandatedHours = 30; // College mandate
        const ccaProgress = {
            completed: totalCCAHours,
            mandated: mandatedHours,
            percentage: Math.min(Math.round((totalCCAHours / mandatedHours) * 100), 100)
        };

        // 4. Get pending logbooks and build action items
        const pendingLogbooks = await Logbook.find({
            student_id: req.user.id,
            status: 'Pending'
        }).populate('club_id', 'club_name').lean();

        const pendingAllocations = student.registered_clubs
            .filter(rc => rc.status === 'Pending')
            .map(rc => ({
                type: 'allocation',
                message: `Accept preference allocation for ${rc.club?.club_name || 'a club'}`,
                club_name: rc.club?.club_name || 'Unknown',
                date: rc._id?.getTimestamp?.() || new Date()
            }));

        // Clubs where no logbook submitted this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentLogbooks = await Logbook.find({
            student_id: req.user.id,
            date: { $gte: oneWeekAgo }
        }).lean();

        const clubsWithRecentLogbooks = new Set(recentLogbooks.map(l => l.club_id.toString()));

        const missingLogbooks = joinedClubs
            .filter(c => c._id && !clubsWithRecentLogbooks.has(c._id.toString()))
            .map(c => ({
                type: 'logbook',
                message: `Submit weekly logbook for ${c.club_name}`,
                club_name: c.club_name,
                priority: 'medium'
            }));

        const actionItems = [
            ...pendingAllocations.map(a => ({ ...a, priority: 'high' })),
            ...pendingLogbooks.map(l => ({
                type: 'pending_review',
                message: `Logbook pending review: "${l.activity_description}" for ${l.club_id?.club_name || 'Club'}`,
                club_name: l.club_id?.club_name || 'Unknown',
                priority: 'low',
                date: l.date
            })),
            ...missingLogbooks
        ];

        // 5. Get active notices from admin
        const notices = await Notice.find({ is_active: true })
            .populate('posted_by', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return res.json({
            success: true,
            dashboard: {
                joinedClubs,
                ccaProgress,
                actionItems,
                notices
            }
        });
    } catch (err) {
        console.error('[STUDENT DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
