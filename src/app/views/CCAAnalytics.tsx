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
  const { user } = useSelector((state: RootState) => state.auth);
  
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Institutional Reporting</h2>
          <p className="text-gray-500">Comprehensive analytics for CCA and club performance.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Download size={18} />
          Export All Reports
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CCA Rubric Performance (Radar Chart) */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="text-indigo-600" />
            CCA Rubric Analysis
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={ccaData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Student Performance"
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
              <p className="text-2xl font-bold text-gray-900">20.5</p>
              <p className="text-xs text-gray-500">Total Marks</p>
            </div>
            <div className="text-center border-x border-gray-50">
              <p className="text-2xl font-bold text-emerald-600">82%</p>
              <p className="text-xs text-gray-500">Efficiency</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">A+</p>
              <p className="text-xs text-gray-500">Overall Grade</p>
            </div>
          </div>
        </div>

        {/* Department-wise Participation */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-indigo-600" />
            Departmental Participation
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="active" name="Active Students %" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="top" name="Top Achievers %" fill="#C7D2FE" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900">Detailed Student Reports</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none">
                <option>All Departments</option>
                <option>Computer Science</option>
                <option>Electronics</option>
              </select>
            </div>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none">
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
              {[
                { roll: 'CS001', name: 'Arjun Mehra', dept: 'Comp. Science', hours: 42.5, marks: 21 },
                { roll: 'CS002', name: 'Bhavna K.', dept: 'Comp. Science', hours: 38.0, marks: 19 },
                { roll: 'EC045', name: 'Chetan S.', dept: 'Electronics', hours: 24.5, marks: 14 },
                { roll: 'ME112', name: 'Divya R.', dept: 'Mechanical', hours: 56.0, marks: 24 },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-mono text-xs text-gray-500">{row.roll}</td>
                  <td className="px-8 py-5 font-bold text-gray-900">{row.name}</td>
                  <td className="px-8 py-5 text-gray-600">{row.dept}</td>
                  <td className="px-8 py-5 text-center font-medium">{row.hours}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg font-bold ${
                      row.marks >= 20 ? 'bg-emerald-50 text-emerald-700' : 
                      row.marks >= 15 ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {row.marks}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button className="text-indigo-600 font-bold hover:underline">View File</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
