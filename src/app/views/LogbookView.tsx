import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addLogEntry, updateLogStatus, LogbookEntry } from '../features/studentSlice';
import {
  Calendar,
  Clock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock3,
  Search,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_ARRAY: string[] = [];

export const LogbookView: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { logbooks } = useSelector((state: RootState) => state.students);
  const { clubs } = useSelector((state: RootState) => state.clubs);
  const studentRegs = useSelector((state: RootState) => state.students.registrations[user?.id || ''] || EMPTY_ARRAY);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const fetchLogs = async () => {
      if (!user || !token) return;
      const endpoint = user.role === 'Student' ? '/api/logbooks/mine' : user.role === 'Club' ? '/api/logbooks/club' : null;
      if (!endpoint) return;

      try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const mapped = data.logbooks.map((l: any) => ({
            id: l._id,
            studentId: typeof l.student_id === 'object' ? l.student_id._id : l.student_id,
            studentName: typeof l.student_id === 'object' ? `${l.student_id.name} (${l.student_id.roll_no || ''})` : undefined,
            clubId: typeof l.club_id === 'object' ? l.club_id._id : l.club_id,
            activityDescription: l.activity_description,
            date: l.date.split('T')[0],
            hours: l.hours,
            status: l.status
          }));
          dispatch({ type: 'students/setLogbooks', payload: mapped });
        }
      } catch (err) {
        console.error('Error fetching logs', err);
      }
    };
    fetchLogs();
  }, [user, token, dispatch]);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    clubId: '',
    description: '',
    hours: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredLogs = user?.role === 'Student'
    ? logbooks.filter(l => l.studentId === user.id)
    : logbooks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newLog: LogbookEntry = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: user.id,
      clubId: formData.clubId,
      activityDescription: formData.description,
      date: formData.date,
      hours: Number(formData.hours),
      status: 'Pending'
    };

    dispatch(addLogEntry(newLog));
    setIsAdding(false);
    setFormData({ clubId: '', description: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Logbook entry submitted!', {
      description: 'Your entry has been sent to the club lead for approval.'
    });
  };

  const handleStatusUpdate = (logId: string, status: 'Approved' | 'Rejected') => {
    dispatch(updateLogStatus({ logId, status }));
    toast.success(`Log ${status.toLowerCase()} successfully`);
  };

  const myClubs = clubs.filter(c => studentRegs.includes(c.id));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Digital Logbook</h2>
          <p className="text-slate-500 mt-1 font-medium">Track and manage co-curricular activity hours.</p>
        </div>
        {user?.role === 'Student' && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 outline-none"
          >
            <Plus size={20} strokeWidth={2.5} />
            Submit New Entry
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          <h3 className="text-xl font-extrabold mb-8 text-slate-900 tracking-tight">Add Log Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Select Club</label>
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
                  value={formData.clubId}
                  onChange={e => setFormData({ ...formData, clubId: e.target.value })}
                >
                  <option value="">Choose a club...</option>
                  {myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Date of Activity</label>
                <input
                  type="date"
                  required
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="e.g. 2.5"
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700"
                  value={formData.hours}
                  onChange={e => setFormData({ ...formData, hours: e.target.value })}
                />
              </div>
              <div className="space-y-2.5 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Activity Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What did you do during this session?"
                  className="w-full p-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 resize-none"
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
                Submit Log
              </button>
            </div>
          </form>
        </div >
      )}

      <div className="grid gap-4 mt-8">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-12 py-20 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-500 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-slate-300" size={32} />
            </div>
            <p className="font-bold text-lg text-slate-700">No log entries found.</p>
            <p className="text-sm mt-1 font-medium">Start by submitting your first activity log!</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const clubName = clubs.find(c => c.id === log.clubId)?.name || 'Unknown Club';

            return (
              <div key={log.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex gap-5 items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-inset ${log.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 ring-emerald-600/10' :
                    log.status === 'Rejected' ? 'bg-rose-50 text-rose-600 ring-rose-600/10' : 'bg-amber-50 text-amber-600 ring-amber-600/10'
                    }`}>
                    {log.status === 'Approved' ? <CheckCircle size={24} strokeWidth={2.5} /> :
                      log.status === 'Rejected' ? <XCircle size={24} strokeWidth={2.5} /> : <Clock3 size={24} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{log.activityDescription}</h4>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <Calendar size={14} className="text-slate-400" /> {log.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <Clock size={14} className="text-slate-400" /> {log.hours} Hours
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 bg-indigo-50/50 px-2.5 py-0.5 rounded-md">
                        {user?.role === 'Student' ? clubName : (log.studentName || 'Student Participant')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${log.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                    log.status === 'Rejected' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }`}>
                    {log.status}
                  </div>

                  {user?.role === 'Club' && log.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(log.id, 'Approved')}
                        className="p-2.5 bg-white text-emerald-600 border border-emerald-200 shadow-sm rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all hover:scale-105 outline-none"
                      >
                        <CheckCircle size={20} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(log.id, 'Rejected')}
                        className="p-2.5 bg-white text-rose-600 border border-rose-200 shadow-sm rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all hover:scale-105 outline-none"
                      >
                        <XCircle size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div >
  );
};
