import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { JoinedClubsWidget } from '../components/student/JoinedClubsWidget';
import { CCAProgressBar } from '../components/student/CCAProgressBar';
import { ActionItemsWidget } from '../components/student/ActionItemsWidget';
import { NoticeboardWidget } from '../components/student/NoticeboardWidget';
import { EventCalendar } from '../components/student/EventCalendar';
import {
    fetchStudentDashboard,
    type StudentDashboardData,
} from '../services/studentApi';
import {
    Award,
    Users,
    ArrowUpRight,
    RefreshCw,
    Building2,
    ChevronRight,
} from 'lucide-react';

export const StudentDashboard: React.FC<{ onNavigateToMyClubs?: () => void }> = ({
    onNavigateToMyClubs,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const USE_MOCK_DASHBOARD = process.env.NODE_ENV === 'development';

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const dashboard = await fetchStudentDashboard();
            setData(dashboard);
        } catch (err: any) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard');
            if (USE_MOCK_DASHBOARD) {
                // Fallback: use mock data in development so UI still renders
                setData({
                    joinedClubs: [
                        { _id: '1', club_name: 'Robotics Club', description: 'Build and program robots', department: 'Engineering', cca_hours: 8, cca_marks: {} },
                        { _id: '2', club_name: 'Debate Society', description: 'Sharpen your oratory skills', department: 'Arts', cca_hours: 5, cca_marks: {} },
                        { _id: '3', club_name: 'Coding Club', description: 'Competitive programming & hackathons', department: 'CS', cca_hours: 2, cca_marks: {} },
                    ],
                    ccaProgress: { completed: 15, mandated: 30, percentage: 50 },
                    actionItems: [
                        { type: 'logbook', message: 'Submit weekly logbook for Coding Club', club_name: 'Coding Club', priority: 'medium' },
                        { type: 'allocation', message: 'Accept preference allocation for Photography Club', club_name: 'Photography Club', priority: 'high' },
                        { type: 'pending_review', message: 'Logbook pending review: "Arduino Workshop" for Robotics Club', club_name: 'Robotics Club', priority: 'low' },
                    ],
                    notices: [
                        { _id: 'n1', title: 'CCA Hours Submission Deadline', message: 'All students must submit their CCA hours logbook by March 15, 2026. Late submissions will not be accepted.', category: 'Urgent', posted_by: { name: 'Dr. Sharma' }, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
                        { _id: 'n2', title: 'Annual Club Fair 2026', message: 'The annual club fair will be held on March 20th in the main auditorium. All clubs are expected to set up their stalls.', category: 'Event', posted_by: { name: 'Admin Office' }, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
                        { _id: 'n3', title: 'New Club Registration Open', message: 'Registration for new clubs is now open. Students interested in forming a new club should submit their proposal.', category: 'General', posted_by: { name: 'Student Affairs' }, createdAt: new Date(Date.now() - 72 * 3600000).toISOString() },
                    ],
                });
            } else {
                // In production, avoid showing mock data that could mislead users
                setData(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();

        // Auto-refresh every 60 seconds to pick up club/admin changes
        const interval = setInterval(() => {
            loadDashboard();
        }, 60000);

        // Re-fetch when tab becomes visible again
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadDashboard();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // Quick stats from dashboard data
    const quickStats = data
        ? [
            {
                label: 'Total Clubs Enrolled',
                value: String(data.joinedClubs.length),
                icon: Users,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
            },
            {
                label: 'Pending Tasks',
                value: String(data.actionItems.length),
                icon: Award,
                color: 'text-pink-600',
                bg: 'bg-pink-50',
            },
        ]
        : [];

    // Color palette for club chips
    const clubChipColors = [
        { bg: 'bg-teal-50', text: 'text-teal-700', hover: 'hover:bg-teal-100' },
        { bg: 'bg-purple-50', text: 'text-purple-700', hover: 'hover:bg-purple-100' },
        { bg: 'bg-pink-50', text: 'text-pink-700', hover: 'hover:bg-pink-100' },
        { bg: 'bg-amber-50', text: 'text-amber-700', hover: 'hover:bg-amber-100' },
        { bg: 'bg-indigo-50', text: 'text-indigo-700', hover: 'hover:bg-indigo-100' },
        { bg: 'bg-emerald-50', text: 'text-emerald-700', hover: 'hover:bg-emerald-100' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.name}! 👋
                    </h2>
                    <p className="text-gray-500">
                        Here's your student dashboard overview for today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadDashboard}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Could not reach the server — showing preview data. {error}</span>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(loading ? [1, 2] : quickStats).map((stat: any, idx) => (
                    <div
                        key={idx}
                        className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        style={{
                            boxShadow:
                                '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                        }}
                    >
                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
                                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                                <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}
                                    >
                                        <stat.icon size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                        Active <ArrowUpRight size={12} />
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium">
                                    {stat.label}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stat.value}
                                </p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Enrolled Clubs Quick Nav */}
            {!loading && data && data.joinedClubs.length > 0 && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Your Enrolled Clubs</h3>
                            <p className="text-xs text-gray-500">Click a club to view its section</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.joinedClubs.map((club, idx) => {
                            const chipColor = clubChipColors[idx % clubChipColors.length];
                            return (
                                <button
                                    key={club._id || idx}
                                    onClick={() => {
                                        // Prefer explicit navigation callback when provided
                                        if (onNavigateToMyClubs) {
                                            onNavigateToMyClubs();
                                            return;
                                        }

                                        // Fallback: trigger existing sidebar behavior via DOM for backward compatibility
                                        const sidebar = document.querySelector<HTMLButtonElement>('button[data-view="my-clubs"]');
                                        if (sidebar) {
                                            sidebar.click();
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${chipColor.bg} ${chipColor.text} ${chipColor.hover} border border-transparent hover:border-current/10 transition-all duration-200 group cursor-pointer`}
                                >
                                    <span className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {club.club_name.charAt(0)}
                                    </span>
                                    <span className="font-semibold text-sm">{club.club_name}</span>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CCA Progress Bar (Full Width) */}
            <CCAProgressBar
                progress={data?.ccaProgress || { completed: 0, mandated: 30, percentage: 0 }}
                loading={loading}
            />

            {/* Main Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JoinedClubsWidget clubs={data?.joinedClubs || []} loading={loading} />
                <ActionItemsWidget items={data?.actionItems || []} loading={loading} />
            </div>

            {/* Event Calendar (Full Width) */}
            <EventCalendar loading={loading} />

            {/* Noticeboard (Full Width) */}
            <NoticeboardWidget notices={data?.notices || []} loading={loading} />
        </div>
    );
};
