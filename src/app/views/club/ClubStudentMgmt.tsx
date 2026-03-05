import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Users, Search, CheckCircle2, XCircle, Clock,
    Filter, ChevronDown, UserCheck, Building2, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api';

interface PendingStudent {
    _id: string;
    name: string;
    roll_no: string;
    department: string;
    year: number;
    email: string;
    preference_order?: number;
}

interface Member {
    _id: string;
    name: string;
    roll_no: string;
    department: string;
    year: number;
    email: string;
    cca_hours: number;
    cca_marks: number;
}

const YEAR_LABELS: Record<number, string> = {
    1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year',
};

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

export const ClubStudentMgmt: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [tab, setTab] = useState<'pending' | 'members'>('pending');
    const [pending, setPending] = useState<PendingStudent[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [pendRes, memRes] = await Promise.all([
                fetch(`${API}/clubs/pending`, { headers }),
                fetch(`${API}/clubs/members`, { headers }),
            ]);
            const [pendData, memData] = await Promise.all([pendRes.json(), memRes.json()]);

            if (!pendRes.ok) throw new Error(pendData.message || 'Failed to fetch pending applications');
            if (!memRes.ok) throw new Error(memData.message || 'Failed to fetch members');

            setPending(pendData.students || []);
            setMembers(memData.members || []);
        } catch (err: any) {
            setError(err.message || 'Failed to connect to server');
            toast.error(err.message || 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleApplication = async (studentId: string, status: 'Approved' | 'Rejected') => {
        setActionLoading(studentId + status);
        try {
            const res = await fetch(`${API}/clubs/applications/${studentId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Action failed');
            toast.success(`Application ${status.toLowerCase()} successfully!`);
            setPending(prev => prev.filter(s => s._id !== studentId));
            if (status === 'Approved') {
                // Refetch members to pick up the newly approved student
                const memRes = await fetch(`${API}/clubs/members`, { headers });
                const memData = await memRes.json();
                if (memData.success) setMembers(memData.members || []);
            }
        } catch (err: any) {
            toast.error(err.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const allStudents = [...pending, ...members];
    const departments = ['All', ...Array.from(new Set(allStudents.map(s => s.department).filter(Boolean)))];

    const filteredPending = pending.filter(s =>
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.toLowerCase().includes(search.toLowerCase())) &&
        (deptFilter === 'All' || s.department === deptFilter)
    );

    const filteredMembers = members.filter(s =>
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.toLowerCase().includes(search.toLowerCase())) &&
        (deptFilter === 'All' || s.department === deptFilter)
    );

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchAll} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage applications and club members</p>
                </div>
                <button onClick={fetchAll}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Pending Applications', value: pending.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Members', value: members.length, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
                    { label: 'Departments', value: departments.length - 1, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className={`${cardClass} p-4 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{isLoading ? '...' : stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs + Filters */}
            <div className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
                <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-gray-50 p-1 gap-1">
                    {(['pending', 'members'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t ? 'bg-teal-500 text-white shadow' : 'text-gray-500 hover:text-gray-800'
                                }`}>
                            {t === 'pending' ? `Pending (${pending.length})` : `Members (${members.length})`}
                        </button>
                    ))}
                </div>
                <div className="flex-1 flex gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or roll no..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 transition-colors" />
                    </div>
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer">
                            {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={`${cardClass} overflow-hidden`}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mr-2" /> Loading from database...
                    </div>
                ) : tab === 'pending' ? (
                    filteredPending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Clock size={32} className="mb-2 opacity-40" />
                            <p className="font-medium">No pending applications</p>
                            <p className="text-sm">New requests will appear here automatically</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Roll No</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Year</th>
                                        <th className="px-6 py-4">Preference</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {filteredPending.map(s => (
                                        <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {s.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{s.name}</p>
                                                        <p className="text-xs text-gray-400">{s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-700 text-xs">{s.roll_no || '—'}</td>
                                            <td className="px-6 py-4 text-gray-600">{s.department || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                                                    {YEAR_LABELS[s.year] || `Year ${s.year}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.preference_order
                                                    ? <span className="text-xs font-bold text-gray-500">#{s.preference_order}</span>
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleApplication(s._id, 'Approved')}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">
                                                        {actionLoading === s._id + 'Approved'
                                                            ? <RefreshCw size={12} className="animate-spin" />
                                                            : <CheckCircle2 size={13} />}
                                                        Approve
                                                    </button>
                                                    <button onClick={() => handleApplication(s._id, 'Rejected')}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                                                        {actionLoading === s._id + 'Rejected'
                                                            ? <RefreshCw size={12} className="animate-spin" />
                                                            : <XCircle size={13} />}
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    filteredMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Users size={32} className="mb-2 opacity-40" />
                            <p className="font-medium">No members yet</p>
                            <p className="text-sm">Approve students to add them as members</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Member</th>
                                        <th className="px-6 py-4">Roll No</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Year</th>
                                        <th className="px-6 py-4">CCA Hours</th>
                                        <th className="px-6 py-4">CCA Marks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {filteredMembers.map(m => (
                                        <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {m.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{m.name}</p>
                                                        <p className="text-xs text-gray-400">{m.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-700 text-xs">{m.roll_no || '—'}</td>
                                            <td className="px-6 py-4 text-gray-600">{m.department || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                                                    {YEAR_LABELS[m.year] || `Year ${m.year}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-teal-700">{m.cca_hours ?? 0}</span>
                                                <span className="text-gray-400 text-xs"> hrs</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 rounded-full bg-gray-100">
                                                        <div className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500"
                                                            style={{ width: `${Math.min(((m.cca_marks ?? 0) / 25) * 100, 100)}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{m.cca_marks ?? 0}/25</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
