# Primary Club Implementation - Quick Test Guide

## Prerequisites
- Backend running on `http://localhost:5000` (or your configured port)
- Database populated with users and clubs
- 1st year student account logged in
- Admin/Club Lead account for approvals

---

## Test Scenarios

### Scenario 1: 1st Year Student Sets Primary Club

**Step 1:** Student is a 1st year and has registered for Club A (still Pending)
```bash
GET /api/students/dashboard
# Response: ccaProgress.completed = 0
# actionItems: [] (no primary club warning since not approved yet)
```

**Step 2:** Admin approves the Club A registration
```bash
# Admin approves via club management
```

**Step 3:** Check dashboard again
```bash
GET /api/students/dashboard
# Response should now include:
# {
#     "actionItems": [{
#         "type": "primary_club_required",
#         "message": "Select your primary club...",
#         "priority": "urgent"
#     }],
#     "isPrimaryClubRequired": true,
#     "primaryClubId": null
# }
```

**Step 4:** Student sets Club A as primary club
```bash
POST /api/students/set-primary-club
Body: { "club_id": "CLUB_A_ID" }

# Response:
# {
#     "success": true,
#     "message": "Primary club set successfully",
#     "primary_club_id": "CLUB_A_ID"
# }
```

**Step 5:** Verify primary club is set
```bash
GET /api/students/dashboard
# Response:
# {
#     "primaryClubId": "CLUB_A_ID",
#     "primaryClubSetDate": "2026-04-15T10:30:00.000Z"
# }
```

---

### Scenario 2: Primary Club Semester Lock

**Situation:** Student set primary club on Jan 15

**Step 1:** Student tries to change primary club on Feb 1
```bash
POST /api/students/set-primary-club
Body: { "club_id": "CLUB_B_ID" }

# Response (400):
# {
#     "success": false,
#     "message": "You have already set your primary club this semester. You can change it next semester.",
#     "nextChangeDate": "2026-07-01T00:00:00.000Z"
# }
```

**Step 2:** Student tries again on July 1 (next semester)
```bash
POST /api/students/set-primary-club
Body: { "club_id": "CLUB_B_ID" }

# Response (200):
# {
#     "success": true,
#     "message": "Primary club set successfully",
#     "primary_club_id": "CLUB_B_ID"
# }
```

---

### Scenario 3: Logbook Submission with Primary Club

**Setup:** 1st year student has primary club = Club A

**Step 1:** Try to submit logbook to Club A (primary)
```bash
POST /api/logbooks
Body: {
    "club_id": "CLUB_A_ID",
    "activity_description": "Helped with robot assembly",
    "date": "2026-04-15",
    "hours": 2
}

# Response (201):
# {
#     "success": true,
#     "logbook": { ... }
# }
```

**Step 2:** Try to submit logbook to Club B (NOT primary)
```bash
POST /api/logbooks
Body: {
    "club_id": "CLUB_B_ID",
    "activity_description": "Attended debate practice",
    "date": "2026-04-15",
    "hours": 2
}

# Response (403):
# {
#     "success": false,
#     "message": "As a 1st year student, you can only submit logbooks to your primary club. Your primary club ID: CLUB_A_ID",
#     "primaryClubId": "CLUB_A_ID"
# }
```

---

### Scenario 4: CCA Hours Aggregation (1st vs Other Years)

**Test 1: 1st Year Student with Primary Club**
```
Club A: 10 hours, 15 marks
Club B: 8 hours, 12 marks (registered but NOT primary)

GET /api/students/dashboard
Response:
- ccaProgress.completed = 10 (ONLY Club A, not 18)
- ccaProgress.totalMarks = 15 (ONLY Club A)
- primaryClubId = CLUB_A_ID
```

**Test 2: 2nd Year Student (No Primary Club)**
```
Club A: 10 hours, 15 marks
Club B: 8 hours, 12 marks

GET /api/students/dashboard
Response:
- ccaProgress.completed = 18 (BOTH clubs aggregated)
- ccaProgress.totalMarks = 27 (BOTH clubs)
- isPrimaryClubRequired = false
```

---

### Scenario 5: Error Cases

**Error 1: Not a 1st year trying to set primary club**
```bash
POST /api/students/set-primary-club
# 2nd/3rd/4th year student
# Response (400):
# {
#     "success": false,
#     "message": "Primary club requirement applies only to 1st year students"
# }
```

**Error 2: Setting primary club before approval**
```bash
# Club status is "Pending" (not Approved)
POST /api/students/set-primary-club
Body: { "club_id": "PENDING_CLUB_ID" }

# Response (403):
# {
#     "success": false,
#     "message": "You must be an approved member of this club first"
# }
```

**Error 3: Submitting logbook without primary club set**
```bash
# 1st year student, no primary_club_id yet
POST /api/logbooks
Body: { ... }

# Response (403):
# {
#     "success": false,
#     "message": "You must set your primary club first before submitting logbooks",
#     "needsPrimaryClub": true
# }
```

---

## cURL Command Examples

### Set Primary Club
```bash
curl -X POST http://localhost:5000/api/students/set-primary-club \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"club_id":"CLUB_ID_HERE"}'
```

### Get Dashboard
```bash
curl -X GET http://localhost:5000/api/students/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit Logbook (to primary club)
```bash
curl -X POST http://localhost:5000/api/logbooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "club_id": "CLUB_ID_HERE",
    "activity_description": "Activity details",
    "date": "2026-04-15",
    "hours": 2
  }'
```

---

## Verification Checklist

Use this checklist to verify the implementation works correctly:

- [ ] **1st year, no clubs yet**
  - Dashboard shows no warnings
  - CCA hours = 0

- [ ] **1st year, 1 club approved**
  - Dashboard shows "Select primary club" action item
  - Can call set-primary-club endpoint
  - CCA hours still 0 until primary club set

- [ ] **1st year, primary club set**
  - Can submit logbooks to primary club ✅
  - Cannot submit to other clubs ❌
  - CCA hours counted only from primary club

- [ ] **1st year, try to change primary club same semester**
  - Get "already set this semester" error
  - Cannot change until next semester

- [ ] **1st year, change primary club next semester**
  - Can successfully change ✅
  - Semester lock resets

- [ ] **2nd/3rd/4th year student**
  - No primary club requirement
  - Can submit logbooks to any club
  - CCA hours aggregated from all clubs
  - Dashboard doesn't show primary club info

---

## Database Queries for Testing

### Check if student has primary club set
```javascript
db.students.findOne(
  { _id: ObjectId("STUDENT_ID") },
  { primary_club_id: 1, primary_club_set_date: 1, year: 1 }
)
```

### Find all 1st year students without primary club
```javascript
db.students.find({
  year: 1,
  primary_club_id: null,
  registered_clubs: { $elemMatch: { status: "Approved" } }
}).count()
```

### Check CCA hours by club for a student
```javascript
db.students.findOne(
  { _id: ObjectId("STUDENT_ID") },
  { registered_clubs: { club: 1, cca_hours: 1, status: 1 } }
)
```

---

## Common Issues & Troubleshooting

### Issue: "Invalid club ID" error
**Solution:** Ensure club_id is a valid MongoDB ObjectId format
```bash
# Wrong: club_id: "123"
# Right: club_id: "507f1f77bcf86cd799439011"
```

### Issue: "Not an approved member" error
**Solution:** Ensure the student's registration status for that club is "Approved" in the database

### Issue: CCA hours still show aggregated for 1st year
**Solution:** Check that `primary_club_id` is actually set in the database
```javascript
db.students.findOne({ _id: ObjectId("STUDENT_ID") }).primary_club_id
```

### Issue: Can change primary club within same semester
**Solution:** Check server time/date is correctly set. Semester logic uses system date.

