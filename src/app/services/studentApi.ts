// API service for student dashboard
import { API_BASE } from '../config';

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('clubsync_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface JoinedClub {
    _id: string;
    club_name: string;
    description: string;
    department: string;
    membership_role?: 'member' | 'coordinator';
    designation?: string;
    coordinator_scopes?: string[];
    cca_hours: number;
    cca_marks: {
        participation?: number;
        leadership?: number;
        discipline?: number;
        skill_development?: number;
        impact?: number;
        total?: number;
    };
}

export interface CCAProgress {
    completed: number;
    mandated: number;
    percentage: number;
    totalMarks?: number;
}

export interface ActionItem {
    type: 'allocation' | 'logbook' | 'pending_review' | 'primary_club_required';
    message: string;
    club_name: string;
    priority: 'high' | 'medium' | 'low' | 'urgent';
    date?: string;
}

export interface Notice {
    _id: string;
    title: string;
    message: string;
    category: 'General' | 'Academic' | 'Event' | 'Urgent';
    posted_by: { name: string };
    createdAt: string;
}

export interface StudentDashboardData {
    joinedClubs: JoinedClub[];
    ccaProgress: CCAProgress;
    actionItems: ActionItem[];
    notices: Notice[];
    year?: number;
    primaryClubId?: string | null;
    primaryClubSetDate?: string | null;
    isPrimaryClubRequired?: boolean;
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
    const res = await fetch(`${API_BASE}/students/dashboard`, {
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch dashboard');
    return data.dashboard;
}

export async function fetchNotices(): Promise<Notice[]> {
    const res = await fetch(`${API_BASE}/notices`, {
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch notices');
    return data.notices;
}
