const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    club_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
        index: true
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    event_title: {
        type: String,
        required: true,
        trim: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    student_name: {
        type: String,
        required: true,
        trim: true
    },
    student_roll_no: {
        type: String,
        required: true,
        trim: true
    },
    cca_hours_awarded: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    checked_in_at: {
        type: Date,
        default: Date.now
    },
    qr_signature: {
        type: String,
        required: true
    },
    ip_address: {
        type: String,
        default: ''
    },
    user_agent: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

attendanceSchema.index({ club_id: 1, event_id: 1, student_id: 1 }, { unique: true });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;