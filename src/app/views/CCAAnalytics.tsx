import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Download,
  Filter,
  TrendingUp,
  Award,
  Users,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface StudentReport {
  _id: string;
  name: string;
  roll_no: string;
  department: string;
  year: number;
  clubs_count: number;
  total_cca_hours: number;
  total_cca_marks: number;
}

interface DeptData {
  name: string;
  fullName: string;
  active: number;
  top: number;
  totalStudents: number;
}

interface RubricData {
  subject: string;
  A: number;
  fullMark: number;
}

interface Summary {
  avgMarks: number;
  efficiency: number;
  grade: string;
  totalStudents: number;
}

export const CCAAnalytics: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [students, setStudents] = useState<StudentReport[]>([]);
  const [departmentData, setDepartmentData] = useState<DeptData[]>([]);
  const [rubricData, setRubricData] = useState<RubricData[]>([]);
  const [summary, setSummary] = useState<Summary>({ avgMarks: 0, efficiency: 0, grade: 'N/A', totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'marks' | 'hours'>('marks');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/cca-report`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setDepartmentData(data.departmentData || []);
        setRubricData(data.rubricData || []);
        setSummary(data.summary || { avgMarks: 0, efficiency: 0, grade: 'N/A', totalStudents: 0 });
      } else {
        setError(data.message || 'Failed to load CCA report');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Extract unique departments for filter
  const departments = ['All', ...new Set(students.map(s => s.department).filter(Boolean))];

  // Apply filters
  const filteredStudents = students
    .filter(s => deptFilter === 'All' || s.department === deptFilter)
    .filter(s => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => sortBy === 'marks'
      ? b.total_cca_marks - a.total_cca_marks
      : b.total_cca_hours - a.total_cca_hours
    );

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.error('No data to export');
      return;
    }

    const lines = [
      'Roll Number,Student Name,Department,Year,Clubs,CCA Hours,CCA Marks (/25)',
      ...filteredStudents.map(s =>
        `${s.roll_no},"${s.name}",${s.department},${s.year},${s.clubs_count},${s.total_cca_hours},${s.total_cca_marks}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cca-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CCA report exported');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Institutional Reporting</h2>
          <p className="text-gray-500">Comprehensive analytics for CCA and club performance.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Download size={18} />
            Export All Reports
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchReport} className="ml-auto text-red-600 font-bold hover:underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CCA Rubric Performance (Radar Chart) */}
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="text-indigo-600" />
            CCA Rubric Analysis
          </h3>
          {loading ? (
            <div className="h-[350px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={rubricData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      name="Avg Performance"
                      dataKey="A"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-50 pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{summary.avgMarks}</p>
                  <p className="text-xs text-gray-500">Avg Marks</p>
                </div>
                <div className="text-center border-x border-gray-50">
                  <p className="text-2xl font-bold text-emerald-600">{summary.efficiency}%</p>
                  <p className="text-xs text-gray-500">Efficiency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{summary.grade}</p>
                  <p className="text-xs text-gray-500">Overall Grade</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Department-wise Participation */}
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-indigo-600" />
            Departmental Participation
          </h3>
          {loading ? (
            <div className="h-[350px] bg-gray-50 rounded-xl animate-pulse" />
          ) : departmentData.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-gray-400 text-sm">
              No department data yet. Enroll students into clubs to see stats.
            </div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="active" name="Active Students %" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="top" name="Top Achievers %" fill="#C7D2FE" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900">Detailed Student Reports</h3>
          <div className="flex gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all w-48"
              />
            </div>
            {/* Department filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 appearance-none cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>
            {/* Sort */}
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'marks' | 'hours')}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 appearance-none cursor-pointer"
              >
                <option value="marks">Sort by Marks</option>
                <option value="hours">Sort by Hours</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No students found</p>
            <p className="text-xs mt-1">
              {searchTerm || deptFilter !== 'All' ? 'Try adjusting your filters' : 'Students will appear once they register'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-8 py-5">Roll Number</th>
                  <th className="px-8 py-5">Student Name</th>
                  <th className="px-8 py-5">Department</th>
                  <th className="px-8 py-5 text-center">Clubs</th>
                  <th className="px-8 py-5 text-center">CCA Hours</th>
                  <th className="px-8 py-5 text-center">CCA Marks (/25)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredStudents.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-mono text-xs text-gray-500">{row.roll_no}</td>
                    <td className="px-8 py-5 font-bold text-gray-900">{row.name}</td>
                    <td className="px-8 py-5 text-gray-600">{row.department}</td>
                    <td className="px-8 py-5 text-center font-medium">{row.clubs_count}</td>
                    <td className="px-8 py-5 text-center font-medium">{row.total_cca_hours}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-lg font-bold ${
                        row.total_cca_marks >= 20 ? 'bg-emerald-50 text-emerald-700' :
                        row.total_cca_marks >= 15 ? 'bg-indigo-50 text-indigo-700' :
                        row.total_cca_marks >= 1 ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {row.total_cca_marks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredStudents.length > 0 && (
          <div className="p-4 border-t border-gray-50 text-xs text-gray-400 text-center">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        )}
      </div>
    </div>
  );
};
