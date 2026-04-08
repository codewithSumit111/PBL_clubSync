const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'Admin',
        enum: ['Admin']
    },
    department: {
        type: String,
        trim: true // Optional if admin spans across all depts
    },
    intake_window: {
        is_active: { type: Boolean, default: false },
        start_date: { type: Date },
        end_date: { type: Date },
        max_preferences: { type: Number, default: 3 }
    }
}, {
    timestamps: true
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

module.exports = Admin;
