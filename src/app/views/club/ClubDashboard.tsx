import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../../config';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface ClubStats {
  totalMembers: number;
  pendingRequests: number;
  totalHours: number;
  activeEvents: number;
}

interface MonthlyData {
  name: string;
  hours: number;
  sessions: number;
}

interface RecentActivity {
  type: string;
  name: string;
  department: string;
  message: string;
  status: string;
  date: string;
}

export const ClubDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API}/clubs/stats`, { headers: getAuthHeaders() }),
        fetch(`${API}/clubs/activity`, { headers: getAuthHeaders() }),
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      if (statsData.success) {
        setStats(statsData.stats);
        setMonthlyData(statsData.monthlyData || []);
      } else {
        setError(statsData.message || 'Failed to load statistics');
      }

      if (activityData.success) {
        setActivities(activityData.activities || []);
      }
    } catch (err) {
      setError('Could not connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = stats ? [
    { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', sub: 'Approved students' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Awaiting your review' },
    { label: 'Total CCA Hours', value: stats.totalHours, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Logged by members' },
    { label: 'Active Events', value: stats.activeEvents, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Upcoming/Ongoing' },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Club Console</h2>
          <p className="text-gray-500">Managing <span className="text-teal-600 font-semibold">{user?.name || (user as any)?.club_name || 'your club'}</span>'s activities and memberships.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-800 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={fetchDashboardData} className="ml-auto text-xs font-bold hover:underline">Try Again</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(loading ? [1, 2, 3, 4] : statCards).map((card: any, idx) => (
          <div 
            key={idx} 
            className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all group"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
          >
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-8 w-16 bg-gray-100 rounded" />
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon size={24} />
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{card.sub}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Graph */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-teal-600" />
                Engagement Overview
              </h3>
              <p className="text-xs text-gray-400 mt-1">Total approved CCA hours over the last 6 months</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-full w-full bg-gray-50 rounded-2xl animate-pulse" />
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" name="CCA Hours" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={40} />
                  <Bar dataKey="sessions" name="Sessions" fill="#99f6e4" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Activity size={40} className="opacity-20 mb-2" />
                <p>No activity data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full uppercase">Live Feed</span>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-2 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No recent activity detected</p>
              </div>
            ) : (
              activities.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-2xl hover:bg-white/50 transition-colors group">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                    item.type === 'registration' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {(item.name || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-1">{item.department}</p>
                    <p className="text-xs text-gray-600 line-clamp-1">{item.message}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
            View All Activity
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
