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
} from 'recharts';
import { motion, Variants } from 'motion/react';
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
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [dashboardData, setDashboardData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      if (!user || !token) return;
      let endpoint = '';
      if (user.role === 'Admin') endpoint = '/api/admin/dashboard';
      else if (user.role === 'Student') endpoint = '/api/students/dashboard';
      else if (user.role === 'Club') endpoint = '/api/clubs/dashboard';

      if (!endpoint) return;

      try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard', err);
      }
    };
    fetchDashboard();
  }, [user, token]);

  if (user?.role === 'Student') {
    return <StudentDashboard />;
  }

  // Extract dynamic chart data from API response
  const clubData = dashboardData?.engagementSeries || [];
  const pieData = dashboardData?.participationByType || [];

  const adminStats = [
    { label: 'Total Students', value: dashboardData?.stats?.totalStudents || '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', growth: dashboardData?.stats?.growth },
    { label: 'Total Clubs', value: dashboardData?.stats?.totalClubs || '0', icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Pending Approvals', value: dashboardData?.stats?.pendingApprovals || '0', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'CCA Participation', value: dashboardData?.stats?.ccaParticipation || '0%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const clubStats = [
    { label: 'Total Members', value: dashboardData?.stats?.totalMembers || '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', growth: dashboardData?.stats?.growth },
    { label: 'Pending Approvals', value: dashboardData?.stats?.pendingApprovals || '0', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Active Events', value: dashboardData?.stats?.activeEvents || '0', icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Platform Rating', value: dashboardData?.stats?.rating || '0/5', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const stats = user?.role === 'Club' ? clubStats : adminStats;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user?.name}!</h2>
          <p className="text-slate-500 mt-1">Here's what's happening in your {user?.role.toLowerCase()} dashboard today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">Export Report</button>
          <button className="relative overflow-hidden px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 group">
            <span className="relative z-10">Quick Action</span>
            <div className="absolute inset-0 -translate-x-full animate-shimmer opacity-20 group-hover:opacity-40"></div>
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div variants={itemVariants} key={idx} className="relative group bg-white p-7 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center inset-0 ring-1 ring-inset ring-black/5`}>
                <stat.icon size={26} strokeWidth={2.5} />
              </div>
              {stat.growth && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded-full flex items-center gap-1 ring-1 ring-emerald-600/10">
                  {stat.growth} {stat.growth.startsWith('+') && <ArrowUpRight size={14} />}
                </span>
              )}
            </div>
            <p className="relative z-10 text-sm border-slate-500 text-slate-500 font-semibold mb-1">{stat.label}</p>
            <p className="relative z-10 text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Engagement Overview</h3>
            <select className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            {clubData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clubData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="students" name="Activity Check / Students" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="hours" name="Total Hours" fill="#e0e7ff" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">No engagement data available.</div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none scale-150 -translate-y-1/4 translate-x-1/4">
            <div className="w-40 h-40 rounded-full bg-indigo-500 blur-3xl"></div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8 relative z-10">Participation {user?.role === 'Admin' ? 'by Type' : 'by Category'}</h3>
          <div className="h-[250px] w-full relative">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{dashboardData?.stats?.ccaParticipation || dashboardData?.stats?.totalMembers || pieData.length}</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">{user?.role === 'Admin' ? 'Active' : 'Total'}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">No participation data.</div>
            )}
          </div>
          <div className="space-y-3.5 mt-8">
            {pieData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full ring-4 ring-slate-50 transition-transform group-hover:scale-110" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activity (Table) */}
      {(user?.role === 'Admin' || user?.role === 'Club') && (
        <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
          <div className="p-7 border-b border-slate-100 flex items-center justify-between bg-white">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Platform Updates</h3>
            <button className="text-indigo-600 text-sm font-bold hover:text-indigo-700 transition-colors">View All &rarr;</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-7 py-5">Student/Club</th>
                  <th className="px-7 py-5">Activity</th>
                  <th className="px-7 py-5">Status</th>
                  <th className="px-7 py-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {dashboardData?.recentUpdates?.length > 0 ? dashboardData.recentUpdates.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm group-hover:scale-105 transition-transform">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{r.name}</p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{r.department || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-5 text-slate-600 font-medium">
                      Joined Platform
                    </td>
                    <td className="px-7 py-5">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                        Active
                      </span>
                    </td>
                    <td className="px-7 py-5 text-slate-500 font-semibold">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-7 py-8 text-center text-slate-500 font-medium">
                      No recent updates available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const ShieldCheck = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
