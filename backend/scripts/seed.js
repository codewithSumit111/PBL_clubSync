// backend/scripts/seed.js
// Run once to generate users.json with hashed passwords:
//   node scripts/seed.js
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    const users = [
        {
            id: 'admin-001',
            name: 'System Administrator',
            email: 'admin@clubsync.edu',
            password: await bcrypt.hash('admin123', 10),
            role: 'Admin',
            department: 'Administration',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'club-001',
            name: 'Robotics Club Lead',
            email: 'robotics@clubsync.edu',
            password: await bcrypt.hash('club123', 10),
            role: 'Club',
            department: 'Engineering',
            clubName: 'Robotics Club',
            clubId: 'club-001',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'club-002',
            name: 'Coding Club Lead',
            email: 'coding@clubsync.edu',
            password: await bcrypt.hash('club123', 10),
            role: 'Club',
            department: 'Computer Science',
            clubName: 'Coding Club',
            clubId: 'club-002',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'student-001',
            name: 'John Doe',
            email: 'student@clubsync.edu',
            password: await bcrypt.hash('student123', 10),
            role: 'Student',
            department: 'Computer Science',
            rollNo: 'CS2021001',
            year: '3rd Year',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'student-002',
            name: 'Jane Smith',
            email: 'jane@clubsync.edu',
            password: await bcrypt.hash('student123', 10),
            role: 'Student',
            department: 'Electronics',
            rollNo: 'EC2021042',
            year: '2nd Year',
            createdAt: new Date().toISOString(),
        },
    ];

    const outPath = path.join(__dirname, '../data/users.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(users, null, 2));
    console.log(`✅ Seeded ${users.length} users to ${outPath}`);
    console.log('\nSeed credentials:');
    console.log('  Admin:   admin@clubsync.edu     / admin123');
    console.log('  Club:    robotics@clubsync.edu  / club123');
    console.log('  Club:    coding@clubsync.edu    / club123');
    console.log('  Student: student@clubsync.edu   / student123');
    console.log('  Student: jane@clubsync.edu      / student123');
}

seed().catch(console.error);
