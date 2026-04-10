import { API_BASE } from '../config';

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('clubsync_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export interface AttendanceEvent {
    _id: string;
    club_id: string;
    club_name: string;
    title: string;
    date: string;
    time?: string;
    venue?: string;
    cca_hours: number;
    check_in?: {
        opens_at?: string;
        closes_at?: string;
    } | null;
}

export interface AttendanceRecord {
    _id: string;
    event_title: string;
    student_name: string;
    student_roll_no: string;
    cca_hours_awarded: number;
    checked_in_at: string;
}

export interface StudentAttendanceHistory {
    _id: string;
    event_title: string;
    club_name: string;
    cca_hours_awarded: number;
    checked_in_at: string;
    checked_in_date: string;
    checked_in_time: string;
}

export interface ClubEvent {
    _id: string;
    title: string;
    date: string;
    time?: string;
    venue?: string;
    cca_hours?: number;
    description?: string;
    event_image?: string;
}

export async function fetchEventQr(eventId: string): Promise<{ qrToken: string; event: AttendanceEvent }> {
    const res = await fetch(`${API_BASE}/clubs/events/${eventId}/qr`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || 'Failed to generate QR token');
    }

    return data;
}

export async function fetchEventAttendance(eventId: string, clubId?: string): Promise<{ event: AttendanceEvent; attendance: AttendanceRecord[]; count: number }> {
    const query = clubId ? `?clubId=${encodeURIComponent(clubId)}` : '';
    const res = await fetch(`${API_BASE}/clubs/events/${eventId}/attendance${query}`, {
        headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || 'Failed to fetch attendance');
    }

    return data;
}

export async function checkInForEvent(eventId: string, token: string): Promise<any> {
    const res = await fetch(`${API_BASE}/clubs/events/${eventId}/check-in`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token }),
    });

    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error(`Server error (${res.status}). Please try again.`);
    }

    if (!data.success) {
        throw new Error(data.message || 'Failed to check in');
    }

    return data;
}

export async function fetchStudentAttendanceHistory(): Promise<{ attendance: StudentAttendanceHistory[]; count: number; total_cca_hours: number }> {
    const res = await fetch(`${API_BASE}/students/attendance`, {
        headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || 'Failed to fetch attendance history');
    }

    return data;
}

export async function fetchAllClubsEvents(): Promise<{ clubs: Array<{ _id: string; club_name: string; events: ClubEvent[] }> }> {
    const res = await fetch(`${API_BASE}/clubs`, {
        headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || 'Failed to fetch clubs');
    }

    return data;
}