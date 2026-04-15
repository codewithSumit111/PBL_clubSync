# Primary Club API Reference

## Quick Integration Guide

### 1. Set Primary Club

**Endpoint:**
```
POST /api/students/set-primary-club
```

**Authentication:** Bearer Token Required (Student only)

**Request Body:**
```json
{
  "club_id": "507f1f77bcf86cd799439011"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Primary club set successfully",
  "primary_club_id": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid club_id format | "Invalid club ID" |
| 403 | Not an approved member | "You must be an approved member of this club first" |
| 403 | Only 1st year users | "Primary club requirement applies only to 1st year students" |
| 400 | Already set this semester | "You have already set your primary club this semester..." |
| 404 | Student not found | "Student not found" |

---

### 2. Get Student Dashboard

**Endpoint:**
```
GET /api/students/dashboard
```

**Authentication:** Bearer Token Required (Student)

**Query Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "joinedClubs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "club_name": "Robotics Club",
        "description": "Building autonomous robots",
        "department": "Engineering",
        "cca_hours": 12,
        "cca_marks": {
          "participation": 4,
          "leadership": 3,
          "discipline": 5,
          "skill_development": 4,
          "impact": 3,
          "total": 19
        }
      }
    ],
    "ccaProgress": {
      "completed": 12,
      "totalMarks": 19,
      "mandated": 30,
      "percentage": 40
    },
    "actionItems": [
      {
        "type": "primary_club_required",
        "message": "Select your primary club to start submitting logbooks and earning CCA hours",
        "club_name": "System",
        "priority": "urgent"
      }
    ],
    "notices": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "CCA Hours Deadline",
        "message": "All CCA hours must be submitted by end of semester",
        "category": "Urgent"
      }
    ],
    "year": 1,
    "primaryClubId": null,
    "primaryClubSetDate": null,
    "isPrimaryClubRequired": true
  }
}
```

**Key Fields Explanation:**

| Field | Type | Description |
|-------|------|-------------|
| `ccaProgress.completed` | Number | CCA hours earned (only from primary club for 1st years) |
| `ccaProgress.mandated` | Number | Required CCA hours (always 30) |
| `ccaProgress.percentage` | Number | Progress percentage (0-100) |
| `primaryClubId` | ObjectId | null if not set, otherwise club ID |
| `primaryClubSetDate` | ISO Date | When primary club was set |
| `isPrimaryClubRequired` | Boolean | true for 1st year students |

---

### 3. Submit Logbook

**Endpoint:**
```
POST /api/logbooks
```

**Authentication:** Bearer Token Required (Student)

**Request Body:**
```json
{
  "club_id": "507f1f77bcf86cd799439011",
  "activity_description": "Helped assemble robot chassis and test motor",
  "date": "2026-04-15",
  "hours": 2.5,
  "report_file": "url-to-uploaded-file.pdf"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "logbook": {
    "_id": "507f1f77bcf86cd799439014",
    "student_id": "507f1f77bcf86cd799439001",
    "club_id": "507f1f77bcf86cd799439011",
    "activity_description": "Helped assemble robot chassis and test motor",
    "date": "2026-04-15",
    "hours": 2.5,
    "status": "Pending",
    "createdAt": "2026-04-15T10:30:00.000Z"
  }
}
```

**Error Responses (1st Year Only):**

| Status | Condition | Message | needsPrimaryClub |
|--------|-----------|---------|------------------|
| 403 | No primary club set | "You must set your primary club first before submitting logbooks" | true |
| 403 | Wrong club | "As a 1st year student, you can only submit logbooks to your primary club..." | false |

---

## Frontend Integration Examples

### React Example: Set Primary Club

```jsx
const setPrimaryClub = async (clubId) => {
  try {
    const response = await fetch('/api/students/set-primary-club', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ club_id: clubId })
    });

    const data = await response.json();
    
    if (data.success) {
      // Show success message
      // Redirect or refresh dashboard
      fetchDashboard();
    } else if (data.nextChangeDate) {
      // Show semester lock message
      alert(`Primary club is locked until ${data.nextChangeDate}`);
    }
  } catch (error) {
    console.error('Error setting primary club:', error);
  }
};
```

### React Example: Check Primary Club Status

```jsx
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const response = await fetch('/api/students/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setDashboardData(data.dashboard);
  };

  // For 1st year students without primary club
  if (dashboardData?.isPrimaryClubRequired && !dashboardData?.primaryClubId) {
    return (
      <Alert type="urgent">
        <h3>Select Your Primary Club</h3>
        <p>You must select one club to complete your CCA requirements.</p>
        <PrimaryClubSelector clubs={dashboardData.joinedClubs} />
      </Alert>
    );
  }

  return (
    <CCAProgressBar 
      progress={dashboardData?.ccaProgress}
      primaryClubId={dashboardData?.primaryClubId}
    />
  );
};
```

### Vue.js Example: Logbook Form

```vue
<template>
  <form @submit.prevent="submitLogbook">
    <div v-if="isPrimaryClubRequired && !primaryClubId">
      <alert type="error">Set primary club before submitting</alert>
    </div>
    
    <!-- Club dropdown -->
    <select v-model="formData.club_id" :disabled="isPrimaryClubRequired">
      <option v-if="!primaryClubId">Choose a club...</option>
      <option 
        v-for="club in (isPrimaryClubRequired ? [primaryClub] : clubs)" 
        :key="club._id"
        :value="club._id"
      >
        {{ club.club_name }}
      </option>
    </select>

    <!-- Other fields -->
    <input v-model="formData.activity_description" type="text" />
    <input v-model="formData.date" type="date" />
    <input v-model.number="formData.hours" type="number" />

    <button type="submit">Submit Logbook</button>
  </form>
</template>

<script>
export default {
  computed: {
    isPrimaryClubRequired() {
      return this.year === 1;
    }
  },
  methods: {
    async submitLogbook() {
      try {
        const res = await fetch('/api/logbooks', {
          method: 'POST',
          body: JSON.stringify(this.formData),
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await res.json();
        
        if (!data.success && data.needsPrimaryClub) {
          this.$router.push('/set-primary-club');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
};
</script>
```

---

## Postman Collection

### Import to Postman:

1. Create a new collection: `Primary Club API`
2. Add these requests:

#### Request 1: Set Primary Club
```
Method: POST
URL: {{baseUrl}}/api/students/set-primary-club
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
  "club_id": "{{clubId}}"
}
```

#### Request 2: Get Dashboard
```
Method: GET
URL: {{baseUrl}}/api/students/dashboard
Headers:
  Authorization: Bearer {{token}}
```

#### Request 3: Submit Logbook
```
Method: POST
URL: {{baseUrl}}/api/logbooks
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
  "club_id": "{{primaryClubId}}",
  "activity_description": "Activity details",
  "date": "2026-04-15",
  "hours": 2
}
```

**Environment Variables to set:**
```
baseUrl: http://localhost:5000
token: (Your Bearer Token)
clubId: (Club ID for testing)
primaryClubId: (Primary club ID after setting)
```

---

## Validation Rules

### Club ID
- Must be a valid MongoDB ObjectId
- Format: 24 hexadecimal characters
- Example: `507f1f77bcf86cd799439011`

### Student Year
- Primary club enforcement: Only year 1
- Years 2-4: Multi-club CCA aggregation continues

### Semester Lock
- Semester 1: January (month 0) to June (month 5)
- Semester 2: July (month 6) to December (month 11)
- Cannot change within same semester
- Resets automatically on semester boundary

### CCA Hours Range
- Min: 0.5 hours
- Max: 24 hours per submission
- Aggregated over entire semester

---

## Status Codes Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Dashboard retrieved, login successful |
| 201 | Created | Logbook/primary club created successfully |
| 400 | Bad Request | Invalid input, semester lock, format errors |
| 403 | Forbidden | Not authorized, not approved member, wrong club |
| 404 | Not Found | Student/club not found |
| 500 | Server Error | Database or server issue |

---

## Common Response Patterns

### Success Pattern
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* operation-specific data */ }
}
```

### Error Pattern
```json
{
  "success": false,
  "message": "Descriptive error message",
  "additionalField": "Context-specific field"
}
```

### With Extras Pattern
```json
{
  "success": false,
  "message": "Primary club already set",
  "nextChangeDate": "2026-07-01T00:00:00Z",
  "needsPrimaryClub": true
}
```

