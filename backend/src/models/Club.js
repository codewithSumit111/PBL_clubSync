const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    year_of_study: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th'],
        required: true
    },
    joined_date: {
        type: Date,
        default: Date.now
    }
});

const clubSchema = new mongoose.Schema({
    club_name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Technical', 'Arts', 'Sports', 'Social', 'Other'],
        default: 'Other'
    },
    description: {
        type: String,
        required: true
    },
    official_website: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['Technical', 'Cultural', 'Sports', 'Social', 'Literary', 'Other'],
        default: 'Other'
    },
    tagline: {
        type: String,
        trim: true,
        default: ''
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
    faculty_coordinators: [{
        name: { type: String, required: true },
        email: { type: String, required: true },
        department: { type: String, required: true }
    }],
    council_members: [memberSchema],
    registered_students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    events: [{
        title: { type: String, required: true },
        description: { type: String },
        date: { type: Date, required: true },
        attendees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }]
    }],
    analytics: {
        total_members: { type: Number, default: 0 },
        active_events: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

const Club = mongoose.model('Club', clubSchema);

module.exports = Club;
