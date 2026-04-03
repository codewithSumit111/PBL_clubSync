import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    FileText, Download, Users, Building2, Hash,
    Filter, ChevronDown, RefreshCw, FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';

type ReportType = 'all_members' | 'dept_wise' | 'rollno_wise' | 'cca_summary';

interface ReportConfig {
    id: ReportType; title: string; description: string;
    icon: React.ElementType; color: string; bg: string;
}
const REPORT_CONFIGS: ReportConfig[] = [
    { id: 'all_members', title: 'All Members', description: 'Full list with CCA marks and hours', icon: Users, color: 'text-teal-700', bg: 'bg-teal-50' },
    { id: 'dept_wise', title: 'Department-wise', description: 'Members grouped by department', icon: Building2, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'rollno_wise', title: 'Roll No. Export', description: 'Sorted by roll number for admin submission', icon: Hash, color: 'text-purple-700', bg: 'bg-purple-50' },
    { id: 'cca_summary', title: 'CCA Rubric Detail', description: 'Rubric-wise breakdown of marks for every student', icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50' },
];

interface MemberRow {
    _id: string; roll_no: string; name: string; department: string;
    year: number; cca_hours: number; cca_marks: number;
    rubric_marks: { participation?: number; leadership?: number; discipline?: number; skill_development?: number; impact?: number };
}

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

export const ClubReports: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [selectedReport, setSelectedReport] = useState<ReportType>('all_members');
    const [deptFilter, setDeptFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

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

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const departments = ['All', ...Array.from(new Set(members.map(m => m.department).filter(Boolean)))];
    const years = ['All', '1', '2', '3', '4'];

    const filteredData = members.filter(m =>
        (deptFilter === 'All' || m.department === deptFilter) &&
        (yearFilter === 'All' || String(m.year) === yearFilter)
    );

    const sortedData = selectedReport === 'rollno_wise'
        ? [...filteredData].sort((a, b) => (a.roll_no || '').localeCompare(b.roll_no || ''))
        : selectedReport === 'dept_wise'
            ? [...filteredData].sort((a, b) => (a.department || '').localeCompare(b.department || ''))
            : filteredData;

    const downloadCSV = async () => {
        if (sortedData.length === 0) return toast.error('No data to export');
        setGenerating(true);
        try {
            const isCCA = selectedReport === 'cca_summary';
            const headers_row = [
                'Roll No', 'Name', 'Department', 'Year', 'CCA Hours',
                ...(isCCA ? ['Participation', 'Leadership', 'Discipline', 'Skill Dev', 'Impact'] : []),
                'Total Marks (/25)'
            ];
            const rows = sortedData.map(m => [
                m.roll_no || '', m.name || '', m.department || '', `${m.year}th Year`,
                m.cca_hours ?? 0,
                ...(isCCA ? [
                    m.rubric_marks?.participation ?? 0,
                    m.rubric_marks?.leadership ?? 0,
                    m.rubric_marks?.discipline ?? 0,
                    m.rubric_marks?.skill_development ?? 0,
                    m.rubric_marks?.impact ?? 0,
                ] : []),
                m.cca_marks ?? 0,
            ]);

            const csv = [headers_row, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${user?.clubName || 'club'}_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
            toast.success('Report exported successfully!');
        } catch { toast.error('Export failed'); }
        finally { setGenerating(false); }
    };

    if (error && members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={fetchMembers} className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold">Retry</button>
            </div>
        );
    }

    const YEAR_LABELS: Record<string, string> = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th' };
    const isCCA = selectedReport === 'cca_summary';
    const showDept = selectedReport === 'dept_wise' || selectedReport === 'all_members';

    const avgHours = sortedData.length > 0 ? (sortedData.reduce((s, r) => s + (r.cca_hours || 0), 0) / sortedData.length).toFixed(1) : '—';
    const avgMarks = sortedData.length > 0 ? (sortedData.reduce((s, r) => s + (r.cca_marks || 0), 0) / sortedData.length).toFixed(1) : '—';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports & Exports</h2>
                    <p className="text-gray-500 text-sm mt-1">Live data from your club members</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchMembers}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={downloadCSV} disabled={generating || loading || sortedData.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 shadow-lg shadow-teal-200 disabled:opacity-60">
                        {generating ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />} Export CSV
                    </button>
                </div>
            </div>

            {/* Report Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {REPORT_CONFIGS.map(r => (
                    <button key={r.id} onClick={() => setSelectedReport(r.id)}
                        className={`${cardClass} p-4 text-left hover:shadow-md transition-all duration-200 border-2 ${selectedReport === r.id ? 'border-teal-400 bg-teal-50/60' : 'border-white/50'
                            }`}>
                        <div className={`w-10 h-10 rounded-xl ${r.bg} ${r.color} flex items-center justify-center mb-3`}>
                            <r.icon size={20} />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{r.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{r.description}</p>
                        {selectedReport === r.id && <p className="mt-2 text-xs font-semibold text-teal-600">✓ Selected</p>}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className={`${cardClass} p-4 flex flex-wrap gap-3 items-center`}>
                <span className="text-sm font-semibold text-gray-600 flex items-center gap-2"><Filter size={14} /> Filters:</span>
                <div className="relative">
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer">
                        {departments.map(d => <option key={d}>Dept: {d}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer">
                        {years.map(y => <option key={y}>Year: {y === 'All' ? 'All' : `${YEAR_LABELS[y]} Year`}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <span className="text-xs text-gray-400 ml-auto">{sortedData.length} records</span>
            </div>

            {/* Table Preview */}
            <div className={`${cardClass} overflow-hidden`}>
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <FileSpreadsheet size={16} className="text-teal-600" />
                    <h3 className="font-bold text-gray-900">
                        {REPORT_CONFIGS.find(r => r.id === selectedReport)?.title} — Preview
                    </h3>
                    <span className="text-xs text-gray-400 ml-auto">{user?.clubName || 'Your Club'}</span>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mr-2" /> Loading from database...
                    </div>
                ) : sortedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Users size={32} className="mb-2 opacity-40" />
                        <p className="font-medium">No members match the selected filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Roll No</th>
                                    <th className="px-4 py-3">Name</th>
                                    {showDept && <th className="px-4 py-3">Dept</th>}
                                    <th className="px-4 py-3">Year</th>
                                    <th className="px-4 py-3">CCA Hrs</th>
                                    {isCCA && (<>
                                        <th className="px-4 py-3 text-center">Part.</th>
                                        <th className="px-4 py-3 text-center">Lead.</th>
                                        <th className="px-4 py-3 text-center">Disc.</th>
                                        <th className="px-4 py-3 text-center">Skill</th>
                                        <th className="px-4 py-3 text-center">Impact</th>
                                    </>)}
                                    <th className="px-4 py-3">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {sortedData.map((m, i) => (
                                    <tr key={m._id || i} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.roll_no || '—'}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                                        {showDept && (
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{m.department || '—'}</span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-gray-600">{m.year ? `${m.year}${['st', 'nd', 'rd', 'th'][Math.min(m.year - 1, 3)]} Year` : '—'}</td>
                                        <td className="px-4 py-3"><span className="font-bold text-teal-700">{m.cca_hours ?? 0}</span> <span className="text-gray-400 text-xs">h</span></td>
                                        {isCCA && (<>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.participation ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.leadership ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.discipline ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.skill_development ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">{m.rubric_marks?.impact ?? 0}</td>
                                        </>)}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-100 rounded-full">
                                                    <div className="h-2 rounded-full" style={{ width: `${((m.cca_marks ?? 0) / 25) * 100}%`, background: 'linear-gradient(90deg, #0d9488, #10b981)' }} />
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{m.cca_marks ?? 0}/25</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-teal-50 text-teal-800 text-sm font-bold">
                                <tr>
                                    <td className="px-4 py-3 font-black" colSpan={2}>AVERAGE</td>
                                    {showDept && <td />}
                                    <td />
                                    <td className="px-4 py-3">{avgHours} h</td>
                                    {isCCA && <><td /><td /><td /><td /><td /></>}
                                    <td className="px-4 py-3">{avgMarks}/25</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
