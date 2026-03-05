import React from 'react';
import { Building2, ChevronRight, Users } from 'lucide-react';
import type { JoinedClub } from '../../services/studentApi';

interface Props {
    clubs: JoinedClub[];
    loading?: boolean;
}

// Color palette matching the teal/purple/pink/amber theme
const clubColors = [
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: '#0d9488' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: '#7c3aed' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', accent: '#ec4899' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: '#f59e0b' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: '#059669' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: '#4f46e5' },
];

export const JoinedClubsWidget: React.FC<Props> = ({ clubs, loading }) => {
    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-teal-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">My Clubs</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-teal-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">My Clubs</h3>
                        <p className="text-xs text-gray-500">{clubs.length} active membership{clubs.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    {clubs.length} Joined
                </span>
            </div>

            {clubs.length === 0 ? (
                <div className="text-center py-8">
                    <Users size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">You haven't joined any clubs yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Explore clubs to get started!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {clubs.map((club, idx) => {
                        const color = clubColors[idx % clubColors.length];
                        return (
                            <div
                                key={club._id || idx}
                                className={`flex items-center gap-4 p-4 rounded-xl border ${color.border} ${color.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group`}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: color.accent }}
                                >
                                    {club.club_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold ${color.text} truncate`}>
                                        {club.club_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {club.description || club.department || 'Active Member'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 bg-white/60 px-2 py-1 rounded-lg">
                                        {club.cca_hours}h
                                    </span>
                                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
