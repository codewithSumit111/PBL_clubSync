const mongoose = require('mongoose');
const { DEFAULT_DESIGNATION } = require('../utils/clubCouncil');

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
    department: {
        type: String,
        trim: true,
        default: ''
    },
    role: {
        type: String,
        default: 'Club',
        enum: ['Club']
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
    designation_templates: [{
        type: String,
        trim: true,
    }],
    registered_students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    events: [{
        title: { type: String, required: true },
        description: { type: String },
        date: { type: Date, required: true },
        time: { type: String, default: '' },
        venue: { type: String, default: '' },
        cca_hours: { type: Number, default: 0, min: 0 },
        check_in: {
            opens_at: { type: Date },
            closes_at: { type: Date }
        },
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

clubSchema.pre('save', function () {
    if (!Array.isArray(this.designation_templates) || this.designation_templates.length === 0) {
        this.designation_templates = [DEFAULT_DESIGNATION, 'Chairperson', 'Vice-Chairperson'];
    }
    this.designation_templates = [...new Set(this.designation_templates.map(d => String(d || '').trim()).filter(Boolean))];
});

const Club = mongoose.models.Club || mongoose.model('Club', clubSchema);

module.exports = Club;
