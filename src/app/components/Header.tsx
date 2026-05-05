import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, Menu, Sparkles, Info, AlertTriangle, User, Settings, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchNotices, Notice } from '../services/studentApi';
import { logout } from '../features/authSlice';

export const Header: React.FC<{ title: string, onMenuClick?: () => void, onViewChange?: (view: string) => void }> = ({ title, onMenuClick, onViewChange }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [showNotices, setShowNotices] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotices(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async () => {
    setShowNotices(!showNotices);
    if (!showNotices && notices.length === 0) {
      setLoadingNotices(true);
      try {
        const fetchedNotices = await fetchNotices();
        setNotices(fetchedNotices || []);
      } catch (err) {
        console.error('Failed to fetch notices:', err);
      } finally {
        setLoadingNotices(false);
      }
    }
  };

  return (
    <header className="h-[88px] bg-transparent sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 pt-4 pb-2">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-500 hover:bg-white/50 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students, clubs..."
            className="pl-10 pr-4 py-2 bg-white/60 border border-white/60 rounded-full text-sm w-64 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleNotificationClick}
              className={`p-2 rounded-full transition-colors relative ${showNotices ? 'bg-teal-50 text-teal-600' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              <Bell size={20} />
              {notices.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f8fafc]"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotices && (
              <div className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(31,56,104,0.15)] border border-white/60 overflow-hidden z-50 animate-fade-in-up">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {notices.length > 0 && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">{notices.length} New</span>
                  )}
                </div>
                
                <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                  {loadingNotices ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>
                  ) : notices.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notices.map((notice) => (
                        <div key={notice._id} className="p-4 hover:bg-white/60 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${notice.category === 'Urgent' ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-teal-500'}`}>
                              {notice.category === 'Urgent' ? <AlertTriangle size={14} /> : <Info size={14} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{notice.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{notice.message}</p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                {new Date(notice.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden sm:block relative pl-4 border-l border-gray-200" ref={profileDropdownRef}>
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 hover:bg-white/50 p-1.5 pr-3 rounded-full transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                {(user?.name || (user as any)?.club_name || '?').charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || (user as any)?.club_name || 'User'}</span>
                <span className="text-xs text-gray-500 leading-tight">{user?.role}</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(31,56,104,0.15)] border border-white/60 overflow-hidden z-50 animate-fade-in-up">
                <div className="p-2">
                  {onViewChange && (
                    <button 
                      onClick={() => { setShowProfile(false); onViewChange('settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-teal-600 rounded-xl transition-colors"
                    >
                      <Settings size={16} />
                      Profile Settings
                    </button>
                  )}
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button 
                    onClick={() => dispatch(logout())}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
