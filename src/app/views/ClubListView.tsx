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
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search clubs by name or interest..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClubs.map((club) => {
          const isRegistered = studentRegs.includes(club.id);

          return (
            <div key={club.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              <div className="h-32 bg-indigo-50 relative">
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${club.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                    club.category === 'Arts' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {club.category}
                  </span>
                </div>
                <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl font-bold text-indigo-600">{club.name.charAt(0)}</span>
                </div>
              </div>

              <div className="p-6 pt-10 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{club.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
                  {club.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      +42
                    </div>
                  </div>

                  {user?.role === 'Student' && (
                    isRegistered ? (
                      <button className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl">
                        Registered <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(club.id, club.name)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-100"
                      >
                        Join Club
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {user?.role === 'Admin' && (
          <button className="h-full min-h-[300px] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
              <Plus size={32} />
            </div>
            <span className="font-bold">Create New Club</span>
          </button>
        )}
      </div>
    </div>
  );
};
