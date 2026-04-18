// backend/src/routes/student.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
                _id: rc.club?._id || rc.club,
                club_name: rc.club?.club_name || 'Unknown Club',
                description: rc.club?.description || '',
                department: rc.club?.department || '',
                membership_role: rc.membership_role || 'member',
                designation: rc.designation || 'Member Only',
                coordinator_scopes: rc.coordinator_scopes || [],
                cca_hours: rc.cca_hours || 0,
                cca_marks: rc.cca_marks || {}
            }));

        // 3. Calculate CCA progress metrics
        // ⭐ For 1st year students: only count hours from PRIMARY club
        let totalCCAHours = 0;
        let totalCCAMarks = 0;

        if (student.year === 1 && student.primary_club_id) {
            // 1st year: Only aggregate hours from primary club
            const primaryClub = joinedClubs.find(c => c._id.toString() === student.primary_club_id.toString());
            if (primaryClub) {
                totalCCAHours = primaryClub.cca_hours || 0;
                totalCCAMarks = primaryClub.cca_marks?.total || 0;
            }
        } else {
            // Other years or no primary club set: aggregate from all clubs
            totalCCAHours = joinedClubs.reduce((sum, c) => sum + (c.cca_hours || 0), 0);
            totalCCAMarks = joinedClubs.reduce((sum, c) => sum + (c.cca_marks?.total || 0), 0);
        }

        const mandatedHours = 30; // College mandate

        const ccaProgress = {
            completed: totalCCAHours,
            totalMarks: totalCCAMarks,
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
                date: (rc._id && typeof rc._id.getTimestamp === 'function') 
                    ? rc._id.getTimestamp() 
                    : new Date()
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

        // ⭐ For 1st year students: check if primary club is set
        const primaryClubWarning = [];
        if (student.year === 1 && !student.primary_club_id && joinedClubs.length > 0) {
            primaryClubWarning.push({
                type: 'primary_club_required',
                message: 'Select your primary club to start submitting logbooks and earning CCA hours',
                club_name: 'System',
                priority: 'urgent'
            });
        }

        const actionItems = [
            ...primaryClubWarning,
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
                notices,
                // ⭐ Include primary club info for frontend
                year: student.year,
                primaryClubId: student.primary_club_id,
                primaryClubSetDate: student.primary_club_set_date,
                isPrimaryClubRequired: student.year === 1
            }
        });
    } catch (err) {
        console.error('[STUDENT DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/students/set-primary-club
// @desc    Set primary club for CCA hours (1st year students only, once per semester)
router.post('/set-primary-club', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can set primary club' });
        }

        const { club_id } = req.body;

        if (!club_id || !mongoose.Types.ObjectId.isValid(club_id)) {
            return res.status(400).json({ success: false, message: 'Invalid club ID' });
        }

        const student = await Student.findById(req.user.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Only 1st year students need to set primary club
        if (student.year !== 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Primary club requirement applies only to 1st year students' 
            });
        }

        // Check if student is approved member of this club
        const isMember = student.registered_clubs.some(
            rc => rc.club.toString() === club_id.toString() && rc.status === 'Approved'
        );

        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be an approved member of this club first' 
            });
        }

        // Check if primary club was already set THIS SEMESTER
        // Assuming semester resets every 6 months (Jan-Jun, Jul-Dec)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        if (student.primary_club_set_date) {
            const lastSetDate = new Date(student.primary_club_set_date);
            const lastSetMonth = lastSetDate.getMonth();
            const lastSetYear = lastSetDate.getFullYear();
            
            // Check if same semester (both in Jan-Jun or both in Jul-Dec)
            const isSameSemester = 
                (lastSetYear === currentYear) &&
                ((currentMonth < 6 && lastSetMonth < 6) || (currentMonth >= 6 && lastSetMonth >= 6));
            
            if (isSameSemester) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'You have already set your primary club this semester. You can change it next semester.',
                    nextChangeDate: new Date(lastSetYear, lastSetMonth < 6 ? 6 : 12, 1)
                });
            }
        }

        // Set primary club
        student.primary_club_id = club_id;
        student.primary_club_set_date = currentDate;
        await student.save();

        res.json({ 
            success: true, 
            message: 'Primary club set successfully',
            primary_club_id: club_id
        });

    } catch (err) {
        console.error('Error setting primary club:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
