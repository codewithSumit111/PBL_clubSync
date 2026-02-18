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
  const { user } = useSelector((state: RootState) => state.auth);
  const { logbooks } = useSelector((state: RootState) => state.students);
  const { clubs } = useSelector((state: RootState) => state.clubs);
  const studentRegs = useSelector((state: RootState) => state.students.registrations[user?.id || ''] || EMPTY_ARRAY);
  const dispatch = useDispatch();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    clubId: '',
    description: '',
    hours: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredLogs = user?.role === 'Student' 
    ? logbooks.filter(l => l.studentId === user.id)
    : user?.role === 'Club'
    ? logbooks.filter(l => l.clubId === user.clubId)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Digital Logbook</h2>
          <p className="text-gray-500">Track and manage co-curricular activity hours.</p>
        </div>
        {user?.role === 'Student' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Submit New Entry
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold mb-6 text-gray-900">Add Log Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Select Club</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.clubId}
                  onChange={e => setFormData({...formData, clubId: e.target.value})}
                >
                  <option value="">Choose a club...</option>
                  {myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Date of Activity</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Duration (Hours)</label>
                <input 
                  type="number" 
                  step="0.5"
                  required
                  placeholder="e.g. 2.5"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.hours}
                  onChange={e => setFormData({...formData, hours: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Activity Description</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="What did you do during this session?"
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
                Submit Log
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-500">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="font-medium text-lg">No log entries found.</p>
            <p className="text-sm">Start by submitting your first activity log!</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const clubName = clubs.find(c => c.id === log.clubId)?.name || 'Unknown Club';
            
            return (
              <div key={log.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    log.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                    log.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {log.status === 'Approved' ? <CheckCircle size={24} /> : 
                     log.status === 'Rejected' ? <XCircle size={24} /> : <Clock3 size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{log.activityDescription}</h4>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar size={14} /> {log.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock size={14} /> {log.hours} Hours
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                        {clubName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    log.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                    log.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status}
                  </div>
                  
                  {user?.role === 'Club' && log.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(log.id, 'Approved')}
                        className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(log.id, 'Rejected')}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
