const mongoose = require('mongoose');
const {
    MEMBERSHIP_ROLES,
    DEFAULT_MEMBERSHIP_ROLE,
    DEFAULT_DESIGNATION,
    COORDINATOR_SCOPES,
} = require('../utils/clubCouncil');

// Schema for tracking a student's data within a specific club
const registeredClubSchema = new mongoose.Schema({
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    membership_role: {
        type: String,
        enum: MEMBERSHIP_ROLES,
        default: DEFAULT_MEMBERSHIP_ROLE,
    },
    designation: {
        type: String,
        trim: true,
        default: DEFAULT_DESIGNATION,
    },
    coordinator_scopes: [{
        type: String,
        enum: COORDINATOR_SCOPES,
    }],
    preference_order: {
        type: Number
    }, // For preference allocation during registration
    appliedAt: {
        type: Date,
        default: Date.now
    },

    cca_hours: {
        type: Number,
        default: 0
    },
    // CCA Marks calculation (Out of 25 based on 5 rubrics 5 marks each)
    cca_marks: {
        participation: { type: Number, default: 0, max: 5 },
        leadership: { type: Number, default: 0, max: 5 },
        discipline: { type: Number, default: 0, max: 5 },
        skill_development: { type: Number, default: 0, max: 5 },
        impact: { type: Number, default: 0, max: 5 },
        total: { type: Number, default: 0, max: 25 }
    }
});

// Main Student Schema
const studentSchema = new mongoose.Schema({
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
    roll_no: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    role: {
        type: String,
        default: 'Student',
        enum: ['Student']
    },

    // Array to track all registered clubs and their specific stats for this student
    registered_clubs: [registeredClubSchema],

    // Primary club for CCA hours (mandatory for 1st year students)
    primary_club_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        default: null
    },
    // Track when primary club was set (to enforce once-per-semester rule)
    primary_club_set_date: {
        type: Date,
        default: null
    },

    // References to other collections
    achievements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    logbook_entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Logbook'
    }]
}, {
    timestamps: true
});

// Middleware to calculate total CCA marks for a club before saving
studentSchema.pre('save', function () {
    if (this.registered_clubs && this.registered_clubs.length > 0) {
        this.registered_clubs.forEach(rc => {
            if (rc.cca_marks) {
                rc.cca_marks.total =
                    (rc.cca_marks.participation || 0) +
                    (rc.cca_marks.leadership || 0) +
                    (rc.cca_marks.discipline || 0) +
                    (rc.cca_marks.skill_development || 0) +
                    (rc.cca_marks.impact || 0);
            }
        });
    }
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

module.exports = Student;
