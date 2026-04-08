const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['General', 'Academic', 'Event', 'Urgent'],
        default: 'General'
    },
    posted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Notice = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);

module.exports = Notice;
