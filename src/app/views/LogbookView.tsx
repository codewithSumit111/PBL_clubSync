import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { FileUpload } from '../components/shared/FileUpload';
import {
  Calendar,
  Clock,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock3,
  Plus,
  Loader2,
  BookOpen,
  Link2,
  AlertCircle,
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

interface LogEntry {
  _id: string;
  student_id: any;
  club_id: any;
  activity_description: string;
  date: string;
  hours: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejection_reason?: string;
  report_file?: string;
  createdAt: string;
}

export const LogbookView: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [formData, setFormData] = useState({
    club_id: '',
    activity_description: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    report_file: '',
  });

  const fetchData = async (showSkeleton = true) => {
    if (!user) return;
    if (showSkeleton) setLoading(true);
    try {
      const endpoint = user.role === 'Student' ? '/logbooks/mine' : user.role === 'Club' ? '/logbooks/club' : null;
      
      if (endpoint) {
        const logRes = await fetch(`${API_BASE}${endpoint}`, { headers: getAuthHeaders() });
        const logData = await logRes.json();
        if (logData.success) {
          setLogs(logData.logbooks);
        }
      }

      if (user.role === 'Student') {
          const dashRes = await fetch(`${API_BASE}/students/dashboard`, { headers: getAuthHeaders() });
          const dashData = await dashRes.json();
          if (dashData.success && dashData.dashboard.joinedClubs) {
            setClubs(dashData.dashboard.joinedClubs.map((c: any) => ({ _id: c._id, club_name: c.club_name })));
          }
      }
    } catch (err) {
      console.error('Error loading logbook data:', err);
      toast.error('Could not load logbooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.club_id || !formData.activity_description || !formData.hours) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/logbooks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          club_id: formData.club_id,
          activity_description: formData.activity_description,
          date: formData.date,
          hours: Number(formData.hours),
          report_file: formData.report_file || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Logbook entry submitted!', {
          description: 'Your entry has been sent to the club head for approval.',
        });
        const clubName = clubs.find(c => c._id === formData.club_id)?.club_name || '';
        setLogs(prev => [
          {
            ...data.logbook,
            club_id: { _id: formData.club_id, club_name: clubName },
          },
          ...prev,
        ]);
        setIsAdding(false);
        setFormData({ club_id: '', activity_description: '', hours: '', date: new Date().toISOString().split('T')[0], report_file: '' });
      } else {
        toast.error(data.message || 'Failed to submit entry');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (logId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`${API_BASE}/logbooks/${logId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Log ${status.toLowerCase()} successfully`);
        setLogs(prev => prev.map(l => l._id === logId ? { ...l, status } : l));
      } else {
        toast.error(data.message || 'Error updating status');
      }
    } catch {
      toast.error('Could not connect to update status');
    }
  };

  const filteredLogs = statusFilter === 'All' ? logs : logs.filter(l => l.status === statusFilter);
  const totalHours = logs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.hours, 0);
  const pendingCount = logs.filter(l => l.status === 'Pending').length;

  const getClubNameOrStudent = (log: LogEntry) => {
    if (user?.role === 'Club') {
        if (typeof log.student_id === 'object' && log.student_id !== null) {
            return `${log.student_id.name} (${log.student_id.roll_no || 'N/A'})`;
        }
        return 'Student Participant';
    } else {
        if (typeof log.club_id === 'object' && log.club_id !== null) return log.club_id.club_name;
        return clubs.find(c => c._id === log.club_id)?.club_name || 'Unknown Club';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Logbook</h2>
            <p className="text-gray-500 text-sm">Track and manage your co-curricular activity hours</p>
          </div>
        </div>
        {user?.role === 'Student' && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200"
          >
            <Plus size={18} />
            New Entry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Entries', value: logs.length, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Approved Hours', value: `${totalHours}h`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Review', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      {isAdding && (
        <div
          className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-8 animate-in slide-in-from-top-4"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={20} className="text-teal-500" /> Log New Activity
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
              <XCircle size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Select Club <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
                  value={formData.club_id}
                  onChange={e => setFormData({ ...formData, club_id: e.target.value })}
                >
                  <option value="">Choose from your clubs...</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id}>{c.club_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Date of Activity <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Number of Hours <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  placeholder="e.g. 4"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
                  value={formData.hours}
                  onChange={e => setFormData({ ...formData, hours: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <FileUpload
                  label="Proof / Attachment"
                  value={formData.report_file}
                  onFileUploaded={(url) => setFormData({ ...formData, report_file: url })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Activity Description <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder='e.g. "Spent 4 hours configuring DDS for the autonomous drone project"'
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm resize-none"
                  value={formData.activity_description}
                  onChange={e => setFormData({ ...formData, activity_description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-500 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? 'Submitting...' : 'Submit Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            {s}
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === s ? 'bg-white/20' : 'bg-gray-200'}`}>
              {s === 'All' ? logs.length : logs.filter(l => l.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div
          className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-12 text-center"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <FileText className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="font-bold text-lg text-gray-500">No entries found</p>
          <p className="text-sm text-gray-400 mt-1">
            {statusFilter !== 'All' ? `No ${statusFilter.toLowerCase()} entries.` : 'No Activity Logs match this condition.'}
          </p>
        </div>
      ) : (
        <div
          className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">{user?.role === 'Club' ? 'Student' : 'Club'}</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Proof</th>
                  <th className="px-6 py-4">Status</th>
                  {user?.role === 'Club' && <th className="px-6 py-4">Verify</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredLogs.map(log => {
                  const entityName = getClubNameOrStudent(log);
                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{log.activity_description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-teal-600 font-semibold text-xs bg-teal-50 px-2.5 py-1 rounded-lg">
                          {entityName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 font-bold text-gray-700">
                          <Clock size={12} className="text-gray-400" />
                          {log.hours}h
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.report_file ? (
                          <a
                            href={log.report_file}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-600 hover:underline flex items-center gap-1 text-xs font-medium"
                          >
                            <Link2 size={12} /> View
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${log.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {log.status === 'Approved' && <CheckCircle size={10} />}
                            {log.status === 'Rejected' && <XCircle size={10} />}
                            {log.status === 'Pending' && <Clock3 size={10} />}
                            {log.status}
                          </span>
                          {log.status === 'Rejected' && log.rejection_reason && (
                            <span className="text-[10px] text-red-500 flex items-start gap-1 max-w-[180px]">
                              <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                              {log.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      {user?.role === 'Club' && (
                          <td className="px-6 py-4">
                              {log.status === 'Pending' && (
                                <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(log._id, 'Approved')}
                                  className="p-2 text-emerald-600 bg-white border border-emerald-200 shadow-sm rounded hover:bg-emerald-50 hover:scale-105"
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(log._id, 'Rejected')}
                                  className="p-2 text-rose-600 bg-white border border-rose-200 shadow-sm rounded hover:bg-rose-50 hover:scale-105"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                              )}
                          </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
