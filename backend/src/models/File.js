const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    originalname: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    data: {
        type: Buffer,
        required: true
    }
}, {
    timestamps: true
});

const File = mongoose.models.File || mongoose.model('File', fileSchema);

module.exports = File;
