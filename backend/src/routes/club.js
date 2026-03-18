const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────
// PUBLIC / STUDENT ROUTES
// ─────────────────────────────────────────────────────────────────

// GET /api/clubs — Get all clubs
router.get('/', async (req, res) => {
    try {
        const clubs = await Club.find().select('club_name description faculty_coordinators events analytics official_website email');
        res.json({ success: true, clubs });
    } catch (err) {
        console.error('Error fetching clubs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/clubs/register/:club_id — Student registers for a club
router.post('/register/:club_id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can register for clubs' });
        }
        const club = await Club.findById(req.params.club_id);
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        const student = await Student.findById(req.user.id);
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

// PUT /api/clubs/applications/:student_id — Club approves/rejects a student
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
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const application = student.registered_clubs.find(
            rc => rc.club.toString() === req.user.id
        );
        if (!application) {
            return res.status(404).json({ success: false, message: 'No application found for this student' });
        }

        application.status = status;
        await student.save();

        if (status === 'Approved') {
            const club = await Club.findById(req.user.id);
            const alreadyInList = club.registered_students.some(
                id => id.toString() === student._id.toString()
            );
            if (!alreadyInList) {
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

// ─────────────────────────────────────────────────────────────────
// CLUB DASHBOARD ROUTES  (Club role only)
// ─────────────────────────────────────────────────────────────────

// GET /api/clubs/members — All approved members for this club
router.get('/members', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Find students who have Approved status for this club
        const students = await Student.find({
            registered_clubs: { $elemMatch: { club: req.user.id, status: 'Approved' } }
        }).select('name roll_no department year email registered_clubs');

        const members = students.map(s => {
            const entry = s.registered_clubs.find(rc => rc.club.toString() === req.user.id);
            return {
                _id: s._id,
                name: s.name,
                roll_no: s.roll_no,
                department: s.department,
                year: s.year,
                email: s.email,
                cca_hours: entry ? entry.cca_hours || 0 : 0,
                cca_marks: entry && entry.cca_marks ? entry.cca_marks.total || 0 : 0,
                rubric_marks: entry ? {
                    participation: entry.cca_marks?.participation || 0,
                    leadership: entry.cca_marks?.leadership || 0,
                    discipline: entry.cca_marks?.discipline || 0,
                    skill_development: entry.cca_marks?.skill_development || 0,
                    impact: entry.cca_marks?.impact || 0,
                } : {},
                logbooks_pending: 0,
            };
        });

        res.json({ success: true, members });
    } catch (err) {
        console.error('Error fetching club members:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/clubs/pending — All pending applications for this club
router.get('/pending', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const students = await Student.find({
            registered_clubs: { $elemMatch: { club: req.user.id, status: 'Pending' } }
        }).select('name roll_no department year email registered_clubs');

        const pending = students.map(s => {
            const entry = s.registered_clubs.find(rc => rc.club.toString() === req.user.id);
            return {
                _id: s._id,
                name: s.name,
                roll_no: s.roll_no,
                department: s.department,
                year: s.year,
                email: s.email,
                preference_order: entry ? entry.preference_order : null,
            };
        });

        res.json({ success: true, students: pending });
    } catch (err) {
        console.error('Error fetching pending applications:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/clubs/students/:student_id/cca — Update CCA marks for a student
router.put('/students/:student_id/cca', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { cca_hours, rubric_marks } = req.body;
        const student = await Student.findById(req.params.student_id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const entry = student.registered_clubs.find(
            rc => rc.club.toString() === req.user.id && rc.status === 'Approved'
        );
        if (!entry) {
            return res.status(403).json({ success: false, message: 'Student is not an approved member of your club' });
        }

        if (cca_hours !== undefined) entry.cca_hours = Math.max(0, cca_hours);

        if (rubric_marks) {
            entry.cca_marks.participation = Math.min(5, Math.max(0, rubric_marks.participation || 0));
            entry.cca_marks.leadership = Math.min(5, Math.max(0, rubric_marks.leadership || 0));
            entry.cca_marks.discipline = Math.min(5, Math.max(0, rubric_marks.discipline || 0));
            entry.cca_marks.skill_development = Math.min(5, Math.max(0, rubric_marks.skill_development || 0));
            entry.cca_marks.impact = Math.min(5, Math.max(0, rubric_marks.impact || 0));
            entry.cca_marks.total =
                entry.cca_marks.participation +
                entry.cca_marks.leadership +
                entry.cca_marks.discipline +
                entry.cca_marks.skill_development +
                entry.cca_marks.impact;
        }

        await student.save();

        res.json({
            success: true,
            message: 'CCA marks updated successfully',
            student: { _id: student._id, name: student.name, cca_hours: entry.cca_hours, cca_marks: entry.cca_marks.total }
        });
    } catch (err) {
        console.error('Error updating CCA marks:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/clubs/events — Create a new event
router.post('/events', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { title, description, date, time, venue } = req.body;
        if (!title || !date) {
            return res.status(400).json({ success: false, message: 'Title and date are required' });
        }

        const club = await Club.findById(req.user.id);
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        club.events.push({ title, description: description || '', date: new Date(date), attendees: [] });
        await club.save();

        const newEvent = club.events[club.events.length - 1];
        res.status(201).json({ success: true, event: { ...newEvent.toObject(), time, venue } });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/clubs/events — Get all events for this club
router.get('/events', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const club = await Club.findById(req.user.id).select('events');
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        const sorted = [...club.events].sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ success: true, events: sorted });
    } catch (err) {
        console.error('Error fetching club events:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
