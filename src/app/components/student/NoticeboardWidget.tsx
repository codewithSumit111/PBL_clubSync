import React from 'react';
import { Megaphone, Tag } from 'lucide-react';
import type { Notice } from '../../services/studentApi';

interface Props {
    notices: Notice[];
    loading?: boolean;
}

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
    General: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
    Academic: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    Event: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
    Urgent: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const NoticeboardWidget: React.FC<Props> = ({ notices, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Megaphone size={20} className="text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Noticeboard</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Megaphone size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Noticeboard</h3>
                        <p className="text-xs text-gray-500">Admin announcements</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {notices.length} notice{notices.length !== 1 ? 's' : ''}
                </span>
            </div>

            {notices.length === 0 ? (
                <div className="text-center py-8">
                    <Megaphone size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No announcements right now.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {notices.map((notice, idx) => {
                        const cat = categoryColors[notice.category] || categoryColors.General;
                        return (
                            <div
                                key={notice._id || idx}
                                className="p-4 rounded-xl border border-gray-100 bg-white/40 hover:bg-white/70 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                                            {notice.title}
                                        </h4>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${cat.bg} ${cat.text}`}>
                                        {notice.category}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 ml-4">
                                    {notice.message}
                                </p>
                                <div className="flex items-center justify-between mt-3 ml-4">
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Tag size={10} />
                                        {notice.posted_by?.name || 'Admin'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {timeAgo(notice.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
