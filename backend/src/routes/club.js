const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');
const {
    COORDINATOR_SCOPES,
    MEMBERSHIP_ROLES,
    DEFAULT_DESIGNATION,
    DEFAULT_MEMBERSHIP_ROLE,
} = require('../utils/clubCouncil');
const {
    resolveClubIdForAction,
    canManageClubAction,
    ensureDefaultsOnApproval,
} = require('../middleware/clubCouncilAuth');

// IST offset: +5 hours 30 minutes
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function buildEventStart(dateValue, timeValue) {
    const eventDate = new Date(dateValue);

    if (!timeValue) {
        return eventDate;
    }

    const match = String(timeValue).match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) {
        return eventDate;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3]?.toUpperCase();

    if (meridiem === 'PM' && hours < 12) {
        hours += 12;
    }
    if (meridiem === 'AM' && hours === 12) {
        hours = 0;
    }

    // Set the time as IST then convert to UTC for storage
    // Use UTC methods to avoid server timezone dependency
    eventDate.setUTCHours(hours, minutes, 0, 0);
    // Subtract IST offset to convert IST → UTC
    return new Date(eventDate.getTime() - IST_OFFSET_MS);
}

// @route   GET /api/clubs
// @desc    Get all clubs with category, tagline, and member count
router.get('/', async (req, res) => {
    try {
        const clubs = await Club.find().select(
            'club_name description department category tagline faculty_coordinators events analytics official_website registered_students'
        );

        // Map to include member count
        const clubsWithCount = clubs.map(c => {
            const obj = c.toObject();
            obj.member_count = obj.registered_students ? obj.registered_students.length : 0;
            delete obj.registered_students; // don't leak student IDs
            return obj;
        });

        res.json({ success: true, clubs: clubsWithCount });
    } catch (err) {
        console.error('Error fetching clubs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC / STUDENT ROUTES
// ─────────────────────────────────────────────────────────────────

// @route   GET /api/public-clubs
// @desc    Simplified list of clubs for general display
router.get('/public', async (req, res) => {
    try {
        const clubs = await Club.find().select('club_name description faculty_coordinators events analytics official_website email');
        res.json({ success: true, clubs });
    } catch (err) {
        console.error('Error fetching clubs:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/clubs/intake-status
// @desc    Check if intake window is currently open
router.get('/intake-status', async (req, res) => {
    try {
        // Find any admin with an active intake window
        const admin = await Admin.findOne({ 'intake_window.is_active': true }).lean();

        if (!admin || !admin.intake_window) {
            return res.json({ success: true, is_open: false });
        }

        const now = new Date();
        const { start_date, end_date, max_preferences, is_active } = admin.intake_window;

        const isOpen = is_active &&
            (!start_date || now >= new Date(start_date)) &&
            (!end_date || now <= new Date(end_date));

        return res.json({
            success: true,
            is_open: isOpen,
            max_preferences: max_preferences || 3,
            start_date,
            end_date
        });
    } catch (err) {
        console.error('Error checking intake status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/clubs/preferences
// @desc    Student submits top-N club preferences
router.post('/preferences', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Only students can submit preferences' });
        }

        const { preferences } = req.body; // Array of club IDs in order: [1st, 2nd, 3rd]

        if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one club preference' });
        }

        if (preferences.length > 3) {
            return res.status(400).json({ success: false, message: 'You can select a maximum of 3 preferences' });
        }

        // Check for duplicates
        const unique = new Set(preferences);
        if (unique.size !== preferences.length) {
            return res.status(400).json({ success: false, message: 'Duplicate club selections are not allowed' });
        }

        // Verify all clubs exist
        const clubs = await Club.find({ _id: { $in: preferences } });
        if (clubs.length !== preferences.length) {
            return res.status(400).json({ success: false, message: 'One or more selected clubs do not exist' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Remove any existing pending preference applications
        student.registered_clubs = student.registered_clubs.filter(
            rc => rc.status !== 'Pending'
        );

        // Add new preferences
        preferences.forEach((clubId, index) => {
            student.registered_clubs.push({
                club: clubId,
                status: 'Pending',
                preference_order: index + 1
            });
        });

        await student.save();

        const clubNames = clubs.map(c => c.club_name);
        res.json({
            success: true,
            message: `Preferences submitted successfully! Your choices: ${clubNames.join(', ')}`,
            preferences: preferences.map((id, idx) => ({
                club_id: id,
                club_name: clubs.find(c => c._id.toString() === id)?.club_name,
                preference_order: idx + 1
            }))
        });
    } catch (err) {
        console.error('Error submitting preferences:', err);
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
            preference_order: preference_order || (student.registered_clubs.length + 1),
            appliedAt: new Date()
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
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const application = student.registered_clubs.find(
            rc => rc.club.toString() === req.user.id
        );
        if (!application) {
            return res.status(404).json({ success: false, message: 'No application found for this student' });
        }

        application.status = status;
        if (status === 'Approved') {
            ensureDefaultsOnApproval(application);
        } else if (status === 'Rejected') {
            application.membership_role = DEFAULT_MEMBERSHIP_ROLE;
            application.designation = DEFAULT_DESIGNATION;
            application.coordinator_scopes = [];
        }
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
        let clubId = req.user.id;
        if (req.user.role === 'Student') {
            clubId = req.query.club_id || req.query.clubId;
            if (!clubId) {
                return res.status(400).json({ success: false, message: 'club_id is required' });
            }

            const allowed = await canManageClubAction(req, clubId, 'CCA_MANAGER');
            const allowedAdmin = await canManageClubAction(req, clubId, 'MEMBER_ADMIN');
            if (!allowed && !allowedAdmin) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        } else if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const students = await Student.find({
            registered_clubs: { $elemMatch: { club: clubId, status: 'Approved' } }
        }).select('name roll_no department year email registered_clubs');

        const members = students.map(s => {
            const entry = s.registered_clubs.find(rc => rc.club.toString() === clubId.toString());
            return {
                _id: s._id,
                name: s.name,
                roll_no: s.roll_no,
                department: s.department,
                year: s.year,
                email: s.email,
                cca_hours: entry ? entry.cca_hours || 0 : 0,
                cca_marks: entry && entry.cca_marks ? entry.cca_marks.total || 0 : 0,
                membership_role: entry?.membership_role || DEFAULT_MEMBERSHIP_ROLE,
                designation: entry?.designation || DEFAULT_DESIGNATION,
                coordinator_scopes: entry?.coordinator_scopes || [],
                rubric_marks: entry ? {
                    participation: entry.cca_marks?.participation || 0,
                    leadership: entry.cca_marks?.leadership || 0,
                    discipline: entry.cca_marks?.discipline || 0,
                    skill_development: entry.cca_marks?.skill_development || 0,
                    impact: entry.cca_marks?.impact || 0,
                } : {},
            };
        });

        res.json({ success: true, members });
    } catch (err) {
        console.error('Error fetching club members:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/clubs/council-config — designation templates for this club
router.get('/council-config', protect, async (req, res) => {
    try {
        const clubId = req.user.role === 'Club' ? req.user.id : (req.query.club_id || req.query.clubId);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        if (req.user.role === 'Student') {
            const allowed = await canManageClubAction(req, clubId, 'MEMBER_ADMIN');
            if (!allowed) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        } else if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const club = await Club.findById(clubId).select('designation_templates');
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        res.json({
            success: true,
            designation_templates: club.designation_templates?.length
                ? club.designation_templates
                : [DEFAULT_DESIGNATION],
            scope_templates: COORDINATOR_SCOPES,
        });
    } catch (err) {
        console.error('Error fetching council config:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/clubs/council-config — update designation templates
router.put('/council-config', protect, async (req, res) => {
    try {
        const clubId = req.user.role === 'Club' ? req.user.id : (req.body?.club_id || req.query?.club_id);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        if (req.user.role === 'Student') {
            const allowed = await canManageClubAction(req, clubId, 'MEMBER_ADMIN');
            if (!allowed) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        } else if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { designation_templates } = req.body;
        if (!Array.isArray(designation_templates)) {
            return res.status(400).json({ success: false, message: 'designation_templates must be an array' });
        }

        const cleaned = [...new Set(
            designation_templates
                .map(d => String(d || '').trim())
                .filter(Boolean)
        )];

        if (!cleaned.includes(DEFAULT_DESIGNATION)) {
            cleaned.unshift(DEFAULT_DESIGNATION);
        }

        if (cleaned.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one designation is required' });
        }

        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        club.designation_templates = cleaned;
        await club.save();

        res.json({ success: true, message: 'Council designation templates updated', designation_templates: club.designation_templates });
    } catch (err) {
        console.error('Error updating council config:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/clubs/members/:student_id/council — assign member role/designation/scopes
router.put('/members/:student_id/council', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club' && req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const clubId = req.user.role === 'Club' ? req.user.id : (req.body?.club_id || req.query?.club_id);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        if (req.user.role === 'Student') {
            const allowed = await canManageClubAction(req, clubId, 'MEMBER_ADMIN');
            if (!allowed) {
                return res.status(403).json({ success: false, message: 'Only member admins can update council roles' });
            }
        }

        const { membership_role, designation, coordinator_scopes } = req.body;
        if (membership_role && !MEMBERSHIP_ROLES.includes(membership_role)) {
            return res.status(400).json({ success: false, message: 'Invalid membership_role' });
        }

        if (coordinator_scopes && !Array.isArray(coordinator_scopes)) {
            return res.status(400).json({ success: false, message: 'coordinator_scopes must be an array' });
        }

        const club = await Club.findById(clubId).select('designation_templates');
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        const student = await Student.findById(req.params.student_id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const entry = student.registered_clubs.find(
            rc => rc.club.toString() === clubId.toString() && rc.status === 'Approved'
        );
        if (!entry) {
            return res.status(400).json({ success: false, message: 'Student is not an approved member of this club' });
        }

        if (membership_role) {
            entry.membership_role = membership_role;
        }

        if (designation !== undefined) {
            const normalizedDesignation = String(designation || '').trim() || DEFAULT_DESIGNATION;
            const allowedDesignations = club.designation_templates?.length
                ? club.designation_templates
                : [DEFAULT_DESIGNATION];

            if (!allowedDesignations.includes(normalizedDesignation)) {
                return res.status(400).json({ success: false, message: 'Designation is not in this club\'s template list' });
            }
            entry.designation = normalizedDesignation;
        }

        if (coordinator_scopes !== undefined) {
            const cleanedScopes = [...new Set(coordinator_scopes)]
                .filter(scope => COORDINATOR_SCOPES.includes(scope));
            entry.coordinator_scopes = cleanedScopes;
        }

        if (entry.membership_role !== 'coordinator') {
            entry.coordinator_scopes = [];
        }

        await student.save();

        res.json({
            success: true,
            message: 'Council role updated successfully',
            member: {
                student_id: student._id,
                membership_role: entry.membership_role,
                designation: entry.designation,
                coordinator_scopes: entry.coordinator_scopes,
            },
        });
    } catch (err) {
        console.error('Error updating council role:', err);
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
                appliedAt: entry ? entry.appliedAt : null
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
        const clubId = await resolveClubIdForAction(req);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        const canManageCCA = await canManageClubAction(req, clubId, 'CCA_MANAGER');
        if (!canManageCCA) {
            return res.status(403).json({ success: false, message: 'Not authorized to update CCA stats' });
        }

        const { cca_hours, rubric_marks } = req.body;
        const student = await Student.findById(req.params.student_id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const entry = student.registered_clubs.find(
            rc => rc.club.toString() === clubId.toString() && rc.status === 'Approved'
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
        const clubId = await resolveClubIdForAction(req);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        const canManageEvents = await canManageClubAction(req, clubId, 'EVENT_MANAGER');
        if (!canManageEvents) {
            return res.status(403).json({ success: false, message: 'Not authorized to create events' });
        }

        const { title, description, date, time, venue, cca_hours, check_in_opens_at, check_in_closes_at } = req.body;
        if (!title || !date) {
            return res.status(400).json({ success: false, message: 'Title and date are required' });
        }

        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        const eventStart = buildEventStart(date, time);
        const defaultCheckInOpensAt = new Date(eventStart.getTime() - 30 * 60 * 1000);
        const defaultCheckInClosesAt = new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);

        const checkInOpensAt = check_in_opens_at
            ? buildEventStart(date, check_in_opens_at)
            : defaultCheckInOpensAt;
        const checkInClosesAt = check_in_closes_at
            ? buildEventStart(date, check_in_closes_at)
            : defaultCheckInClosesAt;

        if (checkInClosesAt <= checkInOpensAt) {
            return res.status(400).json({ success: false, message: 'Check-in close time must be after open time' });
        }

        club.events.push({
            title,
            description: description || '',
            date: new Date(date),
            time: time || '',
            venue: venue || '',
            cca_hours: Number(cca_hours || 0),
            check_in: {
                opens_at: checkInOpensAt,
                closes_at: checkInClosesAt,
            },
            attendees: []
        });
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
        const clubId = await resolveClubIdForAction(req);
        if (!clubId) {
            return res.status(400).json({ success: false, message: 'club_id is required' });
        }

        const canViewEvents = await canManageClubAction(req, clubId, 'EVENT_MANAGER');
        if (!canViewEvents) {
            return res.status(403).json({ success: false, message: 'Not authorized to view manage events' });
        }

        const club = await Club.findById(clubId).select('events');
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        const sorted = [...club.events].sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ success: true, events: sorted });
    } catch (err) {
        console.error('Error fetching club events:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// CLUB DASHBOARD DATA ROUTES
// ─────────────────────────────────────────────────────────────────

// GET /api/clubs/stats — Club-specific summary stats and engagement data
router.get('/stats', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const club = await Club.findById(req.user.id).lean();
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

        const [pendingCount, allMembers] = await Promise.all([
            Student.countDocuments({ registered_clubs: { $elemMatch: { club: req.user.id, status: 'Pending' } } }),
            Student.find({ registered_clubs: { $elemMatch: { club: req.user.id, status: 'Approved' } } }).select('registered_clubs').lean(),
        ]);

        let totalHours = 0;
        allMembers.forEach(s => {
            const entry = s.registered_clubs.find(rc => rc.club.toString() === req.user.id);
            totalHours += (entry?.cca_hours || 0);
        });

        const activeEvents = club.events ? club.events.filter(e => new Date(e.date) >= new Date()).length : 0;

        // Engagement data for graphs (last 6 months)
        const Logbook = require('../models/Logbook');
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        const logbooks = await Logbook.find({ 
            club_id: req.user.id, 
            status: 'Approved',
            date: { $gte: sixMonthsAgo } 
        }).select('date hours').lean();

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            
            const monthLogs = logbooks.filter(l => {
                const ld = new Date(l.date);
                return ld.getMonth() === m && ld.getFullYear() === y;
            });

            monthlyData.push({
                name: monthNames[m],
                hours: monthLogs.reduce((sum, l) => sum + (l.hours || 0), 0),
                sessions: monthLogs.length
            });
        }

        res.json({
            success: true,
            stats: {
                totalMembers: allMembers.length,
                pendingRequests: pendingCount,
                totalHours: Math.round(totalHours),
                activeEvents
            },
            monthlyData
        });
    } catch (err) {
        console.error('Error fetching club stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/clubs/activity — Recent activity for this club
router.get('/activity', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Club') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const Logbook = require('../models/Logbook');
        const [recentApps, recentLogs] = await Promise.all([
            Student.find({ registered_clubs: { $elemMatch: { club: req.user.id, status: 'Pending' } } })
                .sort({ createdAt: -1 }).limit(5).select('name department createdAt').lean(),
            Logbook.find({ club_id: req.user.id })
                .sort({ createdAt: -1 }).limit(5).populate('student_id', 'name department').lean()
        ]);

        const activities = [
            ...recentApps.map(s => ({
                name: s.name,
                department: s.department || 'General',
                message: 'Applied to join the club',
                status: 'Pending',
                date: s.createdAt,
                type: 'registration'
            })),
            ...recentLogs.map(l => ({
                name: l.student_id?.name || 'Unknown',
                department: l.student_id?.department || '',
                message: `Submitted logbook: "${l.activity_description}"`,
                status: l.status,
                date: l.createdAt,
                type: 'logbook'
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

        res.json({ success: true, activities });
    } catch (err) {
        console.error('Error fetching club activity:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
