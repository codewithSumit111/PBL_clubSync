import React from 'react';
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
  PieChart as PieIcon,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';

export const CCAAnalytics: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [studentsData, setStudentsData] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStudentsData(data.students);
        }
      } catch (err) {
        console.error('Error fetching students', err);
      }
    };
    if (user?.role === 'Admin') fetchStudents();
  }, [user, token]);

  // Mock data for student CCA marks
  const ccaData = [
    { subject: 'Participation', A: 4.5, fullMark: 5 },
    { subject: 'Leadership', A: 3.0, fullMark: 5 },
    { subject: 'Discipline', A: 5.0, fullMark: 5 },
    { subject: 'Skill Dev', A: 4.2, fullMark: 5 },
    { subject: 'Impact', A: 3.8, fullMark: 5 },
  ];

  const departmentData = [
    { name: 'CS', active: 85, top: 45 },
    { name: 'EC', active: 72, top: 30 },
    { name: 'ME', active: 65, top: 25 },
    { name: 'CV', active: 58, top: 18 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Reporting</h2>
          <p className="text-slate-500 mt-1 font-medium">Comprehensive analytics for CCA and club performance.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 outline-none">
          <Download size={18} strokeWidth={2.5} />
          Export All Reports
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CCA Rubric Performance (Radar Chart) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award size={120} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award size={20} strokeWidth={2.5} />
            </div>
            CCA Rubric Analysis
          </h3>
          <div className="h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={ccaData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Student Performance"
                  dataKey="A"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="#4F46E5"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 600 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 relative z-10">
            <div className="text-center group-hover:-translate-y-1 transition-transform">
              <p className="text-3xl font-black text-slate-900 tracking-tight">20.5</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Marks</p>
            </div>
            <div className="text-center border-x border-slate-100 group-hover:-translate-y-1 transition-transform delay-75">
              <p className="text-3xl font-black text-emerald-600 tracking-tight">82%</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Efficiency</p>
            </div>
            <div className="text-center group-hover:-translate-y-1 transition-transform delay-150">
              <p className="text-3xl font-black text-indigo-600 tracking-tight">A+</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Grade</p>
            </div>
          </div>
        </div>

        {/* Department-wise Participation */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={120} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Users size={20} strokeWidth={2.5} />
            </div>
            Departmental Participation
          </h3>
          <div className="h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 600 }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
                <Bar dataKey="active" name="Active Students %" fill="#4F46E5" radius={[0, 8, 8, 0]} barSize={24} />
                <Bar dataKey="top" name="Top Achievers %" fill="#818cf8" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-8 border-b border-slate-100/80 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Detailed Student Reports</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <select className="pl-11 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 shadow-sm appearance-none cursor-pointer">
                <option>All Departments</option>
                <option>Computer Science</option>
                <option>Electronics</option>
              </select>
            </div>
            <div className="relative group">
              <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <select className="pl-11 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 shadow-sm appearance-none cursor-pointer">
                <option>Sort by Marks</option>
                <option>Sort by Hours</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-5">Roll Number</th>
                <th className="px-8 py-5">Student Name</th>
                <th className="px-8 py-5">Department</th>
                <th className="px-8 py-5 text-center">CCA Hours</th>
                <th className="px-8 py-5 text-center">CCA Marks (/25)</th>
                <th className="px-8 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {studentsData.length > 0 ? studentsData.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-mono text-xs text-gray-500">{row.roll}</td>
                  <td className="px-8 py-5 font-bold text-gray-900">{row.name}</td>
                  <td className="px-8 py-5 text-gray-600">{row.dept}</td>
                  <td className="px-8 py-5 text-center font-medium">{row.hours}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg font-bold ${row.marks >= 20 ? 'bg-emerald-50 text-emerald-700' :
                      row.marks >= 15 ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                      {row.marks}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button className="text-indigo-600 font-bold hover:underline">View File</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-5 text-center text-gray-500">
                    No student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
