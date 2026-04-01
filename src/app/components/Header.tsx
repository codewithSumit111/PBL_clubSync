import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  return (
    <header className="h-16 border-b border-white/50 bg-white/40 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 drop-shadow-sm">{title}</h1>
        <p className="text-[13px] font-bold text-indigo-600 mt-0.5 tracking-wide">Welcome back, {user?.name} 👋</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" size={16} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search platform..."
            className="pl-11 pr-4 py-2 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200/60 rounded-full text-sm font-semibold w-64 focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-400 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative border border-transparent hover:border-indigo-100 hover:shadow-sm group">
            <Bell size={18} strokeWidth={2.5} className="group-hover:animate-bounce" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
          </button>
          <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all border border-transparent hover:border-indigo-100 hover:shadow-sm">
            <HelpCircle size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
