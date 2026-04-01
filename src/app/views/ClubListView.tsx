import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setClubs } from '../features/clubSlice';
import { registerForClub } from '../features/studentSlice';
import {
  Search,
  Filter,
  Users,
  UserPlus,
  ArrowRight,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Technical', 'Arts', 'Sports', 'Social'];

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase());
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
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

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
