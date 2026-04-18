const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Logbook = require('../models/Logbook');
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');
const {
    resolveClubIdForAction,
    canManageClubAction,
} = require('../middleware/clubCouncilAuth');

// @route   POST /api/logbooks
// @desc    Submit a new logbook entry (Student only)
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can submit logbooks' });
        }

        const { club_id, activity_description, date, hours, report_file } = req.body;

        // Validation
        if (!club_id || !activity_description || !date || hours === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Validate club_id is valid ObjectId before using
        if (!club_id || !mongoose.Types.ObjectId.isValid(club_id)) {
            return res.status(400).json({ success: false, message: 'Invalid club ID' });
        }

        // Verify the student is actually in this club and Approved
        const studentRecord = await Student.findById(req.user.id);
        const membership = studentRecord.registered_clubs.find(
            rc => rc.club.toString() === club_id.toString() && rc.status === 'Approved'
        );

        if (!membership) {
            console.warn(`[LOGBOOK REJECT] Student ${req.user.id} attempted to submit for unauthorized club ${club_id}`);
            return res.status(403).json({ success: false, message: 'You are not an approved member of this club' });
        }

        // ⭐ NEW: For 1st year students, enforce primary club restriction
        if (studentRecord.year === 1) {
            if (!studentRecord.primary_club_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You must set your primary club first before submitting logbooks',
                    needsPrimaryClub: true
                });
            }

            if (studentRecord.primary_club_id.toString() !== club_id.toString()) {
                console.warn(`[LOGBOOK PRIMARY CLUB VIOLATION] Student ${req.user.id} (1st year) tried to submit to ${club_id}, but primary is ${studentRecord.primary_club_id}`);
                return res.status(403).json({ 
                    success: false, 
                    message: `As a 1st year student, you can only submit logbooks to your primary club. Your primary club ID: ${studentRecord.primary_club_id}`,
                    primaryClubId: studentRecord.primary_club_id
                });
            }
        }

        const newLogbook = new Logbook({
            student_id: req.user.id,
            club_id,
            activity_description,
            date,
            hours,
            report_file: report_file || null
        });

        await newLogbook.save();
        console.log(`[LOGBOOK SUCCESS] New logbook created: Student ${req.user.id} -> Club ${club_id} (${hours}h)`);
        res.status(201).json({ success: true, logbook: newLogbook });

    } catch (err) {
        console.error('Error submitting logbook:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/logbooks/mine
// @desc    Get all logbooks for the logged-in student
router.get('/mine', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const logbooks = await Logbook.find({ student_id: req.user.id }).populate('club_id', 'club_name');
        res.json({ success: true, logbooks });
    } catch (err) {
        console.error('Error fetching student logbooks:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/logbooks/club
// @desc    Get all logbooks submitted to the logged in club
router.get('/club', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club' && req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const clubId = await resolveClubIdForAction(req);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        const canReview = await canManageClubAction(req, clubId, 'LOGBOOK_REVIEWER');
        if (!canReview) {
            return res.status(403).json({ success: false, message: 'Not authorized to review logbooks' });
        }

        const logbooks = await Logbook.find({ club_id: clubId }).populate('student_id', 'name roll_no department');
        res.json({ success: true, logbooks });
    } catch (err) {
        console.error('Error fetching club logbooks:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/logbooks/:id/status
// @desc    Update logbook status (Club only)
router.put('/:id/status', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club' && req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only clubs/coordinators can approve/reject logbooks' });
        }

        const { status, rejection_reason } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const logbook = await Logbook.findById(req.params.id);

        if (!logbook) {
            return res.status(404).json({ success: false, message: 'Logbook not found' });
        }

        const canReview = await canManageClubAction(req, logbook.club_id.toString(), 'LOGBOOK_REVIEWER');
        if (!canReview) {
            return res.status(403).json({ success: false, message: 'Not authorized to approve/reject this logbook' });
        }

        // Verify the logbook belongs to this club
        if (req.user.role === 'Club' && logbook.club_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        logbook.status = status;
        if (status === 'Rejected') {
            logbook.rejection_reason = rejection_reason || 'No reason provided';
        }

        // Handle CCA hours updates atomically using $inc to prevent race conditions
        if (status === 'Approved' && !logbook.hours_applied) {
            const result = await Student.updateOne(
                { _id: logbook.student_id, 'registered_clubs.club': logbook.club_id },
                { $inc: { 'registered_clubs.$.cca_hours': logbook.hours || 0 } }
            );
            if (result.modifiedCount > 0) {
                logbook.hours_applied = true;
            }
        } else if (status === 'Rejected' && logbook.hours_applied) {
            // Rollback: subtract previously added hours atomically
            const result = await Student.updateOne(
                { _id: logbook.student_id, 'registered_clubs.club': logbook.club_id },
                { $inc: { 'registered_clubs.$.cca_hours': -(logbook.hours || 0) } }
            );
            if (result.modifiedCount > 0) {
                logbook.hours_applied = false;
            }
        }

        await logbook.save();
        res.json({ success: true, logbook });

    } catch (err) {
        console.error('Error updating logbook status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
