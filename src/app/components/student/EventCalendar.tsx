import React, { useEffect, useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock,
    Users,
    Building2,
    Sparkles,
} from 'lucide-react';

import { API_BASE } from '../../config';

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('clubsync_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

interface EventData {
    _id: string;
    title: string;
    description: string;
    date: string;
    end_date?: string;
    time?: string;
    location?: string;
    event_type: string;
    created_by_type: 'Club' | 'Admin';
    created_by_club?: { _id: string; club_name: string };
    created_by_admin?: { _id: string; name: string };
}

const MOCK_EVENTS: EventData[] = [
    { _id: 'e1', title: 'Robotics Workshop: Drone Assembly', description: 'Hands-on drone assembly workshop', date: new Date(Date.now() + 2 * 86400000).toISOString(), time: '10:00 AM - 1:00 PM', location: 'Lab 204', event_type: 'Workshop', created_by_type: 'Club', created_by_club: { _id: 'c1', club_name: 'Robotics Club' } },
    { _id: 'e2', title: 'Club Recruitment Drive 2026', description: 'Open recruitment for all clubs', date: new Date(Date.now() + 5 * 86400000).toISOString(), time: '9:00 AM - 5:00 PM', location: 'Main Auditorium', event_type: 'Recruitment', created_by_type: 'Admin', created_by_admin: { _id: 'a1', name: 'Admin Office' } },
    { _id: 'e3', title: 'Weekly Code Sprint', description: 'Competitive programming practice', date: new Date(Date.now() + 1 * 86400000).toISOString(), time: '6:00 PM - 8:00 PM', location: 'CS Lab 1', event_type: 'Competition', created_by_type: 'Club', created_by_club: { _id: 'c2', club_name: 'Coding Club' } },
    { _id: 'e4', title: 'Parliamentary Debate Practice', description: 'Weekly debate practice session', date: new Date(Date.now() + 3 * 86400000).toISOString(), time: '4:00 PM - 6:00 PM', location: 'Seminar Hall B', event_type: 'Meeting', created_by_type: 'Club', created_by_club: { _id: 'c3', club_name: 'Debate Society' } },
    { _id: 'e5', title: 'CCA Hours Submission Deadline', description: 'All students must submit logbooks', date: new Date(Date.now() + 10 * 86400000).toISOString(), event_type: 'Other', created_by_type: 'Admin', created_by_admin: { _id: 'a1', name: 'Admin Office' } },
    { _id: 'e6', title: 'Inter-College Hackathon Info Session', description: 'Pre-hackathon briefing and team formation', date: new Date(Date.now() + 7 * 86400000).toISOString(), time: '3:00 PM - 4:30 PM', location: 'Room 301', event_type: 'Seminar', created_by_type: 'Club', created_by_club: { _id: 'c2', club_name: 'Coding Club' } },
];

const eventTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
    Meeting: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    Workshop: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    Recruitment: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    Competition: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    Seminar: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    Social: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
    Other: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EventCalendarProps {
    loading?: boolean;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ loading: parentLoading }) => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/events`, { headers: getAuthHeaders() });
                const data = await res.json();
                if (data.success && data.events.length > 0) {
                    setEvents(data.events);
                } else {
                    setEvents(MOCK_EVENTS);
                }
            } catch {
                setEvents(MOCK_EVENTS);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calendar grid calculations
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Map events to days
    const eventsByDay = useMemo(() => {
        const map: Record<number, EventData[]> = {};
        events.forEach(ev => {
            const d = new Date(ev.date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(ev);
            }
        });
        return map;
    }, [events, year, month]);

    // Events for selected day or upcoming
    const selectedDayEvents = selectedDay && eventsByDay[selectedDay]
        ? eventsByDay[selectedDay]
        : [];

    // All upcoming events (from today onward)
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return events
            .filter(e => new Date(e.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    }, [events]);

    const eventsToShow = selectedDay && selectedDayEvents.length > 0 ? selectedDayEvents : upcomingEvents;
    const listTitle = selectedDay && selectedDayEvents.length > 0
        ? `Events on ${MONTH_NAMES[month]} ${selectedDay}`
        : 'Upcoming Events';

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDay(null);
    };
    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDay(null);
    };

    const getCreator = (ev: EventData) => {
        if (ev.created_by_type === 'Club' && ev.created_by_club) return ev.created_by_club.club_name;
        if (ev.created_by_type === 'Admin' && ev.created_by_admin) return ev.created_by_admin.name;
        return ev.created_by_type;
    };

    if (parentLoading || loading) {
        return (
            <div
                className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <CalendarIcon size={20} className="text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Event Calendar</h3>
                </div>
                <div className="h-72 rounded-xl bg-gray-100 animate-pulse" />
            </div>
        );
    }

    return (
        <div
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <CalendarIcon size={20} className="text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Event Calendar</h3>
                    <p className="text-xs text-gray-500">Upcoming meetings, workshops & drives</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar Grid */}
                <div>
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <h4 className="font-bold text-gray-800 text-sm">
                            {MONTH_NAMES[month]} {year}
                        </h4>
                        <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAY_NAMES.map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-10" />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = isCurrentMonth && today.getDate() === day;
                            const hasEvents = !!eventsByDay[day];
                            const isSelected = selectedDay === day;
                            const eventCount = eventsByDay[day]?.length || 0;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(isSelected ? null : day)}
                                    className={`h-10 rounded-lg text-sm font-medium relative transition-all duration-200 ${isSelected
                                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                                            : isToday
                                                ? 'bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-200'
                                                : hasEvents
                                                    ? 'bg-gray-50 text-gray-800 hover:bg-teal-50'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {day}
                                    {hasEvents && !isSelected && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                            {Array.from({ length: Math.min(eventCount, 3) }).map((_, di) => (
                                                <div key={di} className={`w-1 h-1 rounded-full ${isToday ? 'bg-indigo-500' : 'bg-teal-500'}`} />
                                            ))}
                                        </div>
                                    )}
                                    {isSelected && hasEvents && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-teal-600 rounded-full text-[9px] font-bold flex items-center justify-center shadow">
                                            {eventCount}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Event List */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Sparkles size={14} className="text-teal-500" />
                        {listTitle}
                    </h4>

                    {eventsToShow.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <CalendarIcon size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-medium">No events{selectedDay ? ' on this day' : ' coming up'}</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            {eventsToShow.map(ev => {
                                const tc = eventTypeColors[ev.event_type] || eventTypeColors.Other;
                                const creator = getCreator(ev);
                                const evDate = new Date(ev.date);
                                return (
                                    <div
                                        key={ev._id}
                                        className={`p-3.5 rounded-xl border ${tc.bg} border-opacity-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                                        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Date badge */}
                                            <div className="flex-shrink-0 w-11 h-11 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                                                    {evDate.toLocaleDateString('en-IN', { month: 'short' })}
                                                </span>
                                                <span className="text-base font-bold text-gray-800 leading-tight">
                                                    {evDate.getDate()}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>
                                                        {ev.event_type}
                                                    </span>
                                                </div>
                                                <h5 className="text-sm font-bold text-gray-800 leading-snug truncate">
                                                    {ev.title}
                                                </h5>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                                                    {ev.time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} /> {ev.time}
                                                        </span>
                                                    )}
                                                    {ev.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={10} /> {ev.location}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        {ev.created_by_type === 'Club' ? <Building2 size={10} /> : <Users size={10} />}
                                                        {creator}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
