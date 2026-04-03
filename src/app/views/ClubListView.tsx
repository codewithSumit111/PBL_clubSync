import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Search,
  Users,
  ExternalLink,
  ChevronDown,
  X,
  Send,
  Loader2,
  Building2,
  Globe,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../config';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubsync_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface ClubData {
  _id: string;
  club_name: string;
  description: string;
  department?: string;
  category: string;
  tagline?: string;
  official_website?: string;
  faculty_coordinators?: { name: string; email: string; department: string }[];
  events?: { title: string; description?: string; date: string }[];
  analytics?: { total_members: number; active_events: number };
  member_count?: number;
}

interface IntakeStatus {
  is_open: boolean;
  max_preferences: number;
  start_date?: string;
  end_date?: string;
}

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Social', 'Literary', 'Other'];

const categoryStyles: Record<string, { bg: string; text: string; headerBg: string }> = {
  Technical: { bg: 'bg-blue-50', text: 'text-blue-700', headerBg: 'from-blue-500 to-indigo-600' },
  Cultural: { bg: 'bg-pink-50', text: 'text-pink-700', headerBg: 'from-pink-500 to-purple-600' },
  Sports: { bg: 'bg-emerald-50', text: 'text-emerald-700', headerBg: 'from-emerald-500 to-teal-600' },
  Social: { bg: 'bg-amber-50', text: 'text-amber-700', headerBg: 'from-amber-500 to-orange-500' },
  Literary: { bg: 'bg-violet-50', text: 'text-violet-700', headerBg: 'from-violet-500 to-purple-600' },
  Other: { bg: 'bg-gray-50', text: 'text-gray-700', headerBg: 'from-gray-500 to-gray-600' },
};


interface ClubListViewProps {
  mode?: string;
  onViewChange?: (view: string) => void;
}

export const ClubListView: React.FC<ClubListViewProps> = ({ mode = 'clubs', onViewChange }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  // Preference form state
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus>({ is_open: false, max_preferences: 3 });
  const [showPrefForm, setShowPrefForm] = useState(false);
  const [pref1, setPref1] = useState('');
  const [pref2, setPref2] = useState('');
  const [pref3, setPref3] = useState('');
  const [submittingPref, setSubmittingPref] = useState(false);

  // Fetch clubs from API
  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/clubs`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        let fetchedClubs = data.success ? (data.clubs || []) : [];
        
        if (mode === 'my-clubs' && user?.role === 'Student') {
            const dashRes = await fetch(`${API_BASE}/students/dashboard`, { headers: getAuthHeaders() });
            const dashData = await dashRes.json();
            if (dashData.success && dashData.dashboard?.joinedClubs) {
                const joinedIds = dashData.dashboard.joinedClubs.map((c: any) => c._id);
                fetchedClubs = fetchedClubs.filter((c: any) => joinedIds.includes(c._id));
            } else {
                fetchedClubs = [];
            }
        }
        
        setClubs(fetchedClubs);
      } catch {
        // API unreachable — show empty state
      } finally {
        setLoading(false);
      }
    };

    const fetchIntake = async () => {
      try {
        const res = await fetch(`${API_BASE}/clubs/intake-status`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) {
          setIntakeStatus(data);
        }
      } catch {
        // API unreachable — keep default closed state
      }
    };

    fetchClubs();
    fetchIntake();
  }, [mode, user?.role]);

  // Filter clubs
  const filteredClubs = clubs.filter(club => {
    const name = club.club_name || '';
    const desc = club.description || '';
    const tag = club.tagline || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Count clubs per category
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? clubs.length : clubs.filter(c => c.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Submit preferences
  const handleSubmitPreferences = async () => {
    const preferences = [pref1, pref2, pref3].filter(Boolean);
    if (preferences.length === 0) {
      toast.error('Please select at least one club preference');
      return;
    }

    const uniquePrefs = new Set(preferences);
    if (uniquePrefs.size !== preferences.length) {
      toast.error('You cannot select the same club twice');
      return;
    }

    setSubmittingPref(true);
    try {
      const res = await fetch(`${API_BASE}/clubs/preferences`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ preferences }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Preferences submitted!', { description: data.message });
        setShowPrefForm(false);
        setPref1('');
        setPref2('');
        setPref3('');
      } else {
        toast.error(data.message || 'Failed to submit preferences');
      }
    } catch {
      toast.error('Failed to connect to server');
    } finally {
      setSubmittingPref(false);
    }
  };
  const handleEnroll = async (clubId: string) => {
    try {
      const res = await fetch(`${API_BASE}/clubs/register/${clubId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Successfully applied to club!');
      } else {
        toast.error(data.message || 'Failed to apply to club.');
      }
    } catch {
      toast.error('Could not connect to server.');
    }
  };

  const style = (cat: string) => categoryStyles[cat] || categoryStyles.Other;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Search */}
      <div
        className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 p-6"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                {mode === 'my-clubs' ? 'My Registered Clubs' : 'Explore All Clubs'}
              </h2>
              <p className="text-xs text-gray-500">{clubs.length} active clubs available</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search clubs..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {mode === 'my-clubs' && !!onViewChange && (
              <button
                onClick={() => onViewChange('clubs')}
                className="px-4 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors whitespace-nowrap"
              >
                Explore All Clubs
              </button>
            )}

            {/* Preference form button */}
            {user?.role === 'Student' && intakeStatus.is_open && (
              <button
                onClick={() => setShowPrefForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 whitespace-nowrap"
              >
                <Sparkles size={16} />
                Submit Preferences
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
            >
              {cat}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === cat ? 'bg-white/20' : 'bg-gray-200'}`}>
                {categoryCounts[cat] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Intake Window Banner */}
      {user?.role === 'Student' && intakeStatus.is_open && (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-5 flex items-center justify-between text-white shadow-lg shadow-teal-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold">Club Intake Window is Open!</h3>
              <p className="text-sm text-white/80">
                Select your top {intakeStatus.max_preferences} club preferences before the deadline.
                {intakeStatus.end_date && (
                  <span className="ml-1 font-semibold">
                    Closes: {new Date(intakeStatus.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPrefForm(true)}
            className="px-5 py-2.5 bg-white text-teal-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-all whitespace-nowrap shadow"
          >
            Submit Now
          </button>
        </div>
      )}

      {/* Club Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl border border-white/50 overflow-hidden">
              <div className="h-28 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50">
          <Search size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-500">
            {mode === 'my-clubs' ? 'You are not enrolled in any clubs yet' : 'No clubs found'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'my-clubs' ? 'Explore all clubs to view intake windows and submit preferences.' : 'Try a different search term or category'}
          </p>
          {mode === 'my-clubs' && !!onViewChange && (
            <button
               onClick={() => onViewChange('clubs')}
               className="mt-6 px-6 py-2.5 bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-600 transition-colors"
            >
               Explore Clubs Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map(club => {
            const catStyle = style(club.category);
            const isExpanded = expandedClub === club._id;
            return (
              <div
                key={club._id}
                className="group bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)' }}
              >
                {/* Header gradient */}
                <div className={`h-24 bg-gradient-to-br ${catStyle.headerBg} relative p-4 flex items-end`}>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur`}>
                      {club.category}
                    </span>
                  </div>
                  <div className="absolute -bottom-5 left-5 w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg font-bold text-teal-600">{club.club_name.charAt(0)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 pt-8 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
                    {club.club_name}
                  </h3>
                  {club.tagline && (
                    <p className="text-xs text-teal-600 font-medium italic mb-2">"{club.tagline}"</p>
                  )}
                  <p className={`text-gray-500 text-sm ${isExpanded ? '' : 'line-clamp-3'} mb-4 flex-1`}>
                    {club.description}
                  </p>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {club.member_count || club.analytics?.total_members || 0} members
                    </span>
                    {club.department && (
                      <span className={`px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} text-[10px] font-bold`}>
                        {club.department}
                      </span>
                    )}
                  </div>

                  {/* Faculty coordinators (expanded) */}
                  {isExpanded && club.faculty_coordinators && club.faculty_coordinators.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Faculty Coordinators</h4>
                      {club.faculty_coordinators.map((fc, i) => (
                        <div key={i} className="text-sm text-gray-700">
                          {fc.name} <span className="text-gray-400">({fc.department})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upcoming events (expanded) */}
                  {isExpanded && club.events && club.events.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Upcoming Events</h4>
                      {club.events.slice(0, 3).map((ev, i) => (
                        <div key={i} className="text-sm text-gray-700 flex justify-between">
                          <span>{ev.title}</span>
                          <span className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <button
                      onClick={() => setExpandedClub(isExpanded ? null : club._id)}
                      className="text-xs font-medium text-gray-500 hover:text-teal-600 transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? 'Show less' : 'View details'}
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2">
                      {club.official_website && (
                        <a
                          href={club.official_website}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        >
                          <Globe size={14} />
                        </a>
                      )}
                      {user?.role === 'Student' && mode === 'clubs' && (
                        <button
                           onClick={() => handleEnroll(club._id)}
                           className="px-3 py-1.5 bg-teal-50 text-teal-600 font-bold rounded-lg text-xs hover:bg-teal-100 transition-colors whitespace-nowrap"
                        >
                           Apply to Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preference Form Modal */}
      {showPrefForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-6 text-white relative">
              <button
                onClick={() => setShowPrefForm(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Club Preference Form</h3>
                  <p className="text-sm text-white/80">Select your top {intakeStatus.max_preferences} club preferences</p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-5">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-start gap-2 text-sm text-teal-800">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Rank your preferred clubs in order. Preference 1 has the highest priority for allocation.</span>
              </div>

              {/* Preference 1 */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                  Preference 1 <span className="text-red-500">*</span>
                </label>
                <select
                  value={pref1}
                  onChange={e => setPref1(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm appearance-none"
                >
                  <option value="">Select your 1st choice...</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id} disabled={c._id === pref2 || c._id === pref3}>
                      {c.club_name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preference 2 */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                  Preference 2
                </label>
                <select
                  value={pref2}
                  onChange={e => setPref2(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm appearance-none"
                >
                  <option value="">Select your 2nd choice...</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id} disabled={c._id === pref1 || c._id === pref3}>
                      {c.club_name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preference 3 */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">
                  Preference 3
                </label>
                <select
                  value={pref3}
                  onChange={e => setPref3(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm appearance-none"
                >
                  <option value="">Select your 3rd choice...</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id} disabled={c._id === pref1 || c._id === pref2}>
                      {c.club_name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected summary */}
              {(pref1 || pref2 || pref3) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Selections</h4>
                  {[pref1, pref2, pref3].map((p, idx) => {
                    if (!p) return null;
                    const club = clubs.find(c => c._id === p);
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-800">{club?.club_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">({club?.category})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowPrefForm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPreferences}
                disabled={!pref1 || submittingPref}
                className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPref ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Send size={16} /> Submit Preferences</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
