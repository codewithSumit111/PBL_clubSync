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
  AreaChart,
  Area,
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
  Trophy,
  Clock,
  Activity as ActivityIcon,
} from 'lucide-react';
import { StudentDashboard } from './StudentDashboard';
import { ClubDashboard } from './club/ClubDashboard';
import { toast } from 'sonner';
import { API_BASE as API } from '../config';

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
      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/5 rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
            </p>
            <h2 className="text-3xl font-bold">{user?.name}</h2>
            <p className="text-indigo-100/80 text-sm mt-2 max-w-md">
              Here's your admin dashboard overview. Manage clubs, students, and track performance.
            </p>
          </div>
          <div className="flex gap-3 self-start md:self-auto">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExportReport}
              className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg"
            >
              <Download size={14} />
              Export
            </button>
          </div>
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
          <div key={idx} className="bg-card p-6 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(79,70,229,0.1)] hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden group border border-border hover:border-indigo-100" >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {loading ? (
              <div className="space-y-3 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
            ) : (
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-muted-plus uppercase tracking-wider mb-1">{stat.label}</h3>
                    <div className="flex items-baseline gap-2">
                       <p className="text-3xl leading-tight font-extrabold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-border group-hover:bg-card transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {stat.change}
                  </span>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[2px] transition-all duration-300 border border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[13px] uppercase font-semibold text-[#6b7280]">Engagement Overview</h3>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          {loading ? (
            <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />
          ) : monthlyData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#99f6e4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#99f6e4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: '#0d9488', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 24px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
                  />
                  <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorSubs)" animationDuration={1500} />
                  <Area type="monotone" dataKey="hours" name="Hours" stroke="#5eead4" strokeWidth={3} fillOpacity={1} fill="url(#colorHrs)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <ActivityIcon size={32} className="opacity-20" />
              <p className="text-sm font-medium">No engagement data yet</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[2px] transition-all duration-300">
          <h3 className="text-[13px] uppercase font-semibold text-[#6b7280] mb-8">Members by Category</h3>
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

      {/* Recent Activity (Timeline) */}
      <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-[13px] uppercase font-semibold text-[#6b7280]">Real-time Updates</h3>
          <span className="text-xs text-gray-400">{activities.length} recent events</span>
        </div>
        {loading ? (
          <div className="p-8 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-50 rounded-md w-1/4 animate-pulse" />
                  <div className="h-3 bg-gray-50 rounded-md w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No recent activity yet</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gray-100 before:pointer-events-none">
              {activities.map((a, i) => (
                <div key={i} className="relative flex gap-6 items-start group">
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-4 border-white transition-transform group-hover:scale-110 duration-300 ${
                    a.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 
                    a.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {a.message.toLowerCase().includes('achievement') ? <Trophy size={16} /> :
                     a.message.toLowerCase().includes('logbook') ? <Clock size={16} /> :
                     a.status === 'Approved' ? <TrendingUp size={16} /> : <ActivityIcon size={16} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{a.name}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">{a.department}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-2">{a.message}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
