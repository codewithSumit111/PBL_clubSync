import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addAchievement, Achievement } from '../features/studentSlice';
import {
  Trophy,
  Award,
  MapPin,
  Calendar,
  Plus,
  Star,
  ExternalLink,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_ARRAY: string[] = [];

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

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    clubId: '',
    title: '',
    description: '',
    level: 'College',
    date: new Date().toISOString().split('T')[0]
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
    };

    dispatch(addAchievement(newAchievement));
    setIsAdding(false);
    setFormData({ clubId: '', title: '', description: '', level: 'College', date: new Date().toISOString().split('T')[0] });
    toast.success('Achievement recorded!', {
      description: 'Your achievement has been added to your profile.'
    });
  };

  const myClubs = clubs.filter(c => studentRegs.includes(c.id));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Achievements Wall</h2>
          <p className="text-slate-500 mt-1 font-medium">Celebrate your success and gain recognition.</p>
        </div>
        {user?.role === 'Student' && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 outline-none"
          >
            <Plus size={20} strokeWidth={2.5} />
            Record Achievement
          </button>
        )}
      </div>

      {isAdding && (
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
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Associated Club</label>
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
                  value={formData.clubId}
                  onChange={e => setFormData({ ...formData, clubId: e.target.value })}
                >
                  <option value="">Select club...</option>
                  {myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Achievement Level</label>
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
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
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Date Received</label>
                <input
                  type="date"
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2.5 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Description / Impact</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your achievement and its significance..."
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 resize-none placeholder:text-slate-400"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5"
              >
                Record Now
              </button>
            </div>
          </form>
        </div>
      )}

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
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>

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
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
