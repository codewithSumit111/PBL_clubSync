// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Club = require('../models/Club');
const Admin = require('../models/Admin');
const Logbook = require('../models/Logbook');
const Achievement = require('../models/Achievement');
const Notice = require('../models/Notice');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────
// GET /api/admin/stats
// Real-time statistics for the admin dashboard
// ─────────────────────────────────────────────
router.get('/stats', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const [totalStudents, totalClubs, allStudents, activeEvents, totalAchievements] = await Promise.all([
            Student.countDocuments(),
            Club.countDocuments(),
            Student.find().select('registered_clubs').lean(),
            Event.countDocuments({ is_active: true }),
            Achievement.countDocuments(),
        ]);

        // Count pending approvals (students with any Pending club registration)
        let pendingApprovals = 0;
        let approvedStudents = 0;
        allStudents.forEach(s => {
            if (s.registered_clubs) {
                s.registered_clubs.forEach(rc => {
                    if (rc.status === 'Pending') pendingApprovals++;
                    if (rc.status === 'Approved') approvedStudents++;
                });
            }
        });

        // CCA participation rate: students who have at least 1 Approved club / total students
        const studentsWithClubs = allStudents.filter(s =>
            s.registered_clubs && s.registered_clubs.some(rc => rc.status === 'Approved')
        ).length;
        const participationRate = totalStudents > 0
            ? Math.round((studentsWithClubs / totalStudents) * 100)
            : 0;

        // Monthly engagement data (last 6 months)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [logbooks, achievements] = await Promise.all([
            Logbook.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt hours status').lean(),
            Achievement.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt').lean(),
        ]);

        // Build monthly buckets
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthIdx = d.getMonth();
            const yearNum = d.getFullYear();

            const monthLogbooks = logbooks.filter(l => {
                const ld = new Date(l.createdAt);
                return ld.getMonth() === monthIdx && ld.getFullYear() === yearNum;
            });

            const monthAchievements = achievements.filter(a => {
                const ad = new Date(a.createdAt);
                return ad.getMonth() === monthIdx && ad.getFullYear() === yearNum;
            });

            const approvedHours = monthLogbooks
                .filter(l => l.status === 'Approved')
                .reduce((sum, l) => sum + (l.hours || 0), 0);

            monthlyData.push({
                name: monthNames[monthIdx],
                submissions: monthLogbooks.length,
                hours: Math.round(approvedHours),
                achievements: monthAchievements.length,
            });
        }

        // Category distribution
        const clubs = await Club.find().select('category registered_students').lean();
        const categoryMap = {};
        clubs.forEach(c => {
            const cat = c.category || 'Other';
            if (!categoryMap[cat]) categoryMap[cat] = 0;
            categoryMap[cat] += (c.registered_students ? c.registered_students.length : 0);
        });

        const categoryColors = {
            Technical: '#0d9488',
            Cultural: '#EC4899',
            Sports: '#f59e0b',
            Social: '#8b5cf6',
            Literary: '#3b82f6',
            Other: '#6b7280',
        };

        const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value,
            color: categoryColors[name] || '#6b7280',
        }));

        // If no category data, provide at least one entry
        if (categoryData.length === 0) {
            categoryData.push({ name: 'No Data', value: 0, color: '#e5e7eb' });
        }

        // Intake window status
        const admin = await Admin.findById(req.user.id).select('intake_window').lean();

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalClubs,
                pendingApprovals,
                participationRate,
                activeEvents,
                totalAchievements,
                approvedStudents,
            },
            monthlyData,
            categoryData,
            intakeWindow: admin?.intake_window || { is_active: false },
        });
    } catch (err) {
        console.error('[ADMIN STATS ERROR]', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/activity
// Recent activity feed across all modules
// ─────────────────────────────────────────────
router.get('/activity', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        // Fetch recent items from multiple collections
        const [recentLogbooks, recentAchievements, recentStudents] = await Promise.all([
            Logbook.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('student_id', 'name department')
                .populate('club_id', 'club_name')
                .lean(),
            Achievement.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('student_id', 'name department')
                .populate('club_id', 'club_name')
                .lean(),
            Student.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name department createdAt')
                .lean(),
        ]);

        // Merge into a single activity feed
        const activities = [];

        recentLogbooks.forEach(l => {
            activities.push({
                type: 'logbook',
                name: l.student_id?.name || 'Unknown',
                department: l.student_id?.department || '',
                message: `Submitted logbook: "${l.activity_description}"`,
                club: l.club_id?.club_name || '',
                status: l.status,
                date: l.createdAt,
            });
        });

        recentAchievements.forEach(a => {
            activities.push({
                type: 'achievement',
                name: a.student_id?.name || 'Unknown',
                department: a.student_id?.department || '',
                message: `Achievement: "${a.title}"`,
                club: a.club_id?.club_name || '',
                status: a.verification_status || 'Pending',
                date: a.createdAt,
            });
        });

        recentStudents.forEach(s => {
            activities.push({
                type: 'registration',
                name: s.name,
                department: s.department || '',
                message: 'New student registered',
                club: '',
                status: 'Completed',
                date: s.createdAt,
            });
        });

        // Sort by date descending, take top 10
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json({ success: true, activities: activities.slice(0, 10) });
    } catch (err) {
        console.error('[ADMIN ACTIVITY ERROR]', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/admin/intake-window
// Toggle intake window open/close
// ─────────────────────────────────────────────
router.put('/intake-window', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const { is_active, start_date, end_date, max_preferences } = req.body;

        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.intake_window = {
            is_active: is_active !== undefined ? is_active : false,
            start_date: start_date || null,
            end_date: end_date || null,
            max_preferences: max_preferences || 3,
        };

        await admin.save();

        res.json({
            success: true,
            message: `Intake window ${is_active ? 'opened' : 'closed'} successfully`,
            intake_window: admin.intake_window,
        });
    } catch (err) {
        console.error('[INTAKE WINDOW ERROR]', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/cca-report
// Full CCA report: all students with marks + hours
// ─────────────────────────────────────────────
router.get('/cca-report', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        // Get all students with populated club data
        const students = await Student.find()
            .select('name roll_no department year registered_clubs')
            .populate('registered_clubs.club', 'club_name category')
            .lean();

        const report = students.map(s => {
            let totalHours = 0;
            let totalMarks = 0;
            const clubCount = (s.registered_clubs || []).filter(rc => rc.status === 'Approved').length;

            (s.registered_clubs || []).forEach(rc => {
                if (rc.status === 'Approved') {
                    totalHours += rc.cca_hours || 0;
                    totalMarks += rc.cca_marks?.total || 0;
                }
            });

            return {
                _id: s._id,
                name: s.name,
                roll_no: s.roll_no,
                department: s.department,
                year: s.year,
                clubs_count: clubCount,
                total_cca_hours: totalHours,
                total_cca_marks: totalMarks,
            };
        });

        // Sort by marks descending
        report.sort((a, b) => b.total_cca_marks - a.total_cca_marks);

        // Department-wise aggregation
        const deptMap = {};
        students.forEach(s => {
            const dept = s.department || 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { total: 0, active: 0, topAchievers: 0 };
            deptMap[dept].total++;
            const hasApproved = (s.registered_clubs || []).some(rc => rc.status === 'Approved');
            if (hasApproved) deptMap[dept].active++;

            const marks = (s.registered_clubs || []).reduce((sum, rc) =>
                sum + (rc.status === 'Approved' ? (rc.cca_marks?.total || 0) : 0), 0);
            if (marks >= 20) deptMap[dept].topAchievers++;
        });

        const departmentData = Object.entries(deptMap).map(([name, d]) => ({
            name: name.length > 6 ? name.substring(0, 6) : name,
            fullName: name,
            active: d.total > 0 ? Math.round((d.active / d.total) * 100) : 0,
            top: d.total > 0 ? Math.round((d.topAchievers / d.total) * 100) : 0,
            totalStudents: d.total,
        }));

        // Average CCA rubric scores across all students
        let rubricTotals = { participation: 0, leadership: 0, discipline: 0, skill_development: 0, impact: 0 };
        let rubricCount = 0;
        students.forEach(s => {
            (s.registered_clubs || []).forEach(rc => {
                if (rc.status === 'Approved' && rc.cca_marks) {
                    rubricTotals.participation += rc.cca_marks.participation || 0;
                    rubricTotals.leadership += rc.cca_marks.leadership || 0;
                    rubricTotals.discipline += rc.cca_marks.discipline || 0;
                    rubricTotals.skill_development += rc.cca_marks.skill_development || 0;
                    rubricTotals.impact += rc.cca_marks.impact || 0;
                    rubricCount++;
                }
            });
        });

        const rubricData = [
            { subject: 'Participation', A: rubricCount > 0 ? +(rubricTotals.participation / rubricCount).toFixed(1) : 0, fullMark: 5 },
            { subject: 'Leadership', A: rubricCount > 0 ? +(rubricTotals.leadership / rubricCount).toFixed(1) : 0, fullMark: 5 },
            { subject: 'Discipline', A: rubricCount > 0 ? +(rubricTotals.discipline / rubricCount).toFixed(1) : 0, fullMark: 5 },
            { subject: 'Skill Dev', A: rubricCount > 0 ? +(rubricTotals.skill_development / rubricCount).toFixed(1) : 0, fullMark: 5 },
            { subject: 'Impact', A: rubricCount > 0 ? +(rubricTotals.impact / rubricCount).toFixed(1) : 0, fullMark: 5 },
        ];

        const avgMarks = rubricCount > 0
            ? +(rubricData.reduce((sum, r) => sum + r.A, 0)).toFixed(1)
            : 0;
        const efficiency = rubricCount > 0 ? Math.round((avgMarks / 25) * 100) : 0;
        const grade = avgMarks >= 22 ? 'A+' : avgMarks >= 18 ? 'A' : avgMarks >= 15 ? 'B+' : avgMarks >= 12 ? 'B' : avgMarks >= 8 ? 'C' : 'D';

        res.json({
            success: true,
            students: report,
            departmentData,
            rubricData,
            summary: { avgMarks, efficiency, grade, totalStudents: students.length },
        });
    } catch (err) {
        console.error('[CCA REPORT ERROR]', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
