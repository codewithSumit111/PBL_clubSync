import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  Search,
  Users,
  ExternalLink,
  ChevronRight,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, Variants } from 'motion/react';

const EMPTY_ARRAY: string[] = [];

export const ClubListView: React.FC = () => {
  const { clubs } = useSelector((state: RootState) => state.clubs);
  const { user } = useSelector((state: RootState) => state.auth);
<<<<<<< HEAD
  const studentRegs = useSelector((state: RootState) => state.students.registrations[user?.id || ''] || EMPTY_ARRAY);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const fetchAllClubs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/clubs');
        const data = await res.json();
        if (data.success) {
          // Map MongoDB _id to id for the frontend
          const mappedClubs = data.clubs.map((c: any) => ({
            ...c,
            id: c._id,
            name: c.club_name,
            category: c.department || 'Technical' // assuming a mapping or fallback
          }));
          dispatch(setClubs(mappedClubs));
        }
      } catch (err) {
        console.error('Error fetching clubs', err);
      }
    };
    if (clubs.length === 0) fetchAllClubs();
  }, [dispatch, clubs.length]);

=======

  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);
>>>>>>> origin/main
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Technical', 'Arts', 'Sports', 'Social'];

  const filteredClubs = clubs.filter(club => {
<<<<<<< HEAD
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase());
=======
    const name = club.club_name || '';
    const desc = club.description || '';
    const tag = club.tagline || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.toLowerCase().includes(searchTerm.toLowerCase());
>>>>>>> origin/main
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoin = (clubId: string, clubName: string) => {
    if (!user) return;
    dispatch(registerForClub({ studentId: user.id, clubId }));
    toast.success(`Successfully registered for ${clubName}!`, {
      description: 'The club lead will review your application shortly.'
    });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search clubs by name or interest..."
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-2xl focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100 outline-none'
=======
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
              <h2 className="font-bold text-gray-900 text-lg">All Clubs</h2>
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
>>>>>>> origin/main
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredClubs.map((club) => {
          const isRegistered = studentRegs.includes(club.id);

          return (
            <motion.div variants={itemVariants} key={club.id} className="group bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col relative cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>

              <div className="h-32 bg-slate-50 relative z-10 border-b border-slate-100/50">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-300 to-transparent group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute top-4 right-4 z-20">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${club.category === 'Technical' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                    club.category === 'Arts' ? 'bg-violet-50 text-violet-700 ring-violet-600/20' :
                      'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                    }`}>
                    {club.category}
=======
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
>>>>>>> origin/main
                  </span>
                </div>
                <div className="absolute -bottom-6 left-6 w-14 h-14 bg-white rounded-2xl shadow-[0_4px_12px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 z-20">
                  <span className="text-2xl font-black text-indigo-600">{club.name.charAt(0)}</span>
                </div>
              </div>

              <div className="p-7 pt-10 flex-1 flex flex-col relative z-10">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{club.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1 font-medium">
                  {club.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100/80">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 ring-1 ring-slate-900/5"></div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-600/10">
                      +42
                    </div>
                  </div>

<<<<<<< HEAD
                  {user?.role === 'Student' && (
                    isRegistered ? (
                      <button className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 transition-colors">
                        Registered <CheckCircle2 size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(club.id, club.name)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:-translate-y-0.5 transition-all outline-none"
                      >
                        Join Club
                      </button>
                    )
                  )}
=======
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
                    </div>
                  </div>
>>>>>>> origin/main
                </div>
              </div>
            </motion.div>
          );
        })}

        {user?.role === 'Admin' && (
          <motion.button variants={itemVariants} className="h-full min-h-[320px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group overflow-hidden relative cursor-pointer outline-none focus:ring-4 focus:ring-indigo-500/10">
            <div className="absolute inset-0 bg-white/40 group-hover:bg-transparent transition-colors z-0"></div>
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:border-indigo-200 transition-all duration-300 z-10 text-slate-300 group-hover:text-indigo-600">
              <Plus size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm tracking-wide z-10">Create New Club</span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};
