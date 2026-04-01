import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { toast } from 'sonner';
import { Building2, Mail, Lock, FileText, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/auth';

export const ManageClubLeads: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const [clubName, setClubName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<{ name: string; email: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/add-club-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ clubName, email, password, description }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to add club lead.');
        return;
      }

      toast.success(data.message || 'Club lead added successfully!');
      setRecentlyAdded(prev => [{ name: clubName, email }, ...prev]);

      // Reset form
      setClubName('');
      setEmail('');
      setPassword('');
      setDescription('');
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center ring-1 ring-inset ring-indigo-600/10">
            <Plus size={24} className="text-indigo-600" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Club Lead</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Create a new club lead account to manage a club</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

          {/* Club Name */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-slate-700">Club Name</label>
            <div className="relative group">
              <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                required
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                placeholder="e.g. Robotics Club"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-slate-700">Email Address</label>
            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="club.lead@college.edu"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-slate-700">Password</label>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-slate-700">Club Description <span className="text-slate-400 font-medium">(optional)</span></label>
            <div className="relative group">
              <FileText size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the club and its activities..."
                rows={3}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2 outline-none disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Plus size={20} strokeWidth={2.5} />
                  Create Club Lead Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" strokeWidth={2.5} />
            Recently Added Club Leads
          </h3>
          <div className="space-y-3">
            {recentlyAdded.map((club, i) => (
              <div key={i} className="bg-emerald-50 rounded-2xl p-5 flex items-center justify-between ring-1 ring-inset ring-emerald-600/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <p className="font-bold text-slate-900">{club.name}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{club.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={16} className="text-emerald-600" strokeWidth={3} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 bg-sky-50 rounded-3xl p-6 flex gap-4 ring-1 ring-inset ring-sky-600/10 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <AlertCircle size={20} className="text-sky-600" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-bold text-sky-900">How it works</p>
          <p className="text-sm font-medium text-sky-700 leading-relaxed mt-1.5">
            Club leads can use the email and password you set here to sign in from the login page.
            They will be able to manage their club, events, and their members from their dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
