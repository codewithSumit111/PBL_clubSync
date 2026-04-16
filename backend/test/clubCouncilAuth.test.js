const test = require('node:test');
const assert = require('node:assert/strict');

const Student = require('../src/models/Student');
const {
    getMembership,
    hasCoordinatorScope,
    resolveClubIdForAction,
    canManageClubAction,
    ensureDefaultsOnApproval,
} = require('../src/middleware/clubCouncilAuth');

function makeReq({ role = 'Student', id = 'student-1', body = {}, query = {} } = {}) {
    return { user: { role, id }, body, query };
}

test('getMembership finds approved club membership by club id', () => {
    const student = {
        registered_clubs: [
            { club: 'club-a', status: 'Pending' },
            { club: 'club-b', status: 'Approved', membership_role: 'coordinator', coordinator_scopes: ['EVENT_MANAGER'] },
        ],
    };

    const membership = getMembership(student, 'club-b');
    assert.equal(membership.status, 'Approved');
    assert.equal(membership.membership_role, 'coordinator');
});

test('hasCoordinatorScope only passes for coordinator with matching scope', () => {
    assert.equal(hasCoordinatorScope(null, 'EVENT_MANAGER'), false);
    assert.equal(hasCoordinatorScope({ membership_role: 'member', coordinator_scopes: ['EVENT_MANAGER'] }, 'EVENT_MANAGER'), false);
    assert.equal(hasCoordinatorScope({ membership_role: 'coordinator', coordinator_scopes: ['EVENT_MANAGER'] }, 'EVENT_MANAGER'), true);
    assert.equal(hasCoordinatorScope({ membership_role: 'coordinator', coordinator_scopes: ['CCA_MANAGER'] }, 'EVENT_MANAGER'), false);
});

test('ensureDefaultsOnApproval fills missing membership defaults', () => {
    const membership = {};
    ensureDefaultsOnApproval(membership);

    assert.equal(membership.membership_role, 'member');
    assert.equal(membership.designation, 'Member Only');
    assert.deepEqual(membership.coordinator_scopes, []);
});

test('resolveClubIdForAction reads club id from body or query and rejects invalid ids', async () => {
    await assert.equal(await resolveClubIdForAction(makeReq({ body: { club_id: 'club-a' } })), null);
    await assert.equal(await resolveClubIdForAction(makeReq({ body: { club_id: '507f1f77bcf86cd799439011' } })), '507f1f77bcf86cd799439011');
    await assert.equal(await resolveClubIdForAction(makeReq({ query: { clubId: '507f1f77bcf86cd799439012' } })), '507f1f77bcf86cd799439012');
});

test('canManageClubAction allows student coordinators with matching scope', async (t) => {
    const originalFindById = Student.findById;
    Student.findById = async () => ({
        registered_clubs: [
            {
                club: '507f1f77bcf86cd799439011',
                status: 'Approved',
                membership_role: 'coordinator',
                coordinator_scopes: ['EVENT_MANAGER', 'CCA_MANAGER'],
            },
        ],
    });

    t.after(() => {
        Student.findById = originalFindById;
    });

    const req = makeReq({
        role: 'Student',
        id: 'student-1',
    });

    assert.equal(await canManageClubAction(req, '507f1f77bcf86cd799439011', 'EVENT_MANAGER'), true);
    assert.equal(await canManageClubAction(req, '507f1f77bcf86cd799439011', 'LOGBOOK_REVIEWER'), false);
});

test('canManageClubAction denies non-matching club accounts and non-coordinators', async (t) => {
    const originalFindById = Student.findById;
    Student.findById = async () => ({
        registered_clubs: [
            {
                club: '507f1f77bcf86cd799439011',
                status: 'Approved',
                membership_role: 'member',
                coordinator_scopes: [],
            },
        ],
    });

    t.after(() => {
        Student.findById = originalFindById;
    });

    const studentReq = makeReq({ role: 'Student', id: 'student-1' });
    const clubReq = makeReq({ role: 'Club', id: '507f1f77bcf86cd799439011' });
    const otherClubReq = makeReq({ role: 'Club', id: '507f1f77bcf86cd799439099' });

    assert.equal(await canManageClubAction(studentReq, '507f1f77bcf86cd799439011', 'CCA_MANAGER'), false);
    assert.equal(await canManageClubAction(clubReq, '507f1f77bcf86cd799439011', 'EVENT_MANAGER'), true);
    assert.equal(await canManageClubAction(otherClubReq, '507f1f77bcf86cd799439011', 'EVENT_MANAGER'), false);
});
