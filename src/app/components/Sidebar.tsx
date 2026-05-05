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
  Building2,
  Award,
  CalendarDays,
  QrCode,
  BarChart3,
  FileText,
  Star,
  GraduationCap,
  History
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout, UserRole } from '../features/authSlice';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const menuItems: { id: string; label: string; icon: any; roles: UserRole[]; section?: string }[] = [
    // ── Shared ────────────────────────────────────
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Student'] },

    // ── Student only ──────────────────────────────
    { id: 'clubs', label: 'All Clubs', icon: Building2, roles: ['Admin'] },
    { id: 'my-clubs', label: 'My Clubs', icon: GraduationCap, roles: ['Student'] },
    { id: 'logbook', label: 'Logbook', icon: BookOpen, roles: ['Student'] },
    { id: 'qr-attendance', label: 'QR Attendance', icon: QrCode, roles: ['Student'] },
    { id: 'attendance-history', label: 'Check-In History', icon: History, roles: ['Student'] },
    { id: 'achievements', label: 'Achievements', icon: Trophy, roles: ['Student'] },
    { id: 'cca-progress', label: 'CCA Progress', icon: ShieldCheck, roles: ['Student'] },

    // ── Admin only ────────────────────────────────
    { id: 'add-club-lead', label: 'Add Club Lead', icon: Users, roles: ['Admin'] },
    { id: 'student-mgmt', label: 'All Members', icon: Users, roles: ['Admin'] },
    { id: 'manage-notices', label: 'Notices', icon: Bell, roles: ['Admin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['Admin'] },

    // ── Club only ─────────────────────────────────
    { id: 'club-students', label: 'Students', icon: Users, roles: ['Club'] },
    { id: 'club-cca', label: 'CCA & Marks', icon: Award, roles: ['Club'] },
    { id: 'club-achievements', label: 'Achievements', icon: Star, roles: ['Club'] },
    { id: 'club-events', label: 'Events & Notify', icon: CalendarDays, roles: ['Club'] },
    { id: 'club-analytics', label: 'Analytics', icon: BarChart3, roles: ['Club'] },
    { id: 'club-reports', label: 'Reports', icon: FileText, roles: ['Club'] },

    // ── Shared bottom ─────────────────────────────
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Student', 'Club'] },
  ];

    // For students, hide logbook and CCA progress if not in 1st year
    const filteredItems = menuItems.filter(item => {
      if (!user || !item.roles.includes(user.role)) return false;
    
      // Hide CCA-related items for non-1st year students
      if ((item.id === 'logbook' || item.id === 'cca-progress') && user.role === 'Student') {
        return user.year === '1';
      }
    
      return true;
    });



  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar Dynamic Squeeze Layout */}
      <aside 
        className={twMerge(
          "hidden lg:flex flex-col bg-white overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group shrink-0 relative z-50",
          "w-[76px] hover:w-[240px] shadow-[4px_0_24px_rgba(0,0,0,0.08)] border-r border-gray-100 h-full"
        )}
      >
        <div className="w-[240px] h-full flex flex-col">
          {/* Logo Section */}
          <div className="h-[88px] flex items-center px-4 shrink-0 mt-2">
            <div className="min-w-[40px] w-[40px] h-[40px] bg-teal-600 rounded-[12px] flex items-center justify-center text-white font-black text-xl shadow-[0_4px_12px_rgba(13,148,136,0.4)] transition-all duration-500 group-hover:scale-110 group-hover:bg-teal-500 group-hover:shadow-[0_8px_20px_rgba(13,148,136,0.6)]">
              C
            </div>
            <span className="font-bold text-[#1a1a2e] text-xl ml-4 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-75 whitespace-nowrap">
              ClubSync
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 py-4 scrollbar-hide">
            {filteredItems.map((item, index) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  data-view={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="w-full relative flex items-center px-[0px] h-[48px] rounded-xl transition-all duration-300 group/btn hover:pl-1"
                >
                  <div className={twMerge(
                    "absolute inset-0 rounded-xl transition-all duration-400 z-0 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    isActive 
                      ? "bg-teal-600 shadow-[0_8px_16px_rgba(13,148,136,0.25)] scale-100 opacity-100" 
                      : "bg-teal-50 scale-75 opacity-0 group-hover/btn:scale-100 group-hover/btn:opacity-100"
                  )} />
                  <div className="relative z-10 flex flex-1 items-center px-[16px]">
                      <div className={twMerge(
                        "flex flex-col items-center justify-center min-w-[20px] shrink-0 transition-all duration-300 group-hover/btn:-translate-y-[2px]",
                        isActive ? "animate-[bounce_2s_infinite]" : ""
                      )}>
                        <item.icon size={20} className={twMerge(
                            "transition-colors duration-300",
                            isActive ? "text-white drop-shadow-md" : "text-gray-400 group-hover/btn:text-teal-600"
                        )} />
                      </div>
                      <span className={twMerge(
                          "ml-4 font-semibold text-[13px] uppercase tracking-wider whitespace-nowrap opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500",
                          isActive ? "text-white" : "text-gray-600 group-hover/btn:text-teal-700 hover:tracking-widest"
                      )} style={{ transitionDelay: `${index * 30}ms` }}>
                          {item.label}
                      </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Sign Out Section */}
          <div className="p-3 mb-4 shrink-0">
            <button
              onClick={() => dispatch(logout())}
              className="w-full relative flex items-center h-[48px] rounded-xl text-red-500 hover:text-red-700 transition-all duration-300 group/signOut hover:pl-1"
            >
              <div className="absolute inset-0 rounded-xl bg-transparent group-hover/signOut:bg-red-50 transition-all duration-400 z-0 transform scale-75 opacity-0 group-hover/signOut:scale-100 group-hover/signOut:opacity-100 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
              <div className="relative z-10 flex items-center px-[14px] w-full">
                  <div className="flex flex-col items-center justify-center min-w-[20px] shrink-0 transition-transform duration-300 group-hover/signOut:-rotate-12 group-hover/signOut:-translate-x-1">
                    <LogOut size={20} />
                  </div>
                  <span className="ml-4 font-bold text-sm whitespace-nowrap opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100 tracking-wide hover:tracking-widest">
                    Sign Out
                  </span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        className={twMerge(
          "w-[240px] h-full bg-[#1a2b34] flex flex-col fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)]" : "-translate-x-full"
        )} 
      >
        {/* Logo Section */}
        <div className="h-[88px] flex items-center px-6 shrink-0 mt-2">
            <div className="min-w-[40px] w-[40px] h-[40px] bg-[#e2e8f0] rounded-full flex items-center justify-center text-[#1a2b34] font-black text-lg shadow-lg">
              C
            </div>
            <span className="font-bold text-white text-lg ml-3">
              ClubSync
            </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 py-4">
            {filteredItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  data-view={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="w-full relative flex items-center px-[0px] h-[48px] rounded-full transition-colors"
                >
                  <div className={twMerge(
                    "absolute inset-0 rounded-full transition-all duration-300 z-0",
                    isActive ? "bg-[#e2e8f0]" : "bg-transparent"
                  )} />
                  <div className="relative z-10 flex items-center px-4 w-full">
                      <div className="flex items-center justify-center min-w-[20px] shrink-0">
                        <item.icon size={20} className={isActive ? "text-[#1a2b34]" : "text-slate-400"} />
                      </div>
                      <span className={twMerge(
                          "ml-4 font-semibold text-sm whitespace-nowrap",
                          isActive ? "text-[#1a2b34]" : "text-slate-300"
                      )}>
                          {item.label}
                      </span>
                  </div>
                </button>
              );
            })}
        </nav>

        <div className="p-4 shrink-0">
            <button
              onClick={() => dispatch(logout())}
              className="w-full relative flex items-center h-[48px] rounded-full text-red-400"
            >
              <div className="relative z-10 flex items-center px-4 w-full">
                  <div className="flex items-center justify-center min-w-[20px] shrink-0">
                    <LogOut size={20} />
                  </div>
                  <span className="ml-4 font-semibold text-sm whitespace-nowrap">
                    Sign Out
                  </span>
              </div>
            </button>
        </div>
      </aside>
    </>
  );
};
