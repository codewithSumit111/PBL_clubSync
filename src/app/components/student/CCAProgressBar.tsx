import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import type { CCAProgress } from '../../services/studentApi';

interface Props {
    progress: CCAProgress;
    loading?: boolean;
}

export const CCAProgressBar: React.FC<Props> = ({ progress, loading }) => {
    const [animatedPercent, setAnimatedPercent] = useState(0);

    useEffect(() => {
        if (!loading) {
            // Smooth animation for the progress bar 
            const timeout = setTimeout(() => {
                setAnimatedPercent(progress.percentage);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [progress.percentage, loading]);

    // Choose color stops that match the overall teal/emerald theme
    const getProgressColor = (pct: number) => {
        if (pct >= 80) return { gradient: 'linear-gradient(135deg, #0d9488, #059669)', glow: 'rgba(13,148,136,0.35)' };
        if (pct >= 50) return { gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)', glow: 'rgba(13,148,136,0.25)' };
        if (pct >= 25) return { gradient: 'linear-gradient(135deg, #f59e0b, #eab308)', glow: 'rgba(245,158,11,0.25)' };
        return { gradient: 'linear-gradient(135deg, #ef4444, #f97316)', glow: 'rgba(239,68,68,0.25)' };
    };

    const colors = getProgressColor(progress.percentage);

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <Clock size={20} className="text-teal-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">CCA Hours Progress</h3>
                </div>
                <div className="h-8 rounded-full bg-gray-100 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <Clock size={20} className="text-teal-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">CCA Hours Progress</h3>
                        <p className="text-xs text-gray-500">College mandate tracker</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                    <TrendingUp size={16} className="text-teal-500" />
                    <span className="font-bold text-teal-600">{progress.percentage}%</span>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div className="relative mb-4">
                <div
                    className="w-full h-5 rounded-full overflow-hidden"
                    style={{ backgroundColor: '#f1f5f9' }}
                >
                    <div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                            width: `${animatedPercent}%`,
                            background: colors.gradient,
                            boxShadow: `0 2px 12px ${colors.glow}`,
                            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {/* Shimmer effect */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                animation: 'shimmer 2s infinite',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Hours Label */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">{progress.completed}</span>
                    <span className="mx-1">/</span>
                    <span className="font-semibold">{progress.mandated}</span>
                    <span className="ml-1">Hours Completed</span>
                </span>
                {progress.percentage >= 100 ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                        ✓ Mandate Met
                    </span>
                ) : (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {progress.mandated - progress.completed} hrs remaining
                    </span>
                )}
            </div>

            {/* Shimmer keyframe injected inline */}
            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
};
