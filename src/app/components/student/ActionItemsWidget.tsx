import React from 'react';
import { AlertCircle, BookOpen, CheckCircle2, Clock, ClipboardList, Building2 } from 'lucide-react';
import type { ActionItem } from '../../services/studentApi';

interface Props {
    items: ActionItem[];
    loading?: boolean;
}

const priorityStyles: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
    high: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
    },
    medium: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700',
    },
    low: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700',
    },
};

const typeIcons: Record<string, React.FC<{ size: number; className?: string }>> = {
    allocation: AlertCircle,
    logbook: BookOpen,
    pending_review: Clock,
};

const clubAccentColors = [
    { header: 'bg-teal-50 border-teal-200', title: 'text-teal-700', dot: 'bg-teal-500' },
    { header: 'bg-purple-50 border-purple-200', title: 'text-purple-700', dot: 'bg-purple-500' },
    { header: 'bg-pink-50 border-pink-200', title: 'text-pink-700', dot: 'bg-pink-500' },
    { header: 'bg-amber-50 border-amber-200', title: 'text-amber-700', dot: 'bg-amber-500' },
    { header: 'bg-indigo-50 border-indigo-200', title: 'text-indigo-700', dot: 'bg-indigo-500' },
    { header: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-700', dot: 'bg-emerald-500' },
];

function groupByClub(items: ActionItem[]): Record<string, ActionItem[]> {
    const grouped: Record<string, ActionItem[]> = {};
    items.forEach(item => {
        const club = item.club_name || 'Other';
        if (!grouped[club]) grouped[club] = [];
        grouped[club].push(item);
    });
    return grouped;
}

export const ActionItemsWidget: React.FC<Props> = ({ items, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <ClipboardList size={20} className="text-amber-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Action Items</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const grouped = groupByClub(items);
    const clubNames = Object.keys(grouped);

    return (
        <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <ClipboardList size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Pending Tasks</h3>
                        <p className="text-xs text-gray-500">
                            {items.length} task{items.length !== 1 ? 's' : ''} across {clubNames.length} club{clubNames.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {items.length > 0 && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle size={12} />
                        {items.filter(i => i.priority === 'high').length} urgent
                    </span>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8">
                    <CheckCircle2 size={40} className="text-emerald-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-medium">All caught up!</p>
                    <p className="text-gray-400 text-xs mt-1">No pending action items.</p>
                </div>
            ) : (
                <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {clubNames.map((clubName, clubIdx) => {
                        const clubItems = grouped[clubName];
                        const accent = clubAccentColors[clubIdx % clubAccentColors.length];
                        return (
                            <div key={clubName}>
                                {/* Club Header */}
                                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${accent.header} border mb-3`}>
                                    <div className={`w-2 h-2 rounded-full ${accent.dot}`} />
                                    <Building2 size={14} className={accent.title} />
                                    <span className={`text-sm font-bold ${accent.title}`}>
                                        {clubName}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-auto">
                                        {clubItems.length} task{clubItems.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {/* Club Tasks */}
                                <div className="space-y-2 pl-2">
                                    {clubItems.map((item, idx) => {
                                        const style = priorityStyles[item.priority] || priorityStyles.low;
                                        const Icon = typeIcons[item.type] || AlertCircle;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.border} ${style.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group`}
                                            >
                                                <div className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 leading-snug">
                                                        {item.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.badge}`}>
                                                            {item.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
