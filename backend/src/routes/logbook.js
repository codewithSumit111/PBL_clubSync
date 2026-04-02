const express = require('express');
const router = express.Router();
const Logbook = require('../models/Logbook');
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');

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

        // Verify the student is actually in this club and Approved
        const studentRecord = await Student.findById(req.user.id);
        const membership = studentRecord.registered_clubs.find(
            rc => rc.club.toString() === club_id.toString() && rc.status === 'Approved'
        );

        if (!membership) {
            console.warn(`[LOGBOOK REJECT] Student ${req.user.id} attempted to submit for unauthorized club ${club_id}`);
            return res.status(403).json({ success: false, message: 'You are not an approved member of this club' });
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
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const logbooks = await Logbook.find({ club_id: req.user.id }).populate('student_id', 'name roll_no department');
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
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Only clubs can approve/reject logbooks' });
        }

        const { status, rejection_reason } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const logbook = await Logbook.findById(req.params.id);

        if (!logbook) {
            return res.status(404).json({ success: false, message: 'Logbook not found' });
        }

        // Verify the logbook belongs to this club
        if (logbook.club_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        logbook.status = status;
        if (status === 'Rejected') {
            logbook.rejection_reason = rejection_reason || 'No reason provided';
        }

        await logbook.save();

        // If approved, update student's total hours for this club
        if (status === 'Approved') {
            const Student = require('../models/Student');
            const student = await Student.findById(logbook.student_id);
            if (student) {
                const clubEntry = student.registered_clubs.find(
                    rc => rc.club.toString() === logbook.club_id.toString()
                );
                if (clubEntry) {
                    clubEntry.cca_hours = (clubEntry.cca_hours || 0) + (logbook.hours || 0);
                    await student.save();
                }
            }
        }
        res.json({ success: true, logbook });

    } catch (err) {
        console.error('Error updating logbook status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
