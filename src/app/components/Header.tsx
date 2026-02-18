import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search students, clubs..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
