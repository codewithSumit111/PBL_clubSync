const crypto = require('crypto');

function base64UrlEncode(input) {
    return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input) {
    return Buffer.from(input, 'base64url').toString('utf8');
}

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
}

function signPayload(payload) {
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', getSecret())
        .update(encodedPayload)
        .digest('hex');

    return `${encodedPayload}.${signature}`;
}

function generateAttendanceToken(event) {
    const payload = {
        clubId: String(event.clubId),
        eventId: String(event.eventId),
        title: event.title,
        date: event.date,
        time: event.time || '',
        venue: event.venue || '',
        ccaHours: Number(event.ccaHours || 0),
        opensAt: event.opensAt ? new Date(event.opensAt).toISOString() : null,
        closesAt: event.closesAt ? new Date(event.closesAt).toISOString() : null,
        issuedAt: new Date().toISOString(),
    };

    return signPayload(payload);
}

function verifyAttendanceToken(token) {
    if (!token || typeof token !== 'string') {
        throw new Error('Attendance token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        throw new Error('Invalid attendance token');
    }

    const [encodedPayload, providedSignature] = parts;
    const expectedSignature = crypto
        .createHmac('sha256', getSecret())
        .update(encodedPayload)
        .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
        throw new Error('Invalid attendance token signature');
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Date.now();
    const closesAt = payload.closesAt ? new Date(payload.closesAt).getTime() : null;
    const opensAt = payload.opensAt ? new Date(payload.opensAt).getTime() : null;

    // Allow check-in 5 minutes before official opening time
    const EARLY_ARRIVAL_MS = 1 * 60 * 1000;
    // Allow check-in 10 minutes after official closing time
    const GRACE_PERIOD_MS = 1 * 60 * 1000;

    if (opensAt && now < opensAt - EARLY_ARRIVAL_MS) {
        const opensAtIST = new Date(opensAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        throw new Error(`Check-in opens at ${opensAtIST} IST (early arrival not yet allowed)`);
    }

    if (closesAt && now > closesAt + GRACE_PERIOD_MS) {
        throw new Error('Check-in window has closed (grace period ended)');
    }

    return payload;
}

module.exports = {
    generateAttendanceToken,
    verifyAttendanceToken,
};