import React from 'react';
import { Award, CalendarDays, ClipboardList, ShieldCheck, Users } from 'lucide-react';
import type { JoinedClub } from '../../services/studentApi';

interface Props {
    clubs: JoinedClub[];
    onOpenAction: (club: JoinedClub, action: 'events' | 'cca' | 'members') => void;
}

export const CouncilActionsWidget: React.FC<Props> = ({ clubs, onOpenAction }) => {
    const coordinatorClubs = clubs.filter(c => c.membership_role === 'coordinator');

    if (coordinatorClubs.length === 0) return null;

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} className="text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Council Actions</h3>
                    <p className="text-xs text-gray-500">Your coordinator privileges by club</p>
                </div>
            </div>

            <div className="space-y-3">
                {coordinatorClubs.map(club => {
                    const scopes = new Set(club.coordinator_scopes || []);
                    return (
                        <div key={club._id} className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">{club.club_name}</p>
                                    <p className="text-xs text-gray-500">{club.designation || 'Member Only'}</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                                    Coordinator
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {scopes.has('EVENT_MANAGER') && (
                                    <button
                                        onClick={() => onOpenAction(club, 'events')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2 text-xs font-bold text-white hover:bg-teal-600"
                                    >
                                        <CalendarDays size={13} /> Manage Events
                                    </button>
                                )}
                                {scopes.has('CCA_MANAGER') && (
                                    <button
                                        onClick={() => onOpenAction(club, 'cca')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-600"
                                    >
                                        <Award size={13} /> Manage CCA
                                    </button>
                                )}
                                {scopes.has('LOGBOOK_REVIEWER') && (
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                                        <ClipboardList size={13} /> Logbook Reviewer
                                    </span>
                                )}
                                {scopes.has('ATTENDANCE_MANAGER') && (
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                        <Users size={13} /> Attendance Manager
                                    </span>
                                )}
                                {scopes.has('MEMBER_ADMIN') && (
                                    <button
                                        onClick={() => onOpenAction(club, 'members')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                                    >
                                        <Users size={13} /> Manage Members
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};