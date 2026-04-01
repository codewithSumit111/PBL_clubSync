const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Club = require('../models/Club');
const Logbook = require('../models/Logbook');
const { protect } = require('../middleware/auth');

// @route   GET /api/students/dashboard
// @desc    Get dashboard metrics for current student
router.get('/dashboard', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ success: false, message: 'Not authorized as student' });
        }

        const student = await Student.findById(req.user.id)
            .populate('achievements')
            .populate('logbook_entries');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Calculate hours from registered clubs (based on the schema properties)
        let totalHours = 0;
        let totalCurrentMarks = 0;
        let activeClubsCount = 0;

        if (student.registered_clubs) {
            student.registered_clubs.forEach(rc => {
                totalHours += (rc.cca_hours || 0);
                if (rc.cca_marks && rc.cca_marks.total) {
                    totalCurrentMarks += rc.cca_marks.total;
                }
                if (rc.status === 'Approved') {
                    activeClubsCount += 1;
                }
            });
        }

        // Dynamic Chart Data for Students
        
        // 1. Engagement Series: Monthly hours and something else (e.g., number of activities) 
        // For Students, we'll map `students` to "activities" and `hours` to "hours"
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const logbookAgg = await Logbook.aggregate([
            { $match: { student_id: student._id, date: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                totalHours: { $sum: "$hours" },
                activityCount: { $sum: 1 }
            }}
        ]) || [];

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const engagementSeries = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const monthStr = months[d.getMonth()];
            
            const hoursRecord = logbookAgg.find(x => x._id && x._id.month === d.getMonth() + 1 && x._id.year === d.getFullYear());
            
            engagementSeries.push({
                name: monthStr,
                students: hoursRecord ? hoursRecord.activityCount : 0, // Using students key for chart compatibility
                hours: hoursRecord ? hoursRecord.totalHours : 0
            });
        }

        // 2. Participation by Type (Pie Chart) - based on registered clubs categories
        const categoryColors = {
            'Technical': '#4f46e5',
            'Arts': '#7c3aed',
            'Sports': '#0ea5e9',
            'Social': '#e11d48',
            'Other': '#10b981'
        };

        const participationByType = [];
        if (student.registered_clubs && student.registered_clubs.length > 0) {
            const clubIds = student.registered_clubs.map(rc => rc.club);
            const clubs = await Club.find({ _id: { $in: clubIds } });
            
            const catCounts = {};
            clubs.forEach(c => {
                const cat = c.category || 'Other';
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            });

            const totalCats = clubs.length || 1;
            Object.keys(catCounts).forEach(catName => {
                participationByType.push({
                    name: catName,
                    value: Math.round((catCounts[catName] / totalCats) * 100),
                    color: categoryColors[catName] || categoryColors['Other']
                });
            });
        }
        
        if (participationByType.length === 0) {
            participationByType.push({ name: 'None', value: 100, color: '#e2e8f0' });
        }


        return res.json({
            success: true,
            stats: {
                totalCcaHours: totalHours,
                currentMarks: `${totalCurrentMarks}/25`,
                activeClubs: activeClubsCount,
                achievements: student.achievements ? student.achievements.length : 0,
                growth: '+5%' // mocked student growth
            },
            engagementSeries,
            participationByType
        });

    } catch (err) {
        console.error('[STUDENT DASHBOARD ERROR]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
