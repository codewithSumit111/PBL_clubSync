const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date
    },
    time: {
        type: String, // e.g. "10:00 AM - 12:00 PM"
        trim: true
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    event_type: {
        type: String,
        enum: ['Meeting', 'Workshop', 'Recruitment', 'Competition', 'Seminar', 'Social', 'Other'],
        default: 'Other'
    },
    // Who created the event
    created_by_type: {
        type: String,
        enum: ['Club', 'Admin'],
        required: true
    },
    created_by_club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    },
    created_by_admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
