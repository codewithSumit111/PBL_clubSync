const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    club_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['College', 'State', 'National', 'International'],
        default: 'College'
    },
    date: {
        type: Date,
        required: true
    },
    certificate_url: {
        type: String, // Store the URL or path to the uploaded jpg/png/pdf
        required: false
    },
    verification_status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    verification_feedback: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
