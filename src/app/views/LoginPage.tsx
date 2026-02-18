import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, UserRole } from '../features/authSlice';
import { motion } from 'motion/react';
import { ShieldCheck, User, Users, GraduationCap, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');

  const handleLogin = () => {
    // Mock login based on role
    const mockUser = {
      id: selectedRole === 'Admin' ? 'A001' : selectedRole === 'Club' ? 'C001' : 'S123',
      name: selectedRole === 'Admin' ? 'System Administrator' : selectedRole === 'Club' ? 'Robotics Club Lead' : 'John Doe',
      role: selectedRole,
      email: `${selectedRole.toLowerCase()}@college.edu`,
      rollNo: selectedRole === 'Student' ? '123456' : undefined,
      department: 'Computer Science',
      clubId: selectedRole === 'Club' ? '1' : undefined
    };
    dispatch(setUser(mockUser));
  };

  const roles: { role: UserRole; icon: any; desc: string }[] = [
    { role: 'Student', icon: GraduationCap, desc: 'Browse clubs, register, and track CCA hours' },
    { role: 'Club', icon: Users, desc: 'Manage members, events, and evaluate students' },
    { role: 'Admin', icon: ShieldCheck, desc: 'System-wide oversight and institutional reporting' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-12 flex flex-col justify-between bg-indigo-600 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl">C</div>
              <span className="text-xl font-bold tracking-tight">ClubSync</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">Empowering College Communities.</h1>
            <p className="text-indigo-100 text-lg">Centralized management for engineering college clubs, CCA tracking, and institutional excellence.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-indigo-500/30 p-4 rounded-2xl border border-indigo-400/20 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-400/40 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <p className="text-sm">Trusted by 50+ Premier Institutions</p>
            </div>
          </div>
        </div>

        <div className="p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Select your role to continue to the portal</p>
          </div>

          <div className="space-y-3 mb-8">
            {roles.map((item) => (
              <button
                key={item.role}
                onClick={() => setSelectedRole(item.role)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  selectedRole === item.role 
                    ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50' 
                    : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedRole === item.role ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className={`font-bold ${selectedRole === item.role ? 'text-indigo-900' : 'text-gray-900'}`}>{item.role} Portal</h3>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
          >
            Enter {selectedRole} Portal
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">Secure SSO Login enabled for Faculty</p>
          </div>
        </div>
      </div>
    </div>
  );
};
