import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, UserRole } from '../features/authSlice';
import { motion } from 'motion/react';
import { ShieldCheck, Users, GraduationCap, ArrowRight, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register extras
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('');
  const [clubName, setClubName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles: { role: UserRole; icon: any; desc: string }[] = [
    { role: 'Student', icon: GraduationCap, desc: 'Browse clubs, register, and track CCA hours' },
    { role: 'Club', icon: Users, desc: 'Manage members, events, and evaluate students' },
    { role: 'Admin', icon: ShieldCheck, desc: 'System-wide oversight and institutional reporting' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body: Record<string, string> = { email, password, role: selectedRole };
      if (mode === 'register') {
        body.name = name;
        if (selectedRole === 'Student') { body.rollNo = rollNo; body.department = department; }
        if (selectedRole === 'Club') { body.clubName = clubName || name; body.department = department; }
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      dispatch(setUser({ user: data.user, token: data.token }));
    } catch {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Left panel — unchanged visuals */}
        <div className="p-12 flex flex-col justify-between bg-indigo-600 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl">C</div>
              <span className="text-xl font-bold tracking-tight">ClubSync</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">Empowering College Communities.</h1>
            <p className="text-indigo-100 text-lg">Centralized management for engineering college clubs, CCA tracking, and institutional excellence.</p>
          </div>

          {/* Seed credentials hint */}
          <div className="space-y-2 text-xs text-indigo-200 bg-indigo-700/40 rounded-2xl p-4 border border-indigo-400/20">
            <p className="font-semibold text-indigo-100 mb-1">Demo Credentials</p>
            <p>🛡️ Admin: <span className="text-white">admin@clubsync.edu / admin123</span></p>
            <p>🤖 Club: <span className="text-white">robotics@clubsync.edu / club123</span></p>
            <p>🎓 Student: <span className="text-white">student@clubsync.edu / student123</span></p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="p-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm">
              {mode === 'login' ? 'Sign in to your portal' : 'Register a new account'}
            </p>
          </div>

          {/* Role selector */}
          <div className="space-y-2 mb-6">
            {roles.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => { setSelectedRole(item.role); setError(''); }}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${selectedRole === item.role
                    ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50'
                    : 'border-gray-100 hover:border-indigo-200'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === item.role ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${selectedRole === item.role ? 'text-indigo-900' : 'text-gray-900'}`}>{item.role} Portal</h3>
                  <p className="text-xs text-gray-500 leading-tight">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Register extras */}
            {mode === 'register' && selectedRole === 'Student' && (
              <>
                <input
                  type="text"
                  placeholder="Roll Number"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </>
            )}
            {mode === 'register' && selectedRole === 'Club' && (
              <>
                <input
                  type="text"
                  placeholder="Club Name"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </>
            )}
            {mode === 'register' && selectedRole === 'Admin' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                ⚠️ Admin accounts cannot be self-registered. Contact your system administrator.
              </p>
            )}

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && selectedRole === 'Admin')}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === 'login' ? `Enter ${selectedRole} Portal` : 'Create Account'}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>

          {/* Toggle login/register */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            {mode === 'login' ? (
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setError(''); }} className="text-indigo-600 font-semibold hover:underline">
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-indigo-600 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
