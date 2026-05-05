import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Bell, Trash2, Send, AlertCircle, RefreshCw, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE as API } from '../config';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Notice {
  _id: string;
  title: string;
  message: string;
  category: 'Urgent' | 'Event' | 'General';
  target_audience: 'All' | 'Student' | 'Club';
  posted_by: { name: string; _id: string };
  createdAt: string;
}

export const ManageNotices: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'Urgent' | 'Event' | 'General'>('General');
  const [targetAudience, setTargetAudience] = useState<'All' | 'Student' | 'Club'>('All');

  // Load existing notices
  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/notices`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices || []);
      } else {
        toast.error('Failed to load notices: ' + data.message);
      }
    } catch {
      toast.error('Server error while loading notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/notices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, message, category, target_audience: targetAudience }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Notice published successfully!');
        setTitle('');
        setMessage('');
        setCategory('General');
        setTargetAudience('All');
        loadNotices();
      } else {
        toast.error('Failed to publish notice: ' + data.message);
      }
    } catch {
      toast.error('Could not connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notice? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API}/notices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notice deleted.');
        setNotices((prev) => prev.filter((n) => n._id !== id));
      } else {
        toast.error('Failed to delete notice.');
      }
    } catch {
      toast.error('Error deleting notice.');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Urgent':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><AlertCircle size={12} /> {cat}</span>;
      case 'Event':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1"><Calendar size={12} /> {cat}</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 flex items-center gap-1"><Info size={12} /> {cat}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notice Management</h2>
          <p className="text-gray-500">Publish immediate announcements visible on every student's dashboard.</p>
        </div>
        <button
          onClick={loadNotices}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Publish Form */}
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl border border-white/50" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Send className="text-teal-600" />
          Publish New Notice
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Notice Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Extended deadline for club registration"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="General">General</option>
                <option value="Event">Event</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e: any) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="All">Everyone</option>
                <option value="Student">Students Only</option>
                <option value="Club">Clubs Only</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Message Content</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full announcement here..."
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-y font-medium"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Bell size={16} />
              {submitting ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Notices List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 mt-2">Active Notices</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-12 text-center text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No active notices</p>
            <p className="text-xs mt-1">Published notices will appear here and on student dashboards.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice._id}
                className="bg-white/80 backdrop-blur-xl border border-white border-l-4 rounded-2xl p-6 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row gap-6 justify-between items-start"
                style={{ 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  borderLeftColor: notice.category === 'Urgent' ? '#f43f5e' : notice.category === 'Event' ? '#a855f7' : '#14b8a6' 
                }}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    {getCategoryBadge(notice.category)}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide border border-slate-200">
                      {notice.target_audience === 'All' ? 'Everyone' : notice.target_audience === 'Student' ? 'Students Only' : 'Clubs Only'}
                    </span>
                    <span className="text-xs font-bold tracking-wide text-gray-400 uppercase">
                      {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{notice.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {notice.message}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-bold">
                      {notice.posted_by?.name ? notice.posted_by.name.charAt(0) : 'A'}
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      Posted by {notice.posted_by?.name || 'Admin'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(notice._id)}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors md:opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                  title="Delete Notice"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
