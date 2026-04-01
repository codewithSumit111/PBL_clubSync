import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { addAchievement, Achievement } from '../features/studentSlice';
import { FileUpload } from '../components/shared/FileUpload';
import {
  Trophy,
  Award,
  MapPin,
  Calendar,
  Plus,
  Star,
  ExternalLink,
  Loader2,
  X,
  Link2,
  CheckCircle2,
  Clock3,
  XCircle,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface ClubOption {
  _id: string;
  club_name: string;
}

interface AchievementData {
  _id: string;
  student_id: any;
  club_id: { _id: string; club_name: string } | string;
  title: string;
  description: string;
  level: string;
  date: string;
  certificate_url?: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  verification_feedback?: string;
  createdAt: string;
}

const levelStyles: Record<string, { bg: string; text: string; glow: string }> = {
  College: { bg: 'bg-blue-50', text: 'text-blue-700', glow: 'shadow-blue-100' },
  'Inter-College': { bg: 'bg-teal-50', text: 'text-teal-700', glow: 'shadow-teal-100' },
  State: { bg: 'bg-purple-50', text: 'text-purple-700', glow: 'shadow-purple-100' },
  National: { bg: 'bg-amber-50', text: 'text-amber-700', glow: 'shadow-amber-100' },
  International: { bg: 'bg-pink-50', text: 'text-pink-700', glow: 'shadow-pink-100' },
};

const MOCK_ACHIEVEMENTS: AchievementData[] = [
  { _id: 'a1', student_id: '', club_id: { _id: 'c1', club_name: 'Robotics Club' }, title: 'Won 1st Place in ISRO Robotics Challenge', description: 'Led the team to build an autonomous rover that navigated the simulated Mars terrain. Competed against 120+ teams from across India.', level: 'National', date: '2026-01-15', verification_status: 'Verified', createdAt: '2026-01-15' },
  { _id: 'a2', student_id: '', club_id: { _id: 'c2', club_name: 'Coding Club' }, title: 'Published Research Paper on ML-based Optimization', description: 'Co-authored a paper on reinforcement learning approaches for real-time drone path optimization, accepted at IEEE conference.', level: 'International', date: '2026-02-10', certificate_url: 'https://ieee.org/paper/12345', verification_status: 'Pending', createdAt: '2026-02-10' },
  { _id: 'a3', student_id: '', club_id: { _id: 'c3', club_name: 'Debate Society' }, title: 'Best Speaker Award — State Parliamentary Debate', description: 'Awarded best individual speaker in the state-level parliamentary debate championship held at MIT-WPU.', level: 'State', date: '2026-02-20', verification_status: 'Verified', createdAt: '2026-02-20' },
];

export const AchievementView: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { achievements } = useSelector((state: RootState) => state.students);
  const { clubs } = useSelector((state: RootState) => state.clubs);
  const studentRegs = useSelector((state: RootState) => state.students.registrations[user?.id || ''] || EMPTY_ARRAY);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const fetchAchievements = async () => {
      if (!user || !token) return;
      const endpoint = user.role === 'Student' ? '/api/achievements/mine' : user.role === 'Club' ? '/api/achievements/club' : null;
      if (!endpoint) return;

      try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const mapped = data.achievements.map((a: any) => ({
            id: a._id,
            studentId: typeof a.student_id === 'object' ? a.student_id._id : a.student_id,
            clubId: typeof a.club_id === 'object' ? a.club_id._id : a.club_id,
            title: a.title,
            description: a.description,
            level: a.level,
            date: a.date.split('T')[0]
          }));
          dispatch({ type: 'students/setAchievements', payload: mapped });
        }
      } catch (err) {
        console.error('Error fetching achievements', err);
      }
    };
    fetchAchievements();
  }, [user, token, dispatch]);

  const { user } = useSelector((state: RootState) => state.auth);

  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [formData, setFormData] = useState({
    club_id: '',
    title: '',
    description: '',
    level: 'College',
    date: new Date().toISOString().split('T')[0],
    certificate_url: '',
  });

  const filteredAchievements = user?.role === 'Student'
    ? achievements.filter(a => a.studentId === user.id)
    : user?.role === 'Club'
      ? achievements.filter(a => a.clubId === user.clubId)
      : achievements;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newAchievement: Achievement = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: user.id,
      clubId: formData.clubId,
      title: formData.title,
      description: formData.description,
      level: formData.level,
      date: formData.date
  const fetchData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const achRes = await fetch(`${API_BASE}/achievements/mine`, { headers: getAuthHeaders() });
      const achData = await achRes.json();
      if (achData.success) {
        setAchievements(achData.achievements);
      } else {
        setAchievements(MOCK_ACHIEVEMENTS);
      }

      const dashRes = await fetch(`${API_BASE}/students/dashboard`, { headers: getAuthHeaders() });
      const dashData = await dashRes.json();
      if (dashData.success && dashData.dashboard.joinedClubs) {
        setClubs(dashData.dashboard.joinedClubs.map((c: any) => ({ _id: c._id, club_name: c.club_name })));
      }
    } catch {
      setAchievements(MOCK_ACHIEVEMENTS);
      setClubs([
        { _id: 'c1', club_name: 'Robotics Club' },
        { _id: 'c2', club_name: 'Coding Club' },
        { _id: 'c3', club_name: 'Debate Society' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Re-fetch when tab becomes visible (picks up coordinator verifications)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.club_id || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/achievements`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          club_id: formData.club_id,
          title: formData.title,
          description: formData.description,
          level: formData.level,
          date: formData.date,
          certificate_url: formData.certificate_url || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Achievement recorded!', {
          description: 'It will be verified by the club coordinator.',
        });
        const clubName = clubs.find(c => c._id === formData.club_id)?.club_name || '';
        setAchievements(prev => [
          {
            ...data.achievement,
            club_id: { _id: formData.club_id, club_name: clubName },
            verification_status: 'Pending',
          },
          ...prev,
        ]);
        setIsAdding(false);
        setFormData({ club_id: '', title: '', description: '', level: 'College', date: new Date().toISOString().split('T')[0], certificate_url: '' });
      } else {
        toast.error(data.message || 'Failed to submit');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAchievements = statusFilter === 'All'
    ? achievements
    : achievements.filter(a => a.verification_status === statusFilter);

  const getClubName = (a: AchievementData) => {
    if (typeof a.club_id === 'object' && a.club_id !== null) return a.club_id.club_name;
    return clubs.find(c => c._id === a.club_id)?.club_name || 'General';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
<<<<<<< HEAD
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Achievements Wall</h2>
          <p className="text-slate-500 mt-1 font-medium">Celebrate your success and gain recognition.</p>
=======
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Trophy size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Achievement Portfolio</h2>
            <p className="text-gray-500 text-sm">Record milestones and build your achievement wall</p>
          </div>
>>>>>>> origin/adminPage
        </div>
        {user?.role === 'Student' && (
          <button
            onClick={() => setIsAdding(true)}
<<<<<<< HEAD
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 outline-none"
          >
            <Plus size={20} strokeWidth={2.5} />
            Record Achievement
=======
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
          >
            <Plus size={18} />
            Add Achievement
>>>>>>> origin/adminPage
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Achievements', value: achievements.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Verified', value: achievements.filter(a => a.verification_status === 'Verified').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Verification', value: achievements.filter(a => a.verification_status === 'Pending').length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-4 flex items-center gap-4"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
              <span className={`font-bold text-lg ${s.color}`}>{s.value}</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Add Achievement Form */}
      {isAdding && (
<<<<<<< HEAD
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          <h3 className="text-xl font-extrabold mb-8 text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
              <Trophy size={20} strokeWidth={2.5} />
            </div>
            Submit Achievement
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Achievement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner of Inter-College Robowar"
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
=======
        <div
          className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-8 animate-in slide-in-from-top-4"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> Submit Achievement
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Achievement Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder='e.g. "Won 1st Place in the ISRO Robotics Challenge"'
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
>>>>>>> origin/adminPage
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
<<<<<<< HEAD
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Associated Club</label>
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
                  value={formData.clubId}
                  onChange={e => setFormData({ ...formData, clubId: e.target.value })}
=======
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Associated Club <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
                  value={formData.club_id}
                  onChange={e => setFormData({ ...formData, club_id: e.target.value })}
>>>>>>> origin/adminPage
                >
                  <option value="">Select club...</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id}>{c.club_name}</option>
                  ))}
                </select>
              </div>
<<<<<<< HEAD
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Achievement Level</label>
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
=======
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Achievement Level</label>
                <select
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
>>>>>>> origin/adminPage
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="College">College Level</option>
                  <option value="Inter-College">Inter-College Level</option>
                  <option value="State">State Level</option>
                  <option value="National">National Level</option>
                  <option value="International">International Level</option>
                </select>
              </div>
<<<<<<< HEAD
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Date Received</label>
                <input
                  type="date"
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
=======
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
>>>>>>> origin/adminPage
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
<<<<<<< HEAD
              <div className="space-y-2.5 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Description / Impact</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your achievement and its significance..."
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 resize-none placeholder:text-slate-400"
=======
              <div className="space-y-1.5 md:col-span-2">
                <FileUpload
                  label="Certificate / Proof"
                  value={formData.certificate_url}
                  onFileUploaded={(url) => setFormData({ ...formData, certificate_url: url })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Description / Impact <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the achievement, its impact, and significance..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm resize-none"
>>>>>>> origin/adminPage
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
<<<<<<< HEAD
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
=======
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
>>>>>>> origin/adminPage
              >
                Cancel
              </button>
              <button
                type="submit"
<<<<<<< HEAD
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5"
=======
                disabled={submitting}
                className="bg-teal-500 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 flex items-center gap-2 text-sm disabled:opacity-50"
>>>>>>> origin/adminPage
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                {submitting ? 'Recording...' : 'Record Achievement'}
              </button>
            </div>
          </form>
        </div>
      )}

<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {filteredAchievements.length === 0 ? (
          <div className="col-span-2 bg-white p-16 py-24 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-500 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="text-slate-300" size={40} />
            </div>
            <p className="font-extrabold text-2xl text-slate-800 tracking-tight mb-2">No achievements recorded yet</p>
            <p className="font-medium text-slate-500 text-lg">Your hard work deserves to be seen. Record your first win!</p>
          </div>
        ) : (
          filteredAchievements.map((item) => {
            const clubName = clubs.find(c => c.id === item.clubId)?.name || 'General';
            return (
              <div key={item.id} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy size={100} />
=======
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        {['All', 'Pending', 'Verified', 'Rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div
          className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-16 text-center"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <Award className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="font-bold text-xl text-gray-500 mb-1">No achievements yet</p>
          <p className="text-sm text-gray-400">Your hard work deserves to be seen. Record your first win!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAchievements.map(item => {
            const clubName = getClubName(item);
            const lvl = levelStyles[item.level] || levelStyles.College;
            return (
              <div
                key={item._id}
                className={`bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ${lvl.glow}`}
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
              >
                {/* Background trophy watermark */}
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy size={80} />
>>>>>>> origin/adminPage
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>

<<<<<<< HEAD
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-500 shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                    <Star size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-600/10 px-2.5 py-1 rounded-md">
                        {item.level}
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <Calendar size={14} /> {item.date}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2.5 line-clamp-2 font-medium leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-6 pt-5 border-t border-slate-100/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <MapPin size={14} /> {clubName}
                      </div>
                      <button className="text-amber-600 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:text-amber-700 transition-colors group/btn">
                        Certificate <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>
=======
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${lvl.bg} flex items-center justify-center flex-shrink-0`}>
                    <Star size={24} className={lvl.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Level + Verification + Date */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${lvl.bg} ${lvl.text}`}>
                        {item.level}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 ${item.verification_status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.verification_status === 'Rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {item.verification_status === 'Verified' && <CheckCircle2 size={8} />}
                        {item.verification_status === 'Pending' && <Clock3 size={8} />}
                        {item.verification_status === 'Rejected' && <XCircle size={8} />}
                        {item.verification_status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5 ml-auto">
                        <Calendar size={10} />
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-teal-600 transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Feedback for rejected */}
                    {item.verification_status === 'Rejected' && item.verification_feedback && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 flex items-start gap-1.5">
                        <XCircle size={12} className="flex-shrink-0 mt-0.5" />
                        {item.verification_feedback}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <MapPin size={12} /> {clubName}
                      </div>
                      {item.certificate_url && (
                        <a
                          href={item.certificate_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                          View Certificate <ExternalLink size={10} />
                        </a>
                      )}
>>>>>>> origin/adminPage
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
