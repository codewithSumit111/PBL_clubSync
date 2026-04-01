import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { StudentDashboard } from './StudentDashboard';

export const DashboardOverview: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Render student-specific dashboard if role is Student
  if (user?.role === 'Student') {
    return <StudentDashboard />;
  }

  // Mock data for admin charts
  const clubData = [
    { name: 'Jan', students: 400, hours: 240 },
    { name: 'Feb', students: 520, hours: 380 },
    { name: 'Mar', students: 610, hours: 450 },
    { name: 'Apr', students: 580, hours: 420 },
  ];

  const pieData = [
    { name: 'Technical', value: 45, color: '#0d9488' },
    { name: 'Arts', value: 25, color: '#EC4899' },
    { name: 'Sports', value: 20, color: '#f59e0b' },
    { name: 'Social', value: 10, color: '#8b5cf6' },
  ];

  const stats = [
    { label: 'Total Students', value: '2,450', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Total Clubs', value: '42', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Approvals', value: '128', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'CCA Participation', value: '88%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
          <p className="text-gray-500">Here's what's happening in your {user?.role.toLowerCase()} dashboard today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Export Report</button>
          <button className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-shadow shadow-lg shadow-teal-200">Quick Action</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                +12% <ArrowUpRight size={12} />
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Engagement Overview</h3>
            <select className="text-sm bg-gray-50 border-none rounded-lg px-3 py-1 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clubData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="students" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={36} />
                <Bar dataKey="hours" fill="#99f6e4" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <h3 className="font-bold text-gray-900 mb-8">Participation by Type</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-gray-900">85%</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity (Table) */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Updates</h3>
          <button className="text-teal-600 text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Student/Club</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {[1, 2, 3].map((_, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                        {['JD', 'AS', 'RK'][i]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{['John Doe', 'Alice Smith', 'Rahul Kumar'][i]}</p>
                        <p className="text-xs text-gray-500">Comp. Science</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {['Submitted Workshop Log', 'Joined Robotics Club', 'Updated Skill Marks'][i]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      {i === 0 ? 'Pending' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {['Feb 10, 2026', 'Feb 09, 2026', 'Feb 08, 2026'][i]}
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

const ShieldCheck = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
