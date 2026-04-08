const mongoose = require('mongoose');

const logbookSchema = new mongoose.Schema({
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
    activity_description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    hours: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    rejection_reason: {
        type: String
    },
    report_file: {
        type: String, // Store URL or path to the uploaded .pdf
        required: false
    }
}, {
    timestamps: true
});

const Logbook = mongoose.models.Logbook || mongoose.model('Logbook', logbookSchema);

module.exports = Logbook;
