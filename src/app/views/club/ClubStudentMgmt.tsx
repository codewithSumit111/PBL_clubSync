import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Users, Search, CheckCircle2, XCircle, Clock,
    Filter, ChevronDown, UserCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';

interface PendingStudent {
    _id: string;
    name: string;
    roll_no: string;
    department: string;
    year: number;
    email: string;
    preference_order?: number;
    appliedAt?: string;
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
    membership_role: 'member' | 'coordinator';
    designation: string;
    coordinator_scopes: string[];
    rubric_marks?: {
        participation: number;
        leadership: number;
        discipline: number;
        skill_development: number;
        impact: number;
    };
}

interface Props {
    clubId?: string;
    embedded?: boolean;
}

const COORDINATOR_SCOPES = [
    'EVENT_MANAGER',
    'ATTENDANCE_MANAGER',
    'CCA_MANAGER',
    'LOGBOOK_REVIEWER',
    'MEMBER_ADMIN',
];

const YEAR_LABELS: Record<number, string> = {
    1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year',
};

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

const CCAModal: React.FC<{
    member: Member;
    onClose: () => void;
    onSave: (stats: { cca_hours: number; rubric_marks: any }) => void;
    isSaving: boolean;
}> = ({ member, onClose, onSave, isSaving }) => {
    const [hours, setHours] = useState(member.cca_hours);
    const [marks, setMarks] = useState(member.rubric_marks || {
        participation: 0,
        leadership: 0,
        discipline: 0,
        skill_development: 0,
        impact: 0,
    });

    const categories = [
        { key: 'participation', label: 'Participation' },
        { key: 'leadership', label: 'Leadership & Initiative' },
        { key: 'discipline', label: 'Discipline & Conduct' },
        { key: 'skill_development', label: 'Skill Development' },
        { key: 'impact', label: 'Impact & Achievement' },
    ];

    const total = Object.values(marks).reduce((s, v) => s + v, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`${cardClass} w-full max-w-md p-8 shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-indigo-500" />
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Manage CCA Stats</h3>
                <p className="text-sm text-gray-500 mb-6">Updating stats for <span className="text-teal-600 font-semibold">{member.name}</span></p>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Total Hours</label>
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gray-400" />
                            <input
                                type="number"
                                value={hours}
                                onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-teal-400 transition-all font-semibold"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Performance Rubric (0-5)</label>
                        {categories.map(cat => (
                            <div key={cat.key} className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={marks[cat.key as keyof typeof marks]}
                                    onChange={e => setMarks({ ...marks, [cat.key]: Math.min(5, Math.max(0, parseInt(e.target.value) || 0)) })}
                                    className="w-16 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-center font-bold text-teal-600 outline-none focus:border-teal-400 transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Outcome</p>
                            <p className="text-2xl font-bold text-gray-900">{total} <span className="text-sm text-gray-400">/ 25</span></p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                            <button
                                onClick={() => onSave({ cca_hours: hours, rubric_marks: marks })}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : 'Save stats'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CouncilModal: React.FC<{
    member: Member;
    designationTemplates: string[];
    onClose: () => void;
    onSave: (payload: { membership_role: 'member' | 'coordinator'; designation: string; coordinator_scopes: string[] }) => void;
    isSaving: boolean;
}> = ({ member, designationTemplates, onClose, onSave, isSaving }) => {
    const [membershipRole, setMembershipRole] = useState<'member' | 'coordinator'>(member.membership_role || 'member');
    const [designation, setDesignation] = useState(member.designation || 'Member Only');
    const [scopes, setScopes] = useState<string[]>(member.coordinator_scopes || []);

    const toggleScope = (scope: string) => {
        setScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
    };

    useEffect(() => {
        if (membershipRole === 'member') {
            setScopes([]);
        }
    }, [membershipRole]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`${cardClass} w-full max-w-lg p-8 shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 to-teal-500" />

                <h3 className="text-xl font-bold text-gray-900 mb-2">Council Role & Designation</h3>
                <p className="text-sm text-gray-500 mb-6">Update role settings for <span className="text-indigo-600 font-semibold">{member.name}</span></p>

                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Membership Role</label>
                        <select
                            value={membershipRole}
                            onChange={e => setMembershipRole(e.target.value as 'member' | 'coordinator')}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 transition-all font-semibold"
                        >
                            <option value="member">Member</option>
                            <option value="coordinator">Coordinator</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Designation</label>
                        <select
                            value={designation}
                            onChange={e => setDesignation(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 transition-all font-semibold"
                        >
                            {(designationTemplates.length ? designationTemplates : ['Member Only']).map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Coordinator Permissions</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {COORDINATOR_SCOPES.map(scope => (
                                <label key={scope} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${membershipRole === 'coordinator' ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                    <input
                                        type="checkbox"
                                        checked={scopes.includes(scope)}
                                        onChange={() => toggleScope(scope)}
                                        disabled={membershipRole !== 'coordinator'}
                                    />
                                    <span>{scope}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                        <button
                            onClick={() => onSave({
                                membership_role: membershipRole,
                                designation,
                                coordinator_scopes: membershipRole === 'coordinator' ? scopes : [],
                            })}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : 'Save role'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ClubStudentMgmt: React.FC<Props> = ({ clubId, embedded = false }) => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const isMissingClubContext = embedded && !clubId;
    const [tab, setTab] = useState<'pending' | 'members'>(embedded ? 'members' : 'pending');
    const [pending, setPending] = useState<PendingStudent[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editingCouncilMember, setEditingCouncilMember] = useState<Member | null>(null);
    const [designationTemplates, setDesignationTemplates] = useState<string[]>(['Member Only']);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(async () => {
        if (!token || !['Club', 'Student'].includes(user?.role || '')) {
            return;
        }

        if (isMissingClubContext) {
            setError('Club context is missing. Please open this workspace from a club action in your dashboard.');
            setPending([]);
            setMembers([]);
            setDesignationTemplates(['Member Only']);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const memberQuery = clubId ? `?club_id=${encodeURIComponent(clubId)}` : '';
            const memRes = await fetch(`${API}/clubs/members${memberQuery}`, { headers });
            const memData = await memRes.json();

            if (!memRes.ok) throw new Error(memData.message || 'Failed to fetch members');

            setMembers(memData.members || []);

            if (user?.role === 'Club' && !embedded) {
                const pendRes = await fetch(`${API}/clubs/pending`, { headers });
                const pendData = await pendRes.json();
                if (!pendRes.ok) throw new Error(pendData.message || 'Failed to fetch pending applications');
                setPending(pendData.students || []);
            } else {
                setPending([]);
            }

            const configQuery = clubId ? `?club_id=${encodeURIComponent(clubId)}` : '';
            const configRes = await fetch(`${API}/clubs/council-config${configQuery}`, { headers });
            const configData = await configRes.json();
            if (configRes.ok && configData.success) {
                setDesignationTemplates(configData.designation_templates || ['Member Only']);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to connect to server');
            toast.error(err.message || 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    }, [token, user?.role, clubId, embedded, isMissingClubContext]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => {
        if (embedded) {
            setTab('members');
        }
    }, [embedded]);

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
                fetchAll();
            }
        } catch (err: any) {
            toast.error(err.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateCCA = async (data: { cca_hours: number; rubric_marks: any }) => {
        if (!editingMember) return;
        setActionLoading('updating-cca');
        try {
            const res = await fetch(`${API}/clubs/students/${editingMember._id}/cca`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...data, ...(clubId ? { club_id: clubId } : {}) }),
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.message || 'Update failed');
            toast.success('CCA stats updated successfully!');
            setEditingMember(null);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Update failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateCouncil = async (studentId: string, payload: { membership_role: 'member' | 'coordinator'; designation: string; coordinator_scopes: string[] }) => {
        setActionLoading(`updating-council-${studentId}`);
        try {
            const res = await fetch(`${API}/clubs/members/${studentId}/council`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...payload, ...(clubId ? { club_id: clubId } : {}) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update council role');
            toast.success('Council role updated successfully!');
            setEditingCouncilMember(null);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update council role');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveDesignationTemplates = async () => {
        setActionLoading('saving-designations');
        try {
            const res = await fetch(`${API}/clubs/council-config`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ designation_templates: designationTemplates, ...(clubId ? { club_id: clubId } : {}) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save templates');
            toast.success('Designation templates updated');
            setDesignationTemplates(data.designation_templates || designationTemplates);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save templates');
        } finally {
            setActionLoading(null);
        }
    };

    const allStudents = [...pending, ...members];
    const departments = ['All', ...Array.from(new Set(allStudents.map(s => s.department).filter(Boolean)))];

    const filteredPending = pending.filter(s =>
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.toLowerCase().includes(search.toLowerCase())) &&
        (deptFilter === 'All' || s.department === deptFilter)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const filteredMembers = members.filter(s =>
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.toLowerCase().includes(search.toLowerCase())) &&
        (deptFilter === 'All' || s.department === deptFilter)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                {!isMissingClubContext && (
                    <button onClick={fetchAll} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors">
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 ${embedded ? 'max-w-none' : ''}`}>
            {editingMember && (
                <CCAModal
                    member={editingMember}
                    onClose={() => setEditingMember(null)}
                    onSave={handleUpdateCCA}
                    isSaving={actionLoading === 'updating-cca'}
                />
            )}
            {editingCouncilMember && (
                <CouncilModal
                    member={editingCouncilMember}
                    designationTemplates={designationTemplates}
                    onClose={() => setEditingCouncilMember(null)}
                    onSave={(payload) => handleUpdateCouncil(editingCouncilMember._id, payload)}
                    isSaving={actionLoading === `updating-council-${editingCouncilMember._id}`}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {embedded ? 'Manage members and council roles for your club' : 'Manage applications and club members'}
                    </p>
                </div>
                <button onClick={fetchAll}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {!embedded && (
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Pending Applications', value: pending.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Members', value: members.length, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
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
            )}

            {/* Council Settings Panel */}
            <div className={`${cardClass} p-5 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Council Designation Settings</h3>
                        <p className="text-sm text-gray-500">Manage the designation list for your club members</p>
                    </div>
                    <button
                        onClick={handleSaveDesignationTemplates}
                        disabled={actionLoading === 'saving-designations'}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    >
                        {actionLoading === 'saving-designations' ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Save Templates
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {designationTemplates.map((designation, idx) => (
                        <div key={`${designation}-${idx}`} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 border border-indigo-100">
                            <input
                                value={designation}
                                onChange={(e) => setDesignationTemplates(prev => prev.map((item, index) => index === idx ? e.target.value : item))}
                                className="bg-transparent outline-none min-w-[120px]"
                            />
                            <button
                                type="button"
                                onClick={() => setDesignationTemplates(prev => prev.filter((_, index) => index !== idx))}
                                className="text-indigo-400 hover:text-indigo-700"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setDesignationTemplates(prev => [...prev, ''])}
                        className="inline-flex items-center gap-2 rounded-full border border-dashed border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                        + Add designation
                    </button>
                </div>
            </div>

            {/* Tabs + Filters */}
            <div className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
                <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-gray-50 p-1 gap-1">
                    {(embedded ? (['members'] as const) : (['pending', 'members'] as const)).map(t => (
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
                                        <th className="px-6 py-4">Applied On</th>
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
                                                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                    <Clock size={12} className="text-amber-400" />
                                                    {s.appliedAt ? new Date(s.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                                                </span>
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
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Roll No</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Year</th>
                                        <th className="px-6 py-4">CCA Hours</th>
                                        <th className="px-6 py-4">CCA Marks</th>
                                        <th className="px-6 py-4 text-center">Manage</th>
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
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                        {m.designation || 'Member Only'}
                                                    </span>
                                                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                                                        {m.membership_role || 'member'}
                                                    </p>
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingMember(m)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-teal-400 hover:text-teal-600 transition-all shadow-sm"
                                                    >
                                                        Manage CCA
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCouncilMember(m)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                                                    >
                                                        Council Role
                                                    </button>
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
