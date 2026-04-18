import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { JoinedClubsWidget } from '../components/student/JoinedClubsWidget';
import { CouncilActionsWidget } from '../components/student/CouncilActionsWidget';
import { CCAProgressBar } from '../components/student/CCAProgressBar';
import { ActionItemsWidget } from '../components/student/ActionItemsWidget';
import { NoticeboardWidget } from '../components/student/NoticeboardWidget';
import { EventCalendar } from '../components/student/EventCalendar';
import { ClubEventsNotifications } from './club/ClubEventsNotifications';
import { ClubCCAManagement } from './club/ClubCCAManagement';
import { ClubStudentMgmt } from './club/ClubStudentMgmt';
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
    Sparkles,
    AlertTriangle
} from 'lucide-react';

export const StudentDashboard: React.FC<{ onNavigateToMyClubs?: () => void }> = ({
    onNavigateToMyClubs,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCouncilAction, setActiveCouncilAction] = useState<{ clubId: string; clubName: string; action: 'events' | 'cca' | 'members' } | null>(null);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const dashboard = await fetchStudentDashboard();
            setData(dashboard);
        } catch (err: any) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard');
            setData(null);
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
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Welcome back, {user?.name}! <Sparkles className="text-teal-500" size={24} />
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
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <span>Could not reach the server — showing preview data. {error}</span>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(loading ? [1, 2] : quickStats).map((stat: any, idx) => (
                    <div
                        key={idx}
                        className="bg-white p-6 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] transition-all duration-300"
                    >
                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
                                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                                <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex-shrink-0 ${stat.bg} ${stat.color} flex items-center justify-center`}
                                    >
                                        <stat.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] uppercase font-semibold text-[#6b7280] tracking-wider mb-1">
                                            {stat.label}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-[28px] leading-tight font-bold text-[#1a1a2e]">
                                                {stat.value}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pl-16">
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                        Active <ArrowUpRight size={12} />
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Enrolled Clubs Quick Nav */}
            {!loading && data && data.joinedClubs.length > 0 && (
                <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
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
                {data?.year === 1 && (
                    <CCAProgressBar
                        progress={data?.ccaProgress || { completed: 0, mandated: 30, percentage: 0 }}
                        loading={loading}
                    />
                )}

                <CouncilActionsWidget
                    clubs={data?.joinedClubs || []}
                    onOpenAction={(club, action) => setActiveCouncilAction({ clubId: club._id, clubName: club.club_name, action })}
                />

            {/* Main Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JoinedClubsWidget clubs={data?.joinedClubs || []} loading={loading} />
                <ActionItemsWidget items={data?.actionItems || []} loading={loading} />
            </div>

                {activeCouncilAction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-white/60">
                            <button
                                onClick={() => setActiveCouncilAction(null)}
                                className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                ×
                            </button>
                            <div className="mb-5 pr-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Council Workspace</p>
                                <h3 className="text-xl font-bold text-gray-900">{activeCouncilAction.clubName}</h3>
                            </div>
                            {activeCouncilAction.action === 'events' ? (
                                <ClubEventsNotifications clubId={activeCouncilAction.clubId} embedded />
                            ) : activeCouncilAction.action === 'members' ? (
                                <ClubStudentMgmt clubId={activeCouncilAction.clubId} embedded />
                            ) : (
                                <ClubCCAManagement clubId={activeCouncilAction.clubId} embedded />
                            )}
                        </div>
                    </div>
                )}

            {/* Event Calendar (Full Width) */}
            <EventCalendar loading={loading} />

            {/* Noticeboard (Full Width) */}
            <NoticeboardWidget notices={data?.notices || []} loading={loading} />
        </div>
    );
};
