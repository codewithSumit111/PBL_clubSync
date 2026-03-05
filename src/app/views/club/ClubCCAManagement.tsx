import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Award, Clock, Search, Save, AlertCircle,
    RefreshCw, BookOpen, Star, Target, Users, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api';

interface Rubric {
    name: string; maxMarks: number; icon: React.ElementType;
    color: string; key: string;
}
const RUBRICS: Rubric[] = [
    { name: 'Participation', maxMarks: 5, icon: Users, color: 'text-blue-600', key: 'participation' },
    { name: 'Leadership', maxMarks: 5, icon: Star, color: 'text-amber-600', key: 'leadership' },
    { name: 'Discipline', maxMarks: 5, icon: Target, color: 'text-red-600', key: 'discipline' },
    { name: 'Skill Development', maxMarks: 5, icon: Zap, color: 'text-purple-600', key: 'skill_development' },
    { name: 'Impact / Outcome', maxMarks: 5, icon: Award, color: 'text-teal-600', key: 'impact' },
];

interface MemberCCA {
    _id: string; name: string; roll_no: string; department: string;
    year: number; cca_hours: number; cca_marks: number; rubric_marks: Record<string, number>;
    logbooks_pending: number;
}
interface Logbook {
    _id: string;
    student_id: { name: string } | string;
    activity_description: string;
    date: string;
    hours: number;
    status: string;
}

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

export const ClubCCAManagement: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [members, setMembers] = useState<MemberCCA[]>([]);
    const [logbooks, setLogbooks] = useState<Logbook[]>([]);
    const [selected, setSelected] = useState<MemberCCA | null>(null);
    const [editMarks, setEditMarks] = useState<Record<string, number>>({});
    const [editHours, setEditHours] = useState<number>(0);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/clubs/members`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load members');
            setMembers(data.members || []);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchLogbooks = useCallback(async () => {
        setLogLoading(true);
        try {
            const res = await fetch(`${API}/logbooks/club`, { headers });
            const data = await res.json();
            if (res.ok) setLogbooks(data.logbooks || []);
        } catch { /* logbooks are secondary — don't block */ }
        finally { setLogLoading(false); }
    }, [token]);

    useEffect(() => { fetchMembers(); fetchLogbooks(); }, [fetchMembers, fetchLogbooks]);

    const openMember = (m: MemberCCA) => {
        setSelected(m);
        setEditMarks(m.rubric_marks || {});
        setEditHours(m.cca_hours || 0);
    };

    const totalMarks = () => RUBRICS.reduce((sum, r) => sum + (editMarks[r.key] ?? 0), 0);

    const saveMarks = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const res = await fetch(`${API}/clubs/students/${selected._id}/cca`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ rubric_marks: editMarks, cca_hours: editHours }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save marks');
            toast.success(`CCA marks saved for ${selected.name}`);
            setMembers(prev => prev.map(m => m._id === selected._id
                ? { ...m, rubric_marks: editMarks, cca_hours: editHours, cca_marks: totalMarks() }
                : m
            ));
            setSelected(null);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateLogbookStatus = async (logId: string, status: 'Approved' | 'Rejected') => {
        try {
            const res = await fetch(`${API}/logbooks/${logId}/status`, {
                method: 'PUT', headers, body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update logbook');
            toast.success(`Logbook ${status.toLowerCase()}`);
            setLogbooks(prev => prev.map(l => l._id === logId ? { ...l, status } : l));
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const filtered = members.filter(m =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.roll_no?.toLowerCase().includes(search.toLowerCase())
    );

    if (error && members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchMembers} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">CCA & Marks Management</h2>
                <p className="text-gray-500 text-sm mt-1">Update CCA hours and rubric-based marks for your members</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Member List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className={`${cardClass} p-4`}>
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors" />
                        </div>
                    </div>

                    <div className={`${cardClass} overflow-hidden max-h-[60vh] overflow-y-auto`}>
                        {loading ? (
                            <div className="flex items-center justify-center py-10 text-gray-400">
                                <RefreshCw size={18} className="animate-spin mr-2" /> Loading...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Users size={28} className="mb-2 opacity-40" />
                                <p className="text-sm">No members found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filtered.map(m => {
                                    const total = RUBRICS.reduce((s, r) => s + (m.rubric_marks?.[r.key] ?? 0), 0);
                                    return (
                                        <button key={m._id} onClick={() => openMember(m)}
                                            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-teal-50/50 transition-colors ${selected?._id === m._id ? 'bg-teal-50 border-l-2 border-teal-500' : ''}`}>
                                            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                                                {m.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{m.roll_no}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                                        <div className="h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                                                            style={{ width: `${(total / 25) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600">{total}/25</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Editor + Logbooks */}
                <div className="lg:col-span-2 space-y-4">
                    {selected ? (
                        <div className={`${cardClass} p-6`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                    {selected.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{selected.name}</h3>
                                    <p className="text-sm text-gray-500">{selected.roll_no} · {selected.department}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-3xl font-black text-teal-600">{totalMarks()}<span className="text-sm font-normal text-gray-400">/25</span></p>
                                    <p className="text-xs text-gray-400">Total CCA Marks</p>
                                </div>
                            </div>

                            <div className="w-full h-3 bg-gray-100 rounded-full mb-6">
                                <div className="h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(totalMarks() / 25) * 100}%`, background: 'linear-gradient(90deg, #0d9488, #10b981)', boxShadow: '0 0 8px rgba(13,148,136,0.3)' }} />
                            </div>

                            {/* CCA Hours */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock size={15} className="text-blue-600" /> CCA Hours
                                </label>
                                <input type="number" min={0} max={500} value={editHours}
                                    onChange={e => setEditHours(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-32 px-3 py-2 text-lg font-bold bg-white border border-blue-200 rounded-xl outline-none focus:border-teal-400 text-center" />
                                <span className="text-sm text-gray-500 ml-2">hours total</span>
                            </div>

                            {/* Rubrics */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Rubric Marks (5 each)</h4>
                                {RUBRICS.map(r => (
                                    <div key={r.key} className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 w-44 shrink-0">
                                            <r.icon size={16} className={r.color} />
                                            <span className="text-sm font-medium text-gray-700">{r.name}</span>
                                        </div>
                                        <div className="flex-1 flex items-center gap-3">
                                            <input type="range" min={0} max={5} step={1}
                                                value={editMarks[r.key] ?? 0}
                                                onChange={e => setEditMarks(prev => ({ ...prev, [r.key]: parseInt(e.target.value) }))}
                                                className="flex-1 h-2 accent-teal-500" />
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button key={i} type="button"
                                                        onClick={() => setEditMarks(prev => ({ ...prev, [r.key]: i + 1 }))}
                                                        className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all duration-150 ${i < (editMarks[r.key] ?? 0)
                                                                ? 'bg-teal-500 text-white border-teal-500 shadow'
                                                                : 'bg-white text-gray-400 border-gray-200 hover:border-teal-300'
                                                            }`}>
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 w-8 text-center">{editMarks[r.key] ?? 0}/5</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button onClick={saveMarks} disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200 disabled:opacity-60">
                                    {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                                    Save Marks
                                </button>
                                <button onClick={() => setSelected(null)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`${cardClass} p-12 flex flex-col items-center justify-center text-gray-400`}>
                            <Award size={48} className="mb-4 opacity-30" />
                            <p className="font-semibold text-lg">Select a member to edit CCA marks</p>
                            <p className="text-sm">Choose from the list on the left</p>
                        </div>
                    )}

                    {/* Logbook Review */}
                    <div className={`${cardClass} overflow-hidden`}>
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen size={16} className="text-teal-600" /> Logbook Review
                            </h3>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                                {logbooks.filter(l => l.status === 'Pending').length} Pending
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                            {logLoading ? (
                                <div className="flex items-center justify-center py-8 text-gray-400">
                                    <RefreshCw size={18} className="animate-spin mr-2" /> Loading logbooks...
                                </div>
                            ) : logbooks.length === 0 ? (
                                <div className="flex flex-col items-center py-8 text-gray-400">
                                    <BookOpen size={24} className="mb-2 opacity-40" />
                                    <p className="text-sm">No logbook entries submitted yet</p>
                                </div>
                            ) : logbooks.map(l => {
                                const studentName = typeof l.student_id === 'object' ? l.student_id.name : 'Student';
                                return (
                                    <div key={l._id} className="px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {studentName} — {l.activity_description}
                                            </p>
                                            <p className="text-xs text-gray-400">{new Date(l.date).toLocaleDateString()} · {l.hours}h</p>
                                        </div>
                                        {l.status === 'Pending' ? (
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={() => updateLogbookStatus(l._id, 'Approved')}
                                                    className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600">
                                                    Approve
                                                </button>
                                                <button onClick={() => updateLogbookStatus(l._id, 'Rejected')}
                                                    className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100">
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                {l.status}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
