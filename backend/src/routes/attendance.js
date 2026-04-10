const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');
const { checkInLimiter, qrGenerationLimiter } = require('../middleware/rateLimiter');
const { generateAttendanceToken, verifyAttendanceToken } = require('../utils/attendanceQr');

// ============================================================================
// PRODUCTION WARNING - REMOVE BEFORE DEPLOYMENT
// This file contains a DEV-ONLY endpoint at lines 316-368 (/api/dev/fix-event-time)
// that allows unauthorized modification of event check-in times.
// DELETE lines 316-368 before production deployment!
// ============================================================================

function getEventById(club, eventId) {
    return club?.events?.id(eventId) || null;
}

function getMembershipEntry(student, clubId) {
    return student?.registered_clubs?.find(rc => rc.club.toString() === clubId.toString() && rc.status === 'Approved') || null;
}

// @route   POST /api/clubs/events/:eventId/qr
// @desc    Generate a signed QR token for a club event
router.post('/clubs/events/:eventId/qr', protect, qrGenerationLimiter, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Only clubs can generate event QR codes' });
        }

        const club = await Club.findById(req.user.id).select('club_name events');
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        const event = getEventById(club, req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const token = generateAttendanceToken({
            clubId: club._id,
            eventId: event._id,
            title: event.title,
            date: event.date,
            time: event.time,
            venue: event.venue,
            ccaHours: event.cca_hours || 0,
            opensAt: event.check_in?.opens_at,
            closesAt: event.check_in?.closes_at,
        });

        res.json({
            success: true,
            qrToken: token,
            event: {
                _id: event._id,
                club_id: club._id,
                club_name: club.club_name,
                title: event.title,
                date: event.date,
                time: event.time || '',
                venue: event.venue || '',
                cca_hours: event.cca_hours || 0,
                check_in: event.check_in || null,
            }
        });
    } catch (err) {
        console.error('Error generating event QR token:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/clubs/events/:eventId/attendance
// @desc    Get attendance list for a club event
router.get('/clubs/events/:eventId/attendance', protect, async (req, res) => {
    try {
        if (!['Club', 'Admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const club = await Club.findById(req.user.role === 'Club' ? req.user.id : req.query.clubId).select('club_name events');
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        const event = getEventById(club, req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const attendance = await Attendance.find({
            club_id: club._id,
            event_id: event._id,
        })
            .populate('student_id', 'name roll_no department year email')
            .sort({ checked_in_at: -1 })
            .lean();

        res.json({
            success: true,
            event: {
                _id: event._id,
                title: event.title,
                date: event.date,
                time: event.time || '',
                venue: event.venue || '',
                cca_hours: event.cca_hours || 0,
            },
            attendance,
            count: attendance.length,
        });
    } catch (err) {
        console.error('Error fetching event attendance:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/clubs/events/:eventId/check-in
// @desc    Student self check-in with signed QR token
router.post('/clubs/events/:eventId/check-in', protect, checkInLimiter, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can check in' });
        }

        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'QR token is required' });
        }

        // Verify the QR token — catch verification errors separately as 400s
        let payload;
        try {
            payload = verifyAttendanceToken(token);
        } catch (verifyErr) {
            console.error('[CHECK-IN TOKEN ERROR]', verifyErr.message);
            return res.status(400).json({ success: false, message: verifyErr.message || 'Invalid QR token' });
        }

        if (payload.eventId !== req.params.eventId) {
            return res.status(400).json({ success: false, message: 'QR token does not match this event' });
        }

        const club = await Club.findById(payload.clubId).select('club_name events');
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        const event = getEventById(club, payload.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check for stale token - CCA hours changed
        if (Number(event.cca_hours || 0) !== Number(payload.ccaHours || 0)) {
            return res.status(400).json({ success: false, message: 'QR token is stale: CCA hours were updated. Ask the club to regenerate the QR.' });
        }

        // Check for stale token - Event times changed
        const currentOpensAt = event.check_in?.opens_at ? new Date(event.check_in.opens_at).toISOString() : null;
        const currentClosesAt = event.check_in?.closes_at ? new Date(event.check_in.closes_at).toISOString() : null;
        const tokenOpensAt = payload.opensAt || null;
        const tokenClosesAt = payload.closesAt || null;

        if (currentOpensAt !== tokenOpensAt || currentClosesAt !== tokenClosesAt) {
            return res.status(400).json({ success: false, message: 'QR token is stale: check-in window was updated. Ask the club to regenerate the QR.' });
        }

        // Use event's current check-in window settings (already validated against token)
        const now = Date.now();
        const opensAt = event.check_in?.opens_at ? new Date(event.check_in.opens_at).getTime() : null;
        const closesAt = event.check_in?.closes_at ? new Date(event.check_in.closes_at).getTime() : null;

        if (opensAt && now < opensAt - 5 * 60 * 1000) {
            const opensAtLocal = new Date(event.check_in.opens_at).toLocaleString();
            return res.status(400).json({ success: false, message: `Check-in opens at ${opensAtLocal} (5-minute early arrival allowed)` });
        }

        if (closesAt && now > closesAt + 10 * 60 * 1000) {
            return res.status(400).json({ success: false, message: 'Check-in has closed for this event (10-minute grace period exceeded)' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const membership = getMembershipEntry(student, club._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: 'You are not an approved member of this club' });
        }

        const tokenParts = token.split('.');
        const qrSignature = tokenParts.length === 2 ? tokenParts[1] : token.substring(0, 64);

        // Use atomic findOneAndUpdate with upsert to prevent race conditions
        // This ensures only one attendance record is created even with concurrent requests
        let attendance;
        let alreadyCheckedIn = false;

        try {
            const result = await Attendance.findOneAndUpdate(
                {
                    club_id: club._id,
                    event_id: event._id,
                    student_id: student._id,
                },
                {
                    $setOnInsert: {
                        club_id: club._id,
                        event_id: event._id,
                        event_title: event.title,
                        student_id: student._id,
                        student_name: student.name,
                        student_roll_no: student.roll_no,
                        cca_hours_awarded: Number(event.cca_hours || 0),
                        checked_in_at: new Date(),
                        qr_signature: qrSignature,
                        // NOTE: For req.ip to work correctly behind proxies, Express must be configured with:
                        // app.set('trust proxy', true) or app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])
                        ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
                        user_agent: req.get('user-agent') || '',
                    },
                },
                {
                    upsert: true,
                    new: true,
                    lean: false,
                }
            );

            attendance = result;

            // Check if this was an existing record (not newly inserted)
            // by comparing timestamps - if checked_in_at is significantly older than now,
            // it was an existing record
            const checkInTime = new Date(result.checked_in_at).getTime();
            const now = Date.now();
            const timeDiff = now - checkInTime;

            // If the record was created more than 5 seconds ago, treat as existing
            if (timeDiff > 5000) {
                alreadyCheckedIn = true;
            }
        } catch (err) {
            if (err.code === 11000) {
                // Another request won the race - fetch the existing record
                attendance = await Attendance.findOne({
                    club_id: club._id,
                    event_id: event._id,
                    student_id: student._id,
                });
                alreadyCheckedIn = true;
            } else {
                throw err;
            }
        }

        if (alreadyCheckedIn) {
            return res.json({
                success: true,
                alreadyCheckedIn: true,
                message: 'You have already checked in for this event',
                attendance: attendance.toObject ? attendance.toObject() : attendance,
            });
        }

        let eventUpdated = false;
        if (!event.attendees.some(attendeeId => attendeeId.toString() === student._id.toString())) {
            event.attendees.push(student._id);
            await club.save();
            eventUpdated = true;
        }

        try {
            membership.cca_hours = (membership.cca_hours || 0) + Number(event.cca_hours || 0);
            await student.save();
        } catch (err) {
            if (eventUpdated) {
                event.attendees = event.attendees.filter(attendeeId => attendeeId.toString() !== student._id.toString());
                await club.save();
            }
            await Attendance.findByIdAndDelete(attendance._id);
            throw err;
        }

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            attendance: {
                _id: attendance._id,
                event_title: attendance.event_title,
                student_name: attendance.student_name,
                student_roll_no: attendance.student_roll_no,
                cca_hours_awarded: attendance.cca_hours_awarded,
                checked_in_at: attendance.checked_in_at,
            },
            club: {
                _id: club._id,
                club_name: club.club_name,
            },
            event: {
                _id: event._id,
                title: event.title,
                cca_hours: event.cca_hours || 0,
            },
            student: {
                _id: student._id,
                name: student.name,
                roll_no: student.roll_no,
                cca_hours: membership.cca_hours,
            },
        });
    } catch (err) {
        console.error('Error checking in attendance:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/dev/fix-event-time
// @desc    TEMPORARY: Fix test event check-in times (DEV ONLY)
router.post('/dev/fix-event-time', async (req, res) => {
    try {
        const { eventId } = req.body;
        
        if (!eventId) {
            // Find first event and fix it
            const club = await Club.findOne({ 'events.0': { $exists: true } });
            if (!club) {
                return res.status(404).json({ error: 'No events found. Create an event first.' });
            }
            
            const event = club.events[0];
            const newOpen = new Date(Date.now() - 2 * 60 * 1000); // 2 min ago
            const newClose = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
            
            event.check_in = event.check_in || {};
            event.check_in.opens_at = newOpen;
            event.check_in.closes_at = newClose;
            await club.save();
            
            return res.json({
                success: true,
                message: 'Event fixed!',
                event: {
                    id: event._id,
                    title: event.title,
                    opens_at: newOpen.toLocaleString(),
                    closes_at: newClose.toLocaleString()
                },
                nextStep: 'Go to Club Dashboard → Generate new QR → Scan it'
            });
        }
        
        // Fix specific event
        const club = await Club.findOne({ 'events._id': eventId });
        const event = club?.events.id(eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        event.check_in = event.check_in || {};
        event.check_in.opens_at = new Date(Date.now() - 2 * 60 * 1000);
        event.check_in.closes_at = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await club.save();
        
        res.json({ success: true, message: 'Event fixed! Regenerate QR now.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/students/attendance
// @desc    Get attendance history for the logged-in student
router.get('/students/attendance', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can access their attendance history' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const attendance = await Attendance.find({ student_id: student._id })
            .populate('club_id', 'club_name')
            .sort({ checked_in_at: -1 })
            .lean();

        const formattedAttendance = attendance.map(record => ({
            _id: record._id,
            event_title: record.event_title,
            club_name: record.club_id?.club_name || 'Unknown Club',
            cca_hours_awarded: record.cca_hours_awarded,
            checked_in_at: record.checked_in_at,
            checked_in_date: new Date(record.checked_in_at).toLocaleDateString('en-IN'),
            checked_in_time: new Date(record.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }));

        res.json({
            success: true,
            attendance: formattedAttendance,
            count: formattedAttendance.length,
            total_cca_hours: formattedAttendance.reduce((sum, record) => sum + (record.cca_hours_awarded || 0), 0),
        });
    } catch (err) {
        console.error('Error fetching student attendance history:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;