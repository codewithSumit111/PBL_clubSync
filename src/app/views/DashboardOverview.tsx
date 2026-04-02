import React, { useEffect, useState } from 'react';
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
import {
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Download,
} from 'lucide-react';
import { StudentDashboard } from './StudentDashboard';
import { ClubDashboard } from './club/ClubDashboard';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface AdminStats {
  totalStudents: number;
  totalClubs: number;
  pendingApprovals: number;
  participationRate: number;
  activeEvents: number;
  totalAchievements: number;
  approvedStudents: number;
}

interface MonthlyData {
  name: string;
  submissions: number;
  hours: number;
  achievements: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface Activity {
  type: string;
  name: string;
  department: string;
  message: string;
  club: string;
  status: string;
  date: string;
}

const ShieldCheck = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const DashboardOverview: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Render student-specific dashboard if role is Student
  if (user?.role === 'Student') {
    return <StudentDashboard />;
  }

  // Render club-specific dashboard if role is Club
  if (user?.role === 'Club') {
    return <ClubDashboard />;
  }

  // Admin dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: getAuthHeaders() }),
        fetch(`${API}/admin/activity`, { headers: getAuthHeaders() }),
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
        setMonthlyData(statsData.monthlyData || []);
        setCategoryData(statsData.categoryData || []);
      } else {
        setError(statsData.message || 'Failed to load stats');
      }

      if (activityData.success) {
        setActivities(activityData.activities || []);
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadDashboard();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleExportReport = () => {
    if (!stats || !activities.length) {
      toast.error('No data available to export');
      return;
    }

    const lines = [
      'ClubSync Admin Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Summary Statistics',
      `Total Students,${stats.totalStudents}`,
      `Total Clubs,${stats.totalClubs}`,
      `Pending Approvals,${stats.pendingApprovals}`,
      `CCA Participation Rate,${stats.participationRate}%`,
      `Active Events,${stats.activeEvents}`,
      `Total Achievements,${stats.totalAchievements}`,
      '',
      'Recent Activity',
      'Name,Department,Activity,Status,Date',
      ...activities.map(a =>
        `${a.name},${a.department},"${a.message}",${a.status},${new Date(a.date).toLocaleDateString()}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clubsync-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const statCards = stats ? [
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', change: `${stats.approvedStudents} enrolled` },
    { label: 'Total Clubs', value: String(stats.totalClubs), icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', change: `${stats.activeEvents} events` },
    { label: 'Pending Approvals', value: String(stats.pendingApprovals), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', change: 'Awaiting review' },
    { label: 'CCA Participation', value: `${stats.participationRate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', change: `${stats.totalAchievements} achievements` },
  ] : [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': case 'Verified': case 'Completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
          <p className="text-gray-500">Here's what's happening in your admin dashboard today.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-shadow shadow-lg shadow-teal-200 flex items-center gap-2"
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={loadDashboard} className="ml-auto text-red-600 font-bold hover:underline text-xs">Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(loading ? [1, 2, 3, 4] : statCards).map((stat: any, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900">Engagement Overview</h3>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          {loading ? (
            <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />
          ) : monthlyData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="submissions" name="Submissions" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={36} />
                  <Bar dataKey="hours" name="Hours" fill="#99f6e4" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
              No engagement data yet. Activity will appear as students submit logbooks.
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <h3 className="font-bold text-gray-900 mb-8">Members by Category</h3>
          {loading ? (
            <div className="h-[250px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.participationRate || 0}%
                  </p>
                  <p className="text-xs text-gray-500">Participation</p>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                {categoryData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity (Table) */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Activity</h3>
          <span className="text-xs text-gray-400">{activities.length} recent updates</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No recent activity yet</p>
          </div>
        ) : (
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
                {activities.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                          {getInitials(a.name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{a.name}</p>
                          <p className="text-xs text-gray-500">{a.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {a.message}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
