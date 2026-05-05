import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Trophy, Plus, X, Search, RefreshCw, AlertCircle,
    Award, Star, Globe, Building2, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';

const LEVELS = ['All', 'College', 'State', 'National', 'International'];
const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    College: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Building2 },
    State: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Star },
    National: { color: 'text-orange-700', bg: 'bg-orange-100', icon: Award },
    International: { color: 'text-purple-700', bg: 'bg-purple-100', icon: Globe },
};

interface Achievement {
    _id: string;
    student_id: { _id: string; name: string; roll_no: string } | string;
    title: string;
    description: string;
    level: string;
    date: string;
    certificate_url?: string;
}

interface Member { _id: string; name: string; roll_no: string; }

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

export const ClubAchievements: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        student_id: '', title: '', description: '',
        level: 'College', date: new Date().toISOString().split('T')[0], certificate_url: '',
    });

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [achRes, memRes] = await Promise.all([
                fetch(`${API}/achievements/club`, { headers }),
                fetch(`${API}/clubs/members`, { headers }),
            ]);
            const [achData, memData] = await Promise.all([achRes.json(), memRes.json()]);

            if (!achRes.ok) throw new Error(achData.message || 'Failed to load achievements');
            if (!memRes.ok) throw new Error(memData.message || 'Failed to load members');

            setAchievements(achData.achievements || []);
            setMembers((memData.members || []).map((m: any) => ({ _id: m._id, name: m.name, roll_no: m.roll_no })));
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.student_id) return toast.error('Please select a student');
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/achievements`, {
                method: 'POST', headers,
                body: JSON.stringify({
                    student_id: form.student_id,
                    title: form.title,
                    description: form.description,
                    level: form.level,
                    date: form.date,
                    certificate_url: form.certificate_url || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to tag achievement');
            toast.success('Achievement tagged successfully!');
            setShowForm(false);
            setForm({ student_id: '', title: '', description: '', level: 'College', date: new Date().toISOString().split('T')[0], certificate_url: '' });
            fetchData(); // refresh list
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStudentName = (sid: Achievement['student_id']) =>
        (typeof sid === 'object' && sid !== null) ? sid.name : members.find(m => m._id === sid)?.name || 'Unknown';
    const getStudentRoll = (sid: Achievement['student_id']) =>
        (typeof sid === 'object' && sid !== null) ? sid.roll_no : members.find(m => m._id === sid)?.roll_no || '';

    const filtered = achievements.filter(a => {
        const name = getStudentName(a.student_id).toLowerCase();
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || name.includes(search.toLowerCase());
        const matchLevel = levelFilter === 'All' || a.level === levelFilter;
        return matchSearch && matchLevel;
    });

    if (error && achievements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchData} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
                    <p className="text-gray-500 text-sm mt-1">Tag students with their achievements</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200">
                    <Plus size={16} /> Tag Achievement
                </button>
            </div>

            {/* Level Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {LEVELS.slice(1).map(lvl => {
                    const cfg = LEVEL_CONFIG[lvl];
                    const count = achievements.filter(a => a.level === lvl).length;
                    return (
                        <div key={lvl} className={`${cardClass} p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all ${levelFilter === lvl ? 'ring-2 ring-teal-400' : ''}`}
                            onClick={() => setLevelFilter(lvl === levelFilter ? 'All' : lvl)}>
                            <div className={`w-9 h-9 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                                <cfg.icon size={18} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-gray-900">{loading ? '...' : count}</p>
                                <p className="text-xs text-gray-500">{lvl}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className={`${cardClass} p-4 flex flex-col sm:flex-row gap-3 items-center`}>
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search achievements..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors" />
                </div>
                <div className="flex gap-2">
                    {LEVELS.map(l => (
                        <button key={l} onClick={() => setLevelFilter(l)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${levelFilter === l ? 'bg-teal-500 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
                                }`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <RefreshCw size={24} className="animate-spin mr-2" /> Loading achievements...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.length === 0 ? (
                        <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-400">
                            <Trophy size={40} className="mb-3 opacity-30" />
                            <p className="font-semibold">No achievements found</p>
                            <p className="text-sm">Tag students to get started</p>
                        </div>
                    ) : filtered.map(a => {
                        const cfg = LEVEL_CONFIG[a.level] || LEVEL_CONFIG['College'];
                        return (
                            <div key={a._id} className={`${cardClass} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                                        <cfg.icon size={11} /> {a.level}
                                    </div>
                                    <p className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1 leading-snug">{a.title}</h4>
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{a.description}</p>
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                                        {getStudentName(a.student_id)?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">{getStudentName(a.student_id)}</p>
                                        <p className="text-xs text-gray-400 font-mono">{getStudentRoll(a.student_id)}</p>
                                    </div>
                                    {a.certificate_url && (
                                        <a href={a.certificate_url} target="_blank" rel="noreferrer"
                                            className="ml-auto text-teal-600 hover:text-teal-700 transition-colors">
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showForm && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }} onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-md relative max-h-[85vh] overflow-hidden animate-fade-in-up" style={{ boxShadow: '0 32px 64px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                        <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400" />
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-4px)]">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Trophy size={18} className="text-teal-600" /> Tag Achievement
                            </h3>
                            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Student *</label>
                                <select required value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none">
                                    <option value="">Select a member...</option>
                                    {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.roll_no})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. 1st Place at National Hackathon"
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                                <textarea required rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Brief description..."
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Level</label>
                                    <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400">
                                        {LEVELS.slice(1).map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Certificate URL (optional)</label>
                                <input value={form.certificate_url} onChange={e => setForm(p => ({ ...p, certificate_url: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-400" />
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 flex items-center justify-center gap-2 disabled:opacity-60">
                                {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Trophy size={15} />}
                                Tag Achievement
                            </button>
                        </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
