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

      <aside 
        className={twMerge(
          "w-64 h-screen bg-white/60 backdrop-blur-xl border-r border-white/50 flex flex-col fixed lg:sticky top-0 z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )} 
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.03)' }}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/30">
            C
          </div>
          <span className="font-bold text-gray-900 leading-tight">ClubSync <br /><span className="text-xs text-teal-500">College Management</span></span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            data-view={item.id}
            onClick={() => onViewChange(item.id)}
            className={twMerge(
              clsx(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                currentView === item.id
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={currentView === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-600"} />
              <span className="font-medium">{item.label}</span>
            </div>
            {currentView === item.id && <ChevronRight size={16} />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-4">
        <div className="px-4 py-3 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
            {(user?.name || (user as any)?.club_name || '?').charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || (user as any)?.club_name || 'User'}</p>
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
    </>
  );
};
