const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const File = require('../models/File');

// Configure multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed. Please upload images, PDFs, or documents.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// @route   POST /api/uploads
// @desc    Upload a file (any authenticated user)
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Save file to MongoDB
        const newFile = new File({
            student_id: req.user.id,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            data: req.file.buffer
        });
        
        await newFile.save();

        const fileUrl = `/api/uploads/${newFile._id}`;

        res.json({
            success: true,
            file: {
                url: fileUrl,
                originalName: newFile.originalname,
                size: newFile.size,
                mimetype: newFile.mimetype,
            },
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// @route   GET /api/uploads/:id
// @desc    Retrieve an uploaded file by ID
router.get('/:id', async (req, res) => {
    try {
        const fileDoc = await File.findById(req.params.id);
        
        if (!fileDoc) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        res.set('Content-Type', fileDoc.mimetype);
        // Optionally add a header so the browser knows the original filename
        res.set('Content-Disposition', `inline; filename="${fileDoc.originalname}"`);
        res.send(fileDoc.data);
    } catch (err) {
        console.error('File retrieval error:', err);
        res.status(500).json({ success: false, message: 'File retrieval failed' });
    }
});

// Error handler for multer errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
});

module.exports = router;
