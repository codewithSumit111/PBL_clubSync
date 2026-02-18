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
  const { user } = useSelector((state: RootState) => state.auth);
  const { achievements } = useSelector((state: RootState) => state.students);
  const { clubs } = useSelector((state: RootState) => state.clubs);
  const studentRegs = useSelector((state: RootState) => state.students.registrations[user?.id || ''] || EMPTY_ARRAY);
  const dispatch = useDispatch();

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievements Wall</h2>
          <p className="text-gray-500">Celebrate your success and gain recognition.</p>
        </div>
        {user?.role === 'Student' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Record Achievement
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <Trophy className="text-amber-500" /> Submit Achievement
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Achievement Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Winner of Inter-College Robowar"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Associated Club</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.clubId}
                  onChange={e => setFormData({...formData, clubId: e.target.value})}
                >
                  <option value="">Select club...</option>
                  {myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Achievement Level</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value})}
                >
                  <option value="College">College Level</option>
                  <option value="Inter-College">Inter-College Level</option>
                  <option value="State">State Level</option>
                  <option value="National">National Level</option>
                  <option value="International">International Level</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Date Received</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Description / Impact</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe your achievement and its significance..."
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Record Now
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAchievements.length === 0 ? (
          <div className="col-span-2 bg-white p-16 rounded-3xl border border-dashed border-gray-200 text-center text-gray-500">
            <Award className="mx-auto mb-4 text-gray-200" size={64} />
            <p className="font-bold text-xl text-gray-900 mb-1">No achievements recorded yet</p>
            <p>Your hard work deserves to be seen. Record your first win!</p>
          </div>
        ) : (
          filteredAchievements.map((item) => {
            const clubName = clubs.find(c => c.id === item.clubId)?.name || 'General';
            return (
              <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy size={80} />
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Star size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {item.level}
                      </span>
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Calendar size={12} /> {item.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <MapPin size={14} /> {clubName}
                      </div>
                      <button className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                        View Certificate <ExternalLink size={12} />
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
