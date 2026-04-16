const mongoose = require('mongoose');
const Student = require('../models/Student');
const {
    DEFAULT_DESIGNATION,
    DEFAULT_MEMBERSHIP_ROLE,
} = require('../utils/clubCouncil');

function getMembership(studentDoc, clubId, approvedOnly = true) {
    if (!studentDoc?.registered_clubs) return null;
    return studentDoc.registered_clubs.find(rc => {
        const sameClub = rc.club?.toString() === clubId.toString();
        if (!sameClub) return false;
        if (!approvedOnly) return true;
        return rc.status === 'Approved';
    }) || null;
}

function hasCoordinatorScope(membership, scope) {
    if (!membership) return false;
    if (membership.membership_role !== 'coordinator') return false;
    return Array.isArray(membership.coordinator_scopes) && membership.coordinator_scopes.includes(scope);
}

async function resolveClubIdForAction(req, fallbackClubId = null) {
    if (req.user.role === 'Club') {
        return req.user.id;
    }

    const bodyClubId = req.body?.club_id || req.body?.clubId;
    const queryClubId = req.query?.club_id || req.query?.clubId;
    const candidate = bodyClubId || queryClubId || fallbackClubId;

    if (!candidate || !mongoose.Types.ObjectId.isValid(candidate)) {
        return null;
    }
    return candidate.toString();
}

async function canManageClubAction(req, clubId, requiredScope) {
    if (req.user.role === 'Club') {
        return req.user.id.toString() === clubId.toString();
    }

    if (req.user.role !== 'Student') {
        return false;
    }

    const student = await Student.findById(req.user.id).select('registered_clubs');
    if (!student) return false;

    const membership = getMembership(student, clubId, true);
    return hasCoordinatorScope(membership, requiredScope);
}

function ensureDefaultsOnApproval(membership) {
    if (!membership.membership_role) {
        membership.membership_role = DEFAULT_MEMBERSHIP_ROLE;
    }
    if (!membership.designation) {
        membership.designation = DEFAULT_DESIGNATION;
    }
    if (!Array.isArray(membership.coordinator_scopes)) {
        membership.coordinator_scopes = [];
    }
}

module.exports = {
    getMembership,
    hasCoordinatorScope,
    resolveClubIdForAction,
    canManageClubAction,
    ensureDefaultsOnApproval,
};
