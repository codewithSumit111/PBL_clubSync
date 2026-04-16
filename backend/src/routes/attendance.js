const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Club = require('../models/Club');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');
const { checkInLimiter, qrGenerationLimiter } = require('../middleware/rateLimiter');
const { generateAttendanceToken, verifyAttendanceToken } = require('../utils/attendanceQr');
const {
    resolveClubIdForAction,
    canManageClubAction,
} = require('../middleware/clubCouncilAuth');

// ============================================================================
// PRODUCTION WARNING - REMOVE BEFORE DEPLOYMENT
// This file contains no DEV-ONLY endpoints.
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
        if (req.user.role !== 'Club' && req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only clubs/coordinators can generate event QR codes' });
        }

        const clubId = await resolveClubIdForAction(req);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        const canGenerateQR = await canManageClubAction(req, clubId, 'ATTENDANCE_MANAGER');
        if (!canGenerateQR) {
            return res.status(403).json({ success: false, message: 'Not authorized to generate QR for this club' });
        }

        const club = await Club.findById(clubId).select('club_name events');
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
        if (!['Club', 'Admin', 'Student'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const clubId = req.user.role === 'Admin'
            ? req.query.clubId
            : await resolveClubIdForAction(req);
        if (!clubId || !mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing club ID' });
        }

        if (req.user.role === 'Student') {
            const canViewAttendance = await canManageClubAction(req, clubId, 'ATTENDANCE_MANAGER');
            if (!canViewAttendance) {
                return res.status(403).json({ success: false, message: 'Not authorized to view attendance for this club' });
            }
        }

        const club = await Club.findById(clubId).select('club_name events');
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

        if (String(payload.eventId) !== String(req.params.eventId)) {
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
            const opensAtIST = new Date(event.check_in.opens_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            return res.status(400).json({ success: false, message: `Check-in opens at ${opensAtIST} IST (5-minute early arrival allowed)` });
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

        // Atomic update to prevent race conditions - use $addToSet
        let eventUpdated = false;
        try {
            const updateResult = await Club.updateOne(
                { _id: club._id, 'events._id': event._id },
                { $addToSet: { 'events.$.attendees': student._id } }
            );
            eventUpdated = updateResult.modifiedCount > 0;
        } catch (err) {
            console.error('Error updating event attendees:', err);
            throw err;
        }

        try {
            // Atomic $inc to prevent race conditions on concurrent check-ins
            await Student.updateOne(
                { _id: student._id, 'registered_clubs.club': club._id },
                { $inc: { 'registered_clubs.$.cca_hours': Number(event.cca_hours || 0) } }
            );
        } catch (err) {
            if (eventUpdated) {
                // Rollback: remove the attendee we just added
                await Club.updateOne(
                    { _id: club._id, 'events._id': event._id },
                    { $pull: { 'events.$.attendees': student._id } }
                );
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
                // cca_hours omitted - fetch from /api/students/me for fresh data
            },
        });
    } catch (err) {
        console.error('Error checking in attendance:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/clubs/event-analytics
// @desc    Get aggregated event analytics for the logged-in club
router.get('/clubs/event-analytics', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Only clubs can access event analytics' });
        }

        const club = await Club.findById(req.user.id).select('club_name events').lean();
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        const events = club.events || [];
        const totalEvents = events.length;

        // Get all attendance records for this club
        const allAttendance = await Attendance.find({ club_id: club._id }).lean();
        const totalAttendance = allAttendance.length;
        const totalCCAHoursAwarded = allAttendance.reduce((sum, a) => sum + (a.cca_hours_awarded || 0), 0);

        // Monthly event count + attendance (last 12 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const monthStart = new Date(y, m, 1);
            const monthEnd = new Date(y, m + 1, 0, 23, 59, 59);

            const monthEvents = events.filter(e => {
                const ed = new Date(e.date);
                return ed >= monthStart && ed <= monthEnd;
            });

            const monthAttendance = allAttendance.filter(a => {
                const ad = new Date(a.checked_in_at);
                return ad >= monthStart && ad <= monthEnd;
            });

            monthlyData.push({
                name: `${monthNames[m]} ${String(y).slice(2)}`,
                month: m + 1,
                year: y,
                events: monthEvents.length,
                attendance: monthAttendance.length,
                ccaHours: monthAttendance.reduce((s, a) => s + (a.cca_hours_awarded || 0), 0),
            });
        }

        // Yearly trend
        const yearSet = new Set();
        events.forEach(e => yearSet.add(new Date(e.date).getFullYear()));
        allAttendance.forEach(a => yearSet.add(new Date(a.checked_in_at).getFullYear()));
        const years = Array.from(yearSet).sort();
        const yearlyData = years.map(yr => {
            const yrEvents = events.filter(e => new Date(e.date).getFullYear() === yr);
            const yrAtt = allAttendance.filter(a => new Date(a.checked_in_at).getFullYear() === yr);
            return {
                year: yr,
                events: yrEvents.length,
                attendance: yrAtt.length,
                ccaHours: yrAtt.reduce((s, a) => s + (a.cca_hours_awarded || 0), 0),
            };
        });

        // Per-event breakdown (for pie chart and table)
        const perEvent = events.map(e => {
            const eventAtt = allAttendance.filter(a => String(a.event_id) === String(e._id));
            return {
                _id: e._id,
                title: e.title,
                date: e.date,
                time: e.time || '',
                venue: e.venue || '',
                cca_hours: e.cca_hours || 0,
                attendanceCount: eventAtt.length,
                ccaHoursAwarded: eventAtt.reduce((s, a) => s + (a.cca_hours_awarded || 0), 0),
            };
        }).sort((a, b) => b.attendanceCount - a.attendanceCount);

        // Top 5 for pie chart
        const topEvents = perEvent.slice(0, 5);
        const othersCount = perEvent.slice(5).reduce((s, e) => s + e.attendanceCount, 0);
        const participationDistribution = [
            ...topEvents.map(e => ({ name: e.title, value: e.attendanceCount })),
        ];
        if (othersCount > 0) {
            participationDistribution.push({ name: 'Others', value: othersCount });
        }

        res.json({
            success: true,
            analytics: {
                totalEvents,
                totalAttendance,
                avgAttendance: totalEvents > 0 ? parseFloat((totalAttendance / totalEvents).toFixed(1)) : 0,
                totalCCAHoursAwarded,
                monthlyData,
                yearlyData,
                perEvent,
                participationDistribution,
            },
        });
    } catch (err) {
        console.error('Error fetching event analytics:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/clubs/event-report
// @desc    Get detailed event data for report generation (single, monthly, yearly)
router.get('/clubs/event-report', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Only clubs can generate event reports' });
        }

        const club = await Club.findById(req.user.id).select('club_name events').lean();
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }

        const { type, eventId, month, year } = req.query;

        let targetEvents = [];
        let reportTitle = '';

        if (type === 'single') {
            if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required for single event report' });
            const event = (club.events || []).find(e => String(e._id) === String(eventId));
            if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
            targetEvents = [event];
            reportTitle = `Event Report: ${event.title}`;
        } else if (type === 'monthly') {
            if (!month || !year) return res.status(400).json({ success: false, message: 'month and year are required' });
            const m = parseInt(month) - 1;
            const y = parseInt(year);
            const monthStart = new Date(y, m, 1);
            const monthEnd = new Date(y, m + 1, 0, 23, 59, 59);
            targetEvents = (club.events || []).filter(e => {
                const ed = new Date(e.date);
                return ed >= monthStart && ed <= monthEnd;
            });
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            reportTitle = `Monthly Report: ${monthNames[m]} ${y}`;
        } else if (type === 'yearly') {
            if (!year) return res.status(400).json({ success: false, message: 'year is required' });
            const y = parseInt(year);
            targetEvents = (club.events || []).filter(e => new Date(e.date).getFullYear() === y);
            reportTitle = `Yearly Report: ${y}`;
        } else {
            return res.status(400).json({ success: false, message: 'type must be single, monthly, or yearly' });
        }

        // Fetch attendance for all target events
        const eventIds = targetEvents.map(e => e._id);
        const attendance = await Attendance.find({
            club_id: club._id,
            event_id: { $in: eventIds },
        })
            .populate('student_id', 'name roll_no department year')
            .sort({ checked_in_at: -1 })
            .lean();

        // Build per-event data with attendees
        const eventsWithAttendees = targetEvents.map(event => {
            const eventAtt = attendance.filter(a => String(a.event_id) === String(event._id));
            return {
                _id: event._id,
                title: event.title,
                description: event.description || '',
                date: event.date,
                time: event.time || '',
                venue: event.venue || '',
                cca_hours: event.cca_hours || 0,
                attendanceCount: eventAtt.length,
                attendees: eventAtt.map(a => ({
                    name: a.student_id?.name || a.student_name,
                    roll_no: a.student_id?.roll_no || a.student_roll_no,
                    department: a.student_id?.department || '',
                    cca_hours_awarded: a.cca_hours_awarded,
                    checked_in_at: a.checked_in_at,
                })),
            };
        });

        res.json({
            success: true,
            report: {
                title: reportTitle,
                clubName: club.club_name,
                generatedAt: new Date().toISOString(),
                totalEvents: eventsWithAttendees.length,
                totalAttendance: attendance.length,
                totalCCAHours: attendance.reduce((s, a) => s + (a.cca_hours_awarded || 0), 0),
                events: eventsWithAttendees,
            },
        });
    } catch (err) {
        console.error('Error generating event report:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;