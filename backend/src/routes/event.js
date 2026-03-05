const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// @route   GET /api/events
// @desc    Get all upcoming active events (public)
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const events = await Event.find({
            is_active: true,
            date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } // from start of current month
        })
            .populate('created_by_club', 'club_name')
            .populate('created_by_admin', 'name')
            .sort({ date: 1 })
            .lean();

        res.json({ success: true, events });
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/events
// @desc    Create a new event (Club or Admin only)
router.post('/', protect, async (req, res) => {
    try {
        if (!['Club', 'Admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Only clubs and admins can create events' });
        }

        const { title, description, date, end_date, time, location, event_type } = req.body;

        if (!title || !date) {
            return res.status(400).json({ success: false, message: 'Title and date are required' });
        }

        const newEvent = new Event({
            title,
            description: description || '',
            date,
            end_date: end_date || null,
            time: time || '',
            location: location || '',
            event_type: event_type || 'Other',
            created_by_type: req.user.role,
            created_by_club: req.user.role === 'Club' ? req.user.id : null,
            created_by_admin: req.user.role === 'Admin' ? req.user.id : null,
        });

        await newEvent.save();
        res.status(201).json({ success: true, event: newEvent });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event (creator only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Verify ownership
        const isOwner =
            (event.created_by_type === 'Club' && event.created_by_club?.toString() === req.user.id) ||
            (event.created_by_type === 'Admin' && event.created_by_admin?.toString() === req.user.id) ||
            req.user.role === 'Admin';

        if (!isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
