import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { toast } from 'sonner';
import { Building2, Mail, Lock, FileText, Plus, CheckCircle2, AlertCircle, Tag, Layers, UserCheck } from 'lucide-react';
import { API_BASE } from '../config';

const API_AUTH = `${API_BASE}/auth`;

const CLUB_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Social', 'Literary', 'Other'] as const;

export const ManageClubLeads: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const [clubName, setClubName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagline, setTagline] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<{ name: string; email: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_AUTH}/add-club-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clubName,
          email,
          password,
          description,
          category: category || undefined,
          tagline: tagline || undefined,
          facultyCoordinator: facultyCoordinator || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to add new club.');
        return;
      }

      toast.success(data.message || 'New club added successfully!');
      setRecentlyAdded(prev => [{ name: clubName, email }, ...prev]);

      // Reset form
      setClubName('');
      setEmail('');
      setPassword('');
      setDescription('');
      setCategory('');
      setTagline('');
      setFacultyCoordinator('');
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Plus size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Club</h1>
            <p className="text-sm text-gray-500">Create a new club account with its details</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Club Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Club Name</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                placeholder="e.g. Robotics Club"
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Club Category</label>
            <div className="relative">
              <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none bg-white"
              >
                <option value="" disabled>Select a category</option>
                {CLUB_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Club Tagline <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Building the future, one robot at a time"
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Faculty Coordinator */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Coordinator Name <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={facultyCoordinator}
                onChange={e => setFacultyCoordinator(e.target.value)}
                placeholder="e.g. Dr. John Smith"
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="club.lead@college.edu"
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Club Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <FileText size={16} className="absolute left-4 top-4 text-gray-400" />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the club and its activities..."
                rows={3}
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Club...
              </>
            ) : (
              <>
                <Plus size={16} />
                Add New Club
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            Recently Added Clubs
          </h3>
          <div className="space-y-2">
            {recentlyAdded.map((club, i) => (
              <div key={i} className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{club.name}</p>
                  <p className="text-xs text-gray-500">{club.email}</p>
                </div>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex gap-3">
        <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">How it works</p>
          <p className="text-xs text-blue-700 mt-1">
            Club leads can use the email and password you set here to sign in from the login page.
            They will be able to manage their club, events, and members from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
