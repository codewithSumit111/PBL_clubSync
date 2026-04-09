const rateLimit = require('express-rate-limit');

// Rate limiter for check-in endpoint
// Max 15 attempts per 5 minutes per student (identified by user ID)
const checkInLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15, // max 15 requests per windowMs
    message: 'Too many check-in attempts. Please try again later.',
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: true, // Disable X-RateLimit-* headers
    skip: (req) => {
        // Skip rate limit for admins
        return req.user && req.user.role === 'Admin';
    },
    keyGenerator: (req) => {
        // Use user ID + event ID as key to allow cross-event check-ins but limit per-event attempts
        return `${req.user.id}:${req.params.eventId}`;
    },
});

// Rate limiter for QR generation endpoint
// Max 10 requests per minute per club (to prevent spam QR generation)
const qrGenerationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many QR generation requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: true,
    skip: (req) => {
        return req.user && req.user.role === 'Admin';
    },
    keyGenerator: (req) => {
        return `${req.user.id}:qr-gen`;
    },
});

module.exports = {
    checkInLimiter,
    qrGenerationLimiter,
};
