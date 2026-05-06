import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Users, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
    RefreshCw, AlertCircle, GraduationCap, Building2, Clock,
    Mail, Phone, Hash, Award, ChevronUp, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../config';

interface ClubMembership {
    club_name: string;
    category: string;
    membership_role: string;
    designation: string;
    cca_hours: number;
    cca_marks_total: number;
}

interface StudentRecord {
    _id: string;
    name: string;
    email: string;
    roll_no: string;
    department: string;
    year: number;
    division: string;
    mobile_no: string;
    prn: string;
    clubs_count: number;
    clubs: ClubMembership[];
    total_cca_hours: number;
    total_cca_marks: number;
    primary_club: string | null;
    joined_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface FilterOptions {
    departments: string[];
    years: { year: number; count: number }[];
}

const YEAR_LABELS: Record<number, string> = {
    1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year',
};

const YEAR_COLORS: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    2: { bg: 'bg-blue-50', text: 'text-blue-700' },
    3: { bg: 'bg-purple-50', text: 'text-purple-700' },
    4: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

const cardClass = 'bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm';

export const AllMembersView: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);

    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ departments: [], years: [] });

    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchStudents = useCallback(async (page = 1) => {
        if (!token) return;
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '25',
            });
            if (search) params.set('search', search);
            if (deptFilter !== 'All') params.set('department', deptFilter);
            if (yearFilter !== 'All') params.set('year', yearFilter);

            const res = await fetch(`${API}/admin/all-students?${params}`, { headers });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to fetch students');

            setStudents(data.students || []);
            setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 0 });
            setFilterOptions(data.filters || { departments: [], years: [] });
        } catch (err: any) {
            setError(err.message || 'Failed to connect to server');
            toast.error(err.message || 'Failed to load students');
        } finally {
            setIsLoading(false);
        }
    }, [token, search, deptFilter, yearFilter]);

    useEffect(() => {
        fetchStudents(1);
    }, [deptFilter, yearFilter]);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchStudents(1);
        }, 400);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [search]);

    const handleExportCSV = () => {
        if (students.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Name', 'Email', 'Roll No', 'PRN', 'Department', 'Year', 'Division', 'Mobile', 'Clubs', 'CCA Hours', 'CCA Marks', 'Primary Club'];
        const rows = students.map(s => [
            s.name,
            s.email,
            s.roll_no,
            s.prn,
            s.department,
            s.year,
            s.division,
            s.mobile_no,
            s.clubs.map(c => c.club_name).join('; '),
            s.total_cca_hours,
            s.total_cca_marks,
            s.primary_club || '',
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clubsync_students_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported successfully!');
    };

    // Summary stats from pagination + filter options
    const totalStudents = pagination.total;
    const totalYears = filterOptions.years;

    if (error && students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-gray-600 font-semibold">{error}</p>
                <button onClick={() => fetchStudents(1)}
                    className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors">
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
                    <h2 className="text-2xl font-bold text-gray-900">All Members</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Complete directory of {totalStudents.toLocaleString()} registered student{totalStudents !== 1 ? 's' : ''} across all clubs
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Download size={15} /> Export CSV
                    </button>
                    <button onClick={() => fetchStudents(pagination.page)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${cardClass} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900">{isLoading ? '...' : totalStudents.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total Students</p>
                    </div>
                </div>
                <div className={`${cardClass} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900">{isLoading ? '...' : filterOptions.departments.length}</p>
                        <p className="text-xs text-gray-500">Departments</p>
                    </div>
                </div>
                {totalYears.slice(0, 2).map(y => (
                    <div key={y.year} className={`${cardClass} p-4 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-xl ${YEAR_COLORS[y.year]?.bg || 'bg-gray-50'} ${YEAR_COLORS[y.year]?.text || 'text-gray-600'} flex items-center justify-center`}>
                            <GraduationCap size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{isLoading ? '...' : y.count.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{YEAR_LABELS[y.year] || `Year ${y.year}`}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, roll no, email, or PRN..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer min-w-[140px]">
                            <option value="All">All Depts</option>
                            {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-400 appearance-none cursor-pointer min-w-[120px]">
                            <option value="All">All Years</option>
                            {filterOptions.years.map(y => (
                                <option key={y.year} value={String(y.year)}>{YEAR_LABELS[y.year] || `Year ${y.year}`} ({y.count})</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={`${cardClass} overflow-hidden`}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mr-3" />
                        <span className="font-medium">Loading students...</span>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Users size={36} className="mb-3 opacity-40" />
                        <p className="font-semibold text-lg">No students found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Student</th>
                                    <th className="px-4 py-4 font-semibold">Roll No</th>
                                    <th className="px-4 py-4 font-semibold">Department</th>
                                    <th className="px-4 py-4 font-semibold">Year</th>
                                    <th className="px-4 py-4 font-semibold">Clubs</th>
                                    <th className="px-4 py-4 font-semibold">CCA Hours</th>
                                    <th className="px-4 py-4 font-semibold">CCA Marks</th>
                                    <th className="px-4 py-4 font-semibold text-center">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {students.map(s => {
                                    const isExpanded = expandedId === s._id;
                                    const yearColor = YEAR_COLORS[s.year] || { bg: 'bg-gray-50', text: 'text-gray-700' };

                                    return (
                                        <React.Fragment key={s._id}>
                                            <tr
                                                className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-teal-50/20' : ''}`}
                                                onClick={() => setExpandedId(isExpanded ? null : s._id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                            {s.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                                                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-mono text-gray-700 text-xs">{s.roll_no || '—'}</td>
                                                <td className="px-4 py-4 text-gray-600 text-xs font-medium">{s.department || '—'}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${yearColor.bg} ${yearColor.text}`}>
                                                        {YEAR_LABELS[s.year] || `Yr ${s.year}`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        s.clubs_count > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-500'
                                                    }`}>
                                                        <Building2 size={12} />
                                                        {s.clubs_count}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="font-bold text-teal-700">{s.total_cca_hours}</span>
                                                    <span className="text-gray-400 text-xs"> hrs</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 rounded-full bg-gray-100">
                                                            <div
                                                                className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
                                                                style={{ width: `${Math.min((s.total_cca_marks / 25) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">{s.total_cca_marks}/25</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-teal-600">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Detail Row */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="px-0 py-0">
                                                        <div className="bg-gradient-to-r from-teal-50/40 to-indigo-50/40 px-6 py-5 border-t border-b border-teal-100/50 animate-in slide-in-from-top-2 duration-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                                {/* Contact Info */}
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                                                                    <div className="space-y-1.5">
                                                                        <p className="flex items-center gap-2 text-sm text-gray-600">
                                                                            <Mail size={13} className="text-gray-400" />
                                                                            {s.email}
                                                                        </p>
                                                                        {s.mobile_no && (
                                                                            <p className="flex items-center gap-2 text-sm text-gray-600">
                                                                                <Phone size={13} className="text-gray-400" />
                                                                                {s.mobile_no}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {/* Academic Info */}
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic</p>
                                                                    <div className="space-y-1.5">
                                                                        {s.prn && (
                                                                            <p className="flex items-center gap-2 text-sm text-gray-600">
                                                                                <Hash size={13} className="text-gray-400" />
                                                                                PRN: {s.prn}
                                                                            </p>
                                                                        )}
                                                                        {s.division && (
                                                                            <p className="flex items-center gap-2 text-sm text-gray-600">
                                                                                <GraduationCap size={13} className="text-gray-400" />
                                                                                Division: {s.division}
                                                                            </p>
                                                                        )}
                                                                        <p className="flex items-center gap-2 text-sm text-gray-600">
                                                                            <Clock size={13} className="text-gray-400" />
                                                                            Joined: {new Date(s.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Primary Club */}
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Primary Club</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Award size={16} className={s.primary_club ? 'text-teal-500' : 'text-gray-300'} />
                                                                        <span className={`text-sm font-medium ${s.primary_club ? 'text-teal-700' : 'text-gray-400 italic'}`}>
                                                                            {s.primary_club || 'Not Set'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Club Memberships */}
                                                            {s.clubs.length > 0 ? (
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Club Memberships ({s.clubs.length})</p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {s.clubs.map((c, idx) => (
                                                                            <div key={idx} className="bg-white/70 rounded-xl px-4 py-3 border border-white/60 flex items-center justify-between gap-2">
                                                                                <div className="min-w-0">
                                                                                    <p className="font-semibold text-gray-900 text-sm truncate">{c.club_name}</p>
                                                                                    <p className="text-xs text-gray-500">
                                                                                        {c.designation} · {c.membership_role}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-right shrink-0">
                                                                                    <p className="text-xs font-bold text-teal-600">{c.cca_hours}h</p>
                                                                                    <p className="text-[10px] text-gray-400">{c.cca_marks_total}/25</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-400 italic">No approved club memberships</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                            <span className="font-semibold text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                            <span className="font-semibold text-gray-700">{pagination.total.toLocaleString()}</span> students
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchStudents(pagination.page - 1)}
                                disabled={pagination.page <= 1 || isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                let pageNum: number;
                                if (pagination.pages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.pages - 2) {
                                    pageNum = pagination.pages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchStudents(pageNum)}
                                        disabled={isLoading}
                                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                                            pageNum === pagination.page
                                                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => fetchStudents(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages || isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
