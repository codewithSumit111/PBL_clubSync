import React from 'react';
import { Search, Bell, HelpCircle, Menu, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const Header: React.FC<{ title: string, onMenuClick?: () => void }> = ({ title, onMenuClick }) => {
  const { user } = useSelector((state: RootState) => state.auth);
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
        {user?.role !== 'Club' ? (
          <div>
            <p className="text-[14px] text-teal-600 mb-1 hidden sm:flex items-center gap-1.5">Welcome back, {user?.name} <Sparkles size={14} /></p>
            <h1 className="text-[32px] font-bold text-[#1a1a2e] leading-tight">{title}</h1>
          </div>
        ) : (
          <div>
             <p className="text-[14px] text-teal-600 mb-1 hidden sm:flex items-center gap-1.5">Welcome back, {user?.name || (user as any)?.club_name} <Sparkles size={14} /></p>
             <h1 className="text-[32px] font-bold text-[#1a1a2e] leading-tight">{title}</h1>
          </div>
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
          <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f8fafc]"></span>
          </button>
          
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
              {(user?.name || (user as any)?.club_name || '?').charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || (user as any)?.club_name || 'User'}</span>
              <span className="text-xs text-gray-500 leading-tight">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
