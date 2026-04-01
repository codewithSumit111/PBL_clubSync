const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Club = require('../models/Club');
const Logbook = require('../models/Logbook'); // assuming this exists
const { protect } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get data for Admin Dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const totalStudents = await Student.countDocuments();
        const totalClubs = await Club.countDocuments();
        
        let pendingApprovals = 0;
        try {
            pendingApprovals = await Logbook.countDocuments({ status: 'Pending' });
        } catch (e) {
            console.log('Logbook model missing or error', e);
        }

        // Calculate CCA Participation %
        // Roughly, percentage of students registered for at least one club
        const activeStudents = await Student.countDocuments({
            'registered_clubs.0': { $exists: true }
        });
        const participationRate = totalStudents === 0 ? 0 : Math.round((activeStudents / totalStudents) * 100);

        // Recent Updates: Last 5 students joined
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name department createdAt role');

        // --- NEW: Generate Dynamic Data for Charts ---
        
        // 1. Engagement Series (Last 6 Months: Students Joined & Hours Logged)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const logbookAgg = await Logbook.aggregate([
            { $match: { date: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                totalHours: { $sum: "$hours" }
            }}
        ]) || [];

        const studentAgg = await Student.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                count: { $sum: 1 }
            }}
        ]) || [];

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const engagementSeries = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const monthStr = months[d.getMonth()];
            
            const hoursRecord = logbookAgg.find(x => x._id && x._id.month === d.getMonth() + 1 && x._id.year === d.getFullYear());
            const studentsRecord = studentAgg.find(x => x._id && x._id.month === d.getMonth() + 1 && x._id.year === d.getFullYear());
            
            engagementSeries.push({
                name: monthStr,
                students: studentsRecord ? studentsRecord.count : 0,
                hours: hoursRecord ? hoursRecord.totalHours : 0
            });
        }

        // 2. Participation by Type (Pie Chart) - based on club categories
        const clubsByCategory = await Club.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]) || [];

        const categoryColors = {
            'Technical': '#4f46e5',
            'Arts': '#7c3aed',
            'Sports': '#0ea5e9',
            'Social': '#e11d48',
            'Other': '#10b981'
        };

        const totalCats = clubsByCategory.reduce((sum, curr) => sum + curr.count, 0) || 1;
        const participationByType = clubsByCategory.map(c => {
            const catName = c._id || 'Other';
            return {
                name: catName,
                value: Math.round((c.count / totalCats) * 100),
                color: categoryColors[catName] || categoryColors['Other']
            };
        });
        
        if (participationByType.length === 0) {
            participationByType.push({ name: 'Other', value: 100, color: categoryColors['Other'] });
        }

        return res.json({
            success: true,
            stats: {
                totalStudents,
                totalClubs,
                pendingApprovals,
                ccaParticipation: `${participationRate}%`,
                growth: '+12%' // mocked growth for now
            },
            engagementSeries,
            participationByType,
            recentUpdates: recentStudents
        });

    } catch (err) {
        console.error('[ADMIN DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/admin/students
// @desc    Get all students with their CCA stats
router.get('/students', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const students = await Student.find().select('roll_no name department registered_clubs');
        
        const mappedStudents = students.map(s => {
            let hours = 0;
            let marks = 0;
            s.registered_clubs.forEach(rc => {
                hours += (rc.cca_hours || 0);
                if (rc.cca_marks && rc.cca_marks.total) marks += rc.cca_marks.total;
            });
            return {
                id: s._id,
                roll: s.roll_no,
                name: s.name,
                dept: s.department,
                hours,
                marks
            };
        });

        return res.json({ success: true, students: mappedStudents });
    } catch (err) {
        console.error('[ADMIN STUDENTS ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
