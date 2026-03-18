import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, Award, ArrowUpRight, Trophy, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api';
const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#10b981'];
const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 10px 24px rgba(0,0,0,0.08)', fontSize: '12px' };
const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

interface AnalyticsData {
    totalMembers: number;
    totalCCAHours: number;
    avgMarks: number;
    totalAchievements: number;
    byDepartment: { name: string; value: number; color: string }[];
    marksDistribution: { range: string; count: number }[];
    achievementsByLevel: { level: string; count: number }[];
    topMembers: { name: string; roll_no: string; cca_marks: number; cca_hours: number }[];
}

const LEVELS = ['College', 'State', 'National', 'International'];

function computeAnalytics(members: any[], achievements: any[]): AnalyticsData {
    const totalMembers = members.length;

    const totalCCAHours = members.reduce((sum, m) => sum + (m.cca_hours || 0), 0);

    const totalMarks = members.reduce((sum, m) => sum + (m.cca_marks || 0), 0);
    const avgMarks = totalMembers > 0 ? parseFloat((totalMarks / totalMembers).toFixed(1)) : 0;

    const totalAchievements = achievements.length;

    // Department breakdown
    const deptMap: Record<string, number> = {};
    members.forEach(m => { if (m.department) deptMap[m.department] = (deptMap[m.department] || 0) + 1; });
    const byDepartment = Object.entries(deptMap).map(([name, value], i) => ({
        name, value, color: COLORS[i % COLORS.length]
    }));

    // Marks distribution (buckets of 5)
    const buckets: Record<string, number> = { '0–5': 0, '6–10': 0, '11–15': 0, '16–20': 0, '21–25': 0 };
    members.forEach(m => {
        const s = m.cca_marks || 0;
        if (s <= 5) buckets['0–5']++;
        else if (s <= 10) buckets['6–10']++;
        else if (s <= 15) buckets['11–15']++;
        else if (s <= 20) buckets['16–20']++;
        else buckets['21–25']++;
    });
    const marksDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    // Achievements by level
    const levelMap: Record<string, number> = {};
    achievements.forEach(a => { levelMap[a.level] = (levelMap[a.level] || 0) + 1; });
    const achievementsByLevel = LEVELS.map(level => ({ level, count: levelMap[level] || 0 }));

    // Top performers by CCA marks
    const topMembers = [...members]
        .sort((a, b) => (b.cca_marks || 0) - (a.cca_marks || 0))
        .slice(0, 5);

    return { totalMembers, totalCCAHours, avgMarks, totalAchievements, byDepartment, marksDistribution, achievementsByLevel, topMembers };
}

export const ClubAnalytics: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [memRes, achRes] = await Promise.all([
                fetch(`${API}/clubs/members`, { headers }),
                fetch(`${API}/achievements/club`, { headers }),
            ]);
            const [memData, achData] = await Promise.all([memRes.json(), achRes.json()]);

            if (!memRes.ok) throw new Error(memData.message || 'Failed to fetch member data');
            if (!achRes.ok) throw new Error(achData.message || 'Failed to fetch achievement data');

            setAnalytics(computeAnalytics(memData.members || [], achData.achievements || []));
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-gray-400">
                <RefreshCw size={28} className="animate-spin mr-3" /> Loading analytics...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchData} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold">Retry</button>
            </div>
        );
    }

    if (!analytics) return null;

    const kpis = [
        { label: 'Total Members', value: analytics.totalMembers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', delta: 'registered' },
        { label: 'Avg. CCA Marks', value: `${analytics.avgMarks}/25`, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50', delta: 'average score' },
        { label: 'Achievements', value: analytics.totalAchievements, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', delta: 'total tagged' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Club Analytics</h2>
                    <p className="text-gray-500 text-sm mt-1">Live performance data for {user?.clubName || 'your club'}</p>
                </div>
                <button onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi, i) => (
                    <div key={i} className={`${cardClass} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                                <kpi.icon size={20} />
                            </div>
                            <span className="text-xs text-gray-400">{kpi.delta}</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Marks Distribution + Department Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${cardClass} p-6 lg:col-span-2`}>
                    <h3 className="font-bold text-gray-900 mb-1">CCA Marks Distribution</h3>
                    <p className="text-xs text-gray-400 mb-4">Number of members in each marks range (out of 25)</p>
                    {analytics.totalMembers === 0 ? (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No member data yet</div>
                    ) : (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.marksDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                                        {analytics.marksDistribution.map((_, i) => (
                                            <Cell key={i} fill={['#f87171', '#fb923c', '#fbbf24', '#34d399', '#0d9488'][i]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className={`${cardClass} p-6`}>
                    <h3 className="font-bold text-gray-900 mb-1">By Department</h3>
                    <p className="text-xs text-gray-400 mb-4">Member distribution</p>
                    {analytics.byDepartment.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
                    ) : (
                        <>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={analytics.byDepartment} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                                            {analytics.byDepartment.map((d, i) => <Cell key={i} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5 mt-2">
                                {analytics.byDepartment.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-gray-600">{d.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Achievements by Level + Top Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} p-6`}>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" /> Achievements by Level
                    </h3>
                    {analytics.totalAchievements === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No achievements tagged yet</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.achievementsByLevel.map((a, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 w-28">{a.level}</span>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full">
                                        <div className="h-3 rounded-full transition-all duration-700"
                                            style={{ width: `${analytics.totalAchievements > 0 ? (a.count / analytics.totalAchievements) * 100 : 0}%`, backgroundColor: COLORS[i] }} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 w-5 text-right">{a.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`${cardClass} p-6`}>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-teal-600" /> Top Performers
                    </h3>
                    {analytics.topMembers.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No member data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.topMembers.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${['bg-amber-400', 'bg-gray-400', 'bg-orange-400', 'bg-teal-400', 'bg-cyan-400'][i]
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                                        <p className="text-xs text-gray-400 font-mono">{m.roll_no}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-teal-700">{m.cca_marks ?? 0}/25</p>
                                        <p className="text-xs text-gray-400">{m.cca_hours ?? 0}h</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
