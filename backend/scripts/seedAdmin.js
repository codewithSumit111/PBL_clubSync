// Run: node backend/scripts/seedAdmin.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const email = 'admin@college.edu';
        const existing = await Admin.findOne({ email });
        if (existing) {
            console.log('Admin already exists with this email. Skipping.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = new Admin({
            name: 'System Administrator',
            email,
            password: hashedPassword,
            role: 'Admin',
            department: 'Administration'
        });

        await admin.save();
        console.log('\n✅ Admin account created!');
        console.log('   Email:    admin@college.edu');
        console.log('   Password: admin123');
        console.log('\nYou can now sign in with these credentials.\n');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

seedAdmin();
