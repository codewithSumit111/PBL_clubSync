import React from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout, UserRole } from '../features/authSlice';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const menuItems: { id: string; label: string; icon: any; roles: UserRole[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Student', 'Club'] },
    { id: 'clubs', label: 'All Clubs', icon: Building2, roles: ['Admin', 'Student'] },
    { id: 'my-clubs', label: 'My Clubs', icon: Building2, roles: ['Student'] },
    { id: 'add-club-lead', label: 'Add Club Lead', icon: Users, roles: ['Admin'] },
    { id: 'student-mgmt', label: 'Members', icon: Users, roles: ['Club'] },
    { id: 'logbook', label: 'Logbook', icon: BookOpen, roles: ['Student', 'Club'] },
    { id: 'achievements', label: 'Achievements', icon: Trophy, roles: ['Student', 'Club'] },
    { id: 'analytics', label: 'Analytics', icon: ShieldCheck, roles: ['Admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Student', 'Club'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-[280px] h-[calc(100vh-2rem)] my-4 ml-4 bg-white/80 backdrop-blur-2xl border border-white/60 flex flex-col sticky top-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden z-20 transition-all">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
            C
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight leading-tight flex flex-col">
            ClubSync
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mt-0.5">Campus Platform</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {filteredItems.map((item) => (
          <div key={item.id} className="relative">
            {currentView === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <button
              onClick={() => onViewChange(item.id)}
              className={twMerge(
                clsx(
                  "relative z-10 w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group font-semibold text-sm",
                  currentView === item.id
                    ? "text-white translate-x-1"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1"
                )
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={currentView === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-600"} />
                <span className="font-medium">{item.label}</span>
              </div>
              {currentView === item.id && <ChevronRight size={16} className="text-white" />}
            </button>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100/50 space-y-3 bg-white/50">
        <div className="px-4 py-3 bg-slate-50/80 rounded-2xl flex items-center gap-3 border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
