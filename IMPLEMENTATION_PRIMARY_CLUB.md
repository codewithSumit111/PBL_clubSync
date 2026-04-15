# Primary Club Implementation for 1st Year Students

## Overview
Implemented a **primary club enforcement system** for 1st year students where:
- Students CAN register for multiple clubs
- Students MUST select ONE primary club for CCA hours accumulation
- Only logbooks submitted to the primary club count toward the 30-hour mandate
- Primary club selection is **locked per semester** (can only change next semester)

---

## Database Schema Changes

### Student Model (`backend/src/models/Student.js`)

**New Fields Added:**
```javascript
primary_club_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    default: null
}

primary_club_set_date: {
    type: Date,
    default: null
}
```

**What these fields do:**
- `primary_club_id`: Stores the ObjectId of the club the student must submit logbooks to
- `primary_club_set_date`: Timestamp when the primary club was set (for semester-lock enforcement)

---

## Backend API Endpoints

### 1. Set Primary Club (NEW ENDPOINT)
**Route:** `POST /api/students/set-primary-club`  
**Auth:** Required (Student only)  
**Payload:**
```json
{
    "club_id": "ObjectId"
}
```

**Business Logic:**
- ✅ Only 1st year students can set primary club
- ✅ Student must be an Approved member of the club first
- ✅ Cannot change primary club within the same semester (locked)
- ✅ Semester boundaries: Jan-Jun (Sem 1), Jul-Dec (Sem 2)
- ✅ Can change in the next semester only

**Response (Success):**
```json
{
    "success": true,
    "message": "Primary club set successfully",
    "primary_club_id": "ObjectId"
}
```

**Response (Semester Lock Violation):**
```json
{
    "success": false,
    "message": "You have already set your primary club this semester. You can change it next semester.",
    "nextChangeDate": "2026-07-01T00:00:00Z"
}
```

---

### 2. Dashboard Endpoint (MODIFIED)
**Route:** `GET /api/students/dashboard`  
**Modified Behavior:** For 1st year students with primary_club set, **only** hours from that club are counted

**New Response Fields:**
```json
{
    "success": true,
    "dashboard": {
        "joinedClubs": [...],
        "ccaProgress": {
            "completed": 12,      // Only from primary club for 1st years
            "mandated": 30,
            "percentage": 40,
            "totalMarks": 18
        },
        "actionItems": [...],
        "notices": [...],
        // NEW FIELDS:
        "year": 1,
        "primaryClubId": "ObjectId",
        "primaryClubSetDate": "2026-01-15T10:30:00Z",
        "isPrimaryClubRequired": true
    }
}
```

**Action Item Alert (NEW):**
If a 1st year student hasn't set their primary club yet:
```json
{
    "type": "primary_club_required",
    "message": "Select your primary club to start submitting logbooks and earning CCA hours",
    "priority": "urgent"
}
```

---

### 3. Logbook Submission Endpoint (MODIFIED)
**Route:** `POST /api/logbooks`  
**Added Validation:** For 1st year students, enforces primary club submission only

**New Logic:**
```javascript
// For 1st year students:
if (studentRecord.year === 1) {
    if (!studentRecord.primary_club_id) {
        // Return: "You must set your primary club first"
    }
    
    if (studentRecord.primary_club_id.toString() !== club_id.toString()) {
        // Return: "You can only submit to your primary club"
    }
}
```

**Error Response (Missing Primary Club):**
```json
{
    "success": false,
    "message": "You must set your primary club first before submitting logbooks",
    "needsPrimaryClub": true
}
```

**Error Response (Wrong Club):**
```json
{
    "success": false,
    "message": "As a 1st year student, you can only submit logbooks to your primary club. Your primary club ID: ObjectId",
    "primaryClubId": "ObjectId"
}
```

---

## CCA Hours Calculation Logic

### For 1st Year Students (WITH primary_club_id set):
```
Total CCA Hours = Hours from PRIMARY CLUB ONLY
Total CCA Marks = Marks from PRIMARY CLUB ONLY
```

### For 1st Year Students (WITHOUT primary_club_id set):
```
Total CCA Hours = 0 (until they set primary club)
Mandate Status = ⚠️ Urgent action required
```

### For 2nd, 3rd, 4th Year Students:
```
Total CCA Hours = SUM of all approved clubs
(Original multi-club aggregation continues)
```

---

## Frontend Flow (Recommended Implementation)

### 1. When Student Joins First Club
After approval, show modal:
```
✅ "You've been approved for Club A!"
   "Now select this as your primary club?"
   [Select as Primary] [Later]
```

### 2. If Multiple Clubs Approved
Add action item to dashboard:
```
🚨 URGENT
"Select your primary club to start earning CCA hours"
[See Clubs] [Select Now]
```

### 3. Primary Club Selector
- Show only APPROVED clubs
- Display: Club name, department, current hours
- Warning: "This selection is locked until next semester"
- Confirmation: "Are you sure? You can change this next semester."

### 4. Logbook Submission Form
- For 1st years: Show only primary club in dropdown (pre-selected, disabled)
- For other years: Show all approved clubs

---

## Testing Checklist

### ✅ 1st Year Student - Happy Path
- [ ] Register for Club A (Pending)
- [ ] Admin approves Club A (Approved)
- [ ] GET /api/students/dashboard → actionItems shows "Select primary club"
- [ ] POST /api/students/set-primary-club with Club A
- [ ] Response: "Primary club set successfully"
- [ ] GET /api/students/dashboard → primaryClubId = Club A
- [ ] POST /api/logbooks with Club A → ✅ Success
- [ ] POST /api/logbooks with Club B → ❌ "Can only submit to primary club"

### ✅ Semester Lock Test
- [ ] Set primary club on Jan 15
- [ ] Try to change on Feb 1 → ❌ "Already set this semester"
- [ ] Try to change on Jul 1 → ✅ Success

### ✅ CCA Aggregation Test (1st year)
- [ ] Club A: 10 hours
- [ ] Club B: 8 hours
- [ ] Dashboard → ccaProgress.completed = 10 (only Club A, not 18)

### ✅ 2nd Year Student
- [ ] 2nd year registers for Club A + Club B
- [ ] NO primary club enforcement
- [ ] Dashboard → ccaProgress.completed = 10 + 8 = 18 hours (all clubs)
- [ ] Can submit logbooks to both clubs

---

## Database Migration (if needed)

For existing 1st year students:
```javascript
// Optional: Auto-assign first approved club as primary
db.students.updateMany(
    { year: 1, primary_club_id: null },
    [
        {
            $set: {
                primary_club_id: { $arrayElemAt: ["$registered_clubs.club", 0] },
                primary_club_set_date: new Date()
            }
        }
    ]
);
```

**Note:** User requested to skip this for mock data.

---

## Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| Student Model | Added `primary_club_id`, `primary_club_set_date` | Schema only affects 1st years |
| Dashboard API | Modified hours aggregation logic | 1st years see only primary club hours |
| Set Primary Club API | NEW endpoint | Allows students to select primary club |
| Logbook Route | Added validation check | 1st years can only submit to primary club |
| Error Handling | New error types | Clear messaging about primary club requirement |

---

## Key Behaviors

### 🎯 For 1st Year Students:
1. Can register for unlimited clubs
2. MUST set ONE primary club after approval
3. Logbooks ONLY accepted for primary club
4. CCA hours ONLY counted from primary club
5. Primary club LOCKED per semester
6. Next semester → can change primary club

### 📚 For 2nd-4th Year Students:
1. No primary club requirement
2. Can submit logbooks to any registered club
3. CCA hours aggregated from all clubs
4. Original multi-club system continues

