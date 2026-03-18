// backend/scripts/seedCSIStudents.js
// Run once: node scripts/seedCSIStudents.js
// Seeds 2 mock students pre-approved for the CSI club with CCA marks.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../src/models/Student');
const Club = require('../src/models/Club');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the CSI club
    const csi = await Club.findOne({ club_name: /csi/i });
    if (!csi) {
        console.error('❌ CSI club not found in database. Make sure you have created it first.');
        process.exit(1);
    }
    console.log(`📌 Found CSI club: ${csi.club_name} (${csi._id})`);

    const hashed = await bcrypt.hash('student123', 10);

    const studentsData = [
        {
            name: 'Aarav Sharma',
            email: 'aarav@clubsync.edu',
            password: hashed,
            roll_no: 'CE2024001',
            department: 'CE',
            year: 2,
            role: 'Student',
            registered_clubs: [{
                club: csi._id,
                status: 'Approved',
                preference_order: 1,
                cca_hours: 18,
                cca_marks: {
                    participation: 4,
                    leadership: 3,
                    discipline: 4,
                    skill_development: 3,
                    impact: 3,
                    total: 17
                }
            }]
        },
        {
            name: 'Priya Verma',
            email: 'priya@clubsync.edu',
            password: hashed,
            roll_no: 'CE2024002',
            department: 'CE',
            year: 2,
            role: 'Student',
            registered_clubs: [{
                club: csi._id,
                status: 'Approved',
                preference_order: 1,
                cca_hours: 12,
                cca_marks: {
                    participation: 3,
                    leadership: 2,
                    discipline: 4,
                    skill_development: 3,
                    impact: 2,
                    total: 14
                }
            }]
        }
    ];

    const created = [];
    for (const data of studentsData) {
        // Skip if email already exists
        const existing = await Student.findOne({ email: data.email });
        if (existing) {
            console.log(`⏩ ${data.email} already exists — skipping`);
            // Ensure they are in the CSI registered_students array
            if (!csi.registered_students.some(id => id.toString() === existing._id.toString())) {
                csi.registered_students.push(existing._id);
            }
            created.push(existing);
            continue;
        }

        const student = new Student(data);
        await student.save();
        created.push(student);
        console.log(`✅ Created: ${data.name} (${data.email})`);

        // Add student to the club's registered_students list
        if (!csi.registered_students.some(id => id.toString() === student._id.toString())) {
            csi.registered_students.push(student._id);
        }
    }

    await csi.save();
    console.log(`\n✅ CSI club updated with ${csi.registered_students.length} registered student(s)`);

    console.log('\n── Mock Student Credentials ──────────────────');
    console.log('  Aarav Sharma:  aarav@clubsync.edu  / student123');
    console.log('  Priya Verma:   priya@clubsync.edu  / student123');
    console.log('──────────────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('Done!');
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
