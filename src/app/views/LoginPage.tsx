import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, UserRole } from '../features/authSlice';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Users, GraduationCap,
  Mail, Lock, UserPlus, ChevronUp, Eye, EyeOff
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = {
      id: selectedRole === 'Admin' ? 'A001' : selectedRole === 'Club' ? 'C001' : 'S123',
      name: selectedRole === 'Admin' ? 'System Administrator' : selectedRole === 'Club' ? 'Robotics Club Lead' : 'John Doe',
      role: selectedRole,
      email: `${selectedRole.toLowerCase()}@college.edu`,
      rollNo: selectedRole === 'Student' ? '123456' : undefined,
      department: 'Computer Science',
      clubId: selectedRole === 'Club' ? '1' : undefined,
    };
    dispatch(setUser({ user: mockUser, token: 'mock-token-' + Date.now() }));
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { id: 'S999', name: 'New Student', role: 'Student' as UserRole, email: 'new@college.edu', rollNo: '000001', department: 'CSE' };
    dispatch(setUser({ user: newUser, token: 'mock-token-' + Date.now() }));
  };

  const roles: { role: UserRole; icon: React.ElementType; label: string }[] = [
    { role: 'Student', icon: GraduationCap, label: 'Student' },
    { role: 'Club', icon: Users, label: 'Club Lead' },
    { role: 'Admin', icon: ShieldCheck, label: 'Admin' },
  ];

  const curtainTransition = { type: 'tween' as const, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 1.0 };

  // Stars/particles data
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '15px 18px 15px 48px',
    fontSize: '14px',
    color: '#e2e8f0',
    background: 'rgba(255,255,255,0.05)',
    border: focusedField === field ? '1.5px solid rgba(129,140,248,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.1)' : 'none',
    backdropFilter: 'blur(10px)',
  });

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{
          width: '100%', height: '100vh', overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(170deg, #07080f 0%, #0d1224 30%, #0f1633 60%, #0a0f20 100%)',
          fontFamily: "'Inter', -apple-system, sans-serif",
          display: 'flex', flexDirection: 'column',
        }}
      >

        {/* ══════ MOUSE-FOLLOWING LIGHT ══════ */}
        <div style={{
          position: 'absolute',
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          transition: 'left 0.3s ease-out, top 0.3s ease-out',
          zIndex: 1,
        }} />

        {/* ══════ ANIMATED ORB BACKGROUNDS ══════ */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* ══════ GRID PATTERN ══════ */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }} />

        {/* ══════ STAR PARTICLES ══════ */}
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: '#ffffff',
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}

        {/* ══════ PULSING RING — decorative ══════ */}
        <div className="pulse-ring" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1 }} />

        {/* ══════ TOP BAR ══════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.div
              className="logo-glow"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Club<span style={{ color: '#818cf8' }}>Sync</span>
            </span>
          </div>

          <motion.button
            onClick={() => setIsSignUp(true)}
            whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '8px', letterSpacing: '0.5px',
              textTransform: 'uppercase' as const, cursor: 'pointer', backdropFilter: 'blur(10px)',
            }}
          >
            Create Account
          </motion.button>
        </motion.div>

        {/* ══════ CENTERED FORM ══════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, paddingBottom: '80px' }}>

          {/* Animated Logo/Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={isLoaded ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <motion.div
              className="logo-icon-glow"
              animate={{ boxShadow: ['0 8px 28px rgba(99,102,241,0.4)', '0 8px 40px rgba(99,102,241,0.6)', '0 8px 28px rgba(99,102,241,0.4)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '64px', height: '64px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '28px', position: 'relative',
              }}
            >
              {/* Spinning ring */}
              <div className="spin-ring" style={{
                position: 'absolute', inset: '-6px', borderRadius: '24px',
                border: '1.5px solid transparent',
                borderTopColor: 'rgba(129,140,248,0.4)',
                borderRightColor: 'rgba(129,140,248,0.15)',
              }} />
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.8px', marginBottom: '10px', textAlign: 'center' }}
          >
            Sign in
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '36px', textAlign: 'center' }}
          >
            Sign in and start managing your clubs!
          </motion.p>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>

            {/* Role Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{
                display: 'flex', gap: '6px', marginBottom: '24px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', padding: '4px',
              }}
            >
              {roles.map(({ role, icon: Icon, label }) => (
                <motion.button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  layout
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '11px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'background 0.3s, color 0.3s',
                    position: 'relative', overflow: 'hidden',
                    ...(selectedRole === role
                      ? { background: 'linear-gradient(135deg, rgba(79,70,229,0.4), rgba(99,102,241,0.3))', color: '#a5b4fc', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.4), 0 0 16px rgba(99,102,241,0.15)' }
                      : { background: 'transparent', color: 'rgba(255,255,255,0.3)' }
                    ),
                  }}
                >
                  <Icon size={13} />
                  {label}
                </motion.button>
              ))}
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isLoaded ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{ marginBottom: '14px', position: 'relative' }}
            >
              <Mail size={16} style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                color: focusedField === 'email' ? '#818cf8' : 'rgba(255,255,255,0.2)',
                transition: 'color 0.3s', zIndex: 2,
              }} />
              <input
                type="email" required
                defaultValue={`${selectedRole.toLowerCase()}@college.edu`}
                placeholder="Email address"
                style={inputStyle('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isLoaded ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              style={{ marginBottom: '18px', position: 'relative' }}
            >
              <Lock size={16} style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                color: focusedField === 'password' ? '#818cf8' : 'rgba(255,255,255,0.2)',
                transition: 'color 0.3s', zIndex: 2,
              }} />
              <input
                type={showPassword ? 'text' : 'password'} required
                placeholder="Password"
                style={{ ...inputStyle('password'), paddingRight: '48px' }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', zIndex: 2, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </motion.div>

            {/* Remember + Forgot */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '15px', height: '15px', accentColor: '#6366f1' }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Remember me</span>
              </label>
              <a href="#" className="link-glow" style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>Forgot password?</a>
            </motion.div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <motion.button
                type="submit"
                className="login-btn shimmer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '16px', fontSize: '15px', fontWeight: 700, color: '#ffffff',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)',
                  border: 'none', borderRadius: '14px', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                  position: 'relative', overflow: 'hidden',
                  letterSpacing: '0.5px',
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>Login</span>
              </motion.button>
            </motion.div>
          </form>
        </div>

        {/* ══════ ANIMATED WAVES ══════ */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, pointerEvents: 'none' }}>
          <svg className="wave wave-1" viewBox="0 0 1440 220" fill="none" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <path d="M0 220V140C120 170 240 190 360 180C480 170 600 130 720 110C840 90 960 90 1080 110C1200 130 1320 170 1380 190L1440 210V220H0Z" fill="rgba(99,102,241,0.04)" />
          </svg>
          <svg className="wave wave-2" viewBox="0 0 1440 220" fill="none" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <path d="M0 220V160C120 185 240 200 360 195C480 190 600 160 720 145C840 130 960 130 1080 145C1200 160 1320 190 1380 200L1440 215V220H0Z" fill="rgba(139,92,246,0.05)" />
          </svg>
          <svg className="wave wave-3" viewBox="0 0 1440 220" fill="none" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <path d="M0 220V180C120 195 240 210 360 208C480 206 600 185 720 175C840 165 960 165 1080 175C1200 185 1320 205 1380 210L1440 218V220H0Z" fill="rgba(255,255,255,0.06)" />
          </svg>
        </div>

        {/* ══════ FOOTER ══════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, zIndex: 10, textAlign: 'center' }}
        >
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>2025 © ClubSync. All rights reserved.</p>
        </motion.div>


        {/* ══════ SIGN UP CURTAIN ══════ */}
        <motion.div
          style={{
            position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: 'linear-gradient(170deg, #07080f 0%, #0d1224 30%, #0f1633 60%, #0a0f20 100%)',
          }}
          initial={{ y: '-100%' }}
          animate={isSignUp ? { y: '0%' } : { y: '-100%' }}
          transition={curtainTransition}
        >
          {particles.slice(0, 15).map(p => (
            <div key={p.id} className="particle" style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size, borderRadius: '50%', background: '#ffffff', opacity: p.opacity,
              animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
            }} />
          ))}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
            <svg viewBox="0 0 1440 180" fill="none" style={{ display: 'block', width: '100%' }}>
              <path d="M0 180V140C200 160 400 170 600 165C800 160 1000 140 1200 150C1380 158 1440 170 1440 170V180H0Z" fill="rgba(255,255,255,0.04)" />
              <path d="M0 180V160C200 172 400 178 600 175C800 172 1000 160 1200 165C1380 170 1440 175 1440 175V180H0Z" fill="rgba(255,255,255,0.06)" />
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '0 24px' }}>
            <motion.button
              onClick={() => setIsSignUp(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto 24px', color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              initial={{ opacity: 0 }}
              animate={isSignUp ? { opacity: 1, transition: { delay: 0.8 } } : { opacity: 0 }}
              whileHover={{ color: 'rgba(255,255,255,0.8)', y: -2 }}
            >
              <ChevronUp size={15} /> Back to sign in
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={isSignUp ? { scale: 1, opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.7, type: 'spring', stiffness: 120, damping: 14 } } : { scale: 0.9, opacity: 0, y: 40 }}
              style={{ textAlign: 'center', marginBottom: '24px' }}
            >
              <motion.div
                animate={isSignUp ? { boxShadow: ['0 8px 24px rgba(99,102,241,0.4)', '0 8px 40px rgba(99,102,241,0.6)', '0 8px 24px rgba(99,102,241,0.4)'] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <UserPlus size={24} style={{ color: '#fff' }} />
              </motion.div>
              <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '8px' }}>Create account</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>Join the ClubSync community</p>
            </motion.div>

            <motion.form
              onSubmit={handleSignUp}
              initial={{ y: 30, opacity: 0 }}
              animate={isSignUp ? { y: 0, opacity: 1, transition: { delay: 0.6, duration: 0.5 } } : { y: 30, opacity: 0 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <input type="text" placeholder="First name" className="signup-input" style={{ width: '100%', padding: '14px 16px', fontSize: '14px', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', outline: 'none' }} />
                <input type="text" placeholder="Last name" className="signup-input" style={{ width: '100%', padding: '14px 16px', fontSize: '14px', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', outline: 'none' }} />
              </div>
              <input type="email" placeholder="Email address" className="signup-input" style={{ width: '100%', padding: '14px 16px', fontSize: '14px', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', outline: 'none', marginBottom: '12px' }} />
              <input type="password" placeholder="Create password" className="signup-input" style={{ width: '100%', padding: '14px 16px', fontSize: '14px', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', outline: 'none', marginBottom: '24px' }} />
              <motion.button type="submit" className="login-btn shimmer" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} style={{
                width: '100%', padding: '15px', fontSize: '15px', fontWeight: 700, color: '#ffffff',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)', border: 'none', borderRadius: '14px',
                cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', position: 'relative', overflow: 'hidden',
              }}>
                <span style={{ position: 'relative', zIndex: 2 }}>Get Started</span>
              </motion.button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '18px' }}>
                By signing up, you agree to our <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Terms</a> & <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Privacy</a>.
              </p>
            </motion.form>
          </div>
        </motion.div>
      </div>

      <style>{`
        /* ORBS */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          top: 5%; left: 55%; width: 350px; height: 350px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
          animation: orbFloat1 12s ease-in-out infinite;
        }
        .orb-2 {
          bottom: 10%; left: 5%; width: 300px; height: 300px;
          background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08));
          animation: orbFloat2 15s ease-in-out infinite 2s;
        }
        .orb-3 {
          top: 40%; right: 5%; width: 250px; height: 250px;
          background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(168,85,247,0.06));
          animation: orbFloat3 10s ease-in-out infinite 4s;
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -40px) scale(1.15); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 40px); }
        }

        /* PARTICLES */
        .particle {
          animation: twinkle var(--dur, 4s) ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }

        /* PULSE RING */
        .pulse-ring::before, .pulse-ring::after {
          content: '';
          position: absolute;
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 50%;
          animation: pulseExpand 4s ease-out infinite;
        }
        .pulse-ring::before {
          width: 200px; height: 200px;
          top: -100px; left: -100px;
        }
        .pulse-ring::after {
          width: 200px; height: 200px;
          top: -100px; left: -100px;
          animation-delay: 2s;
        }
        @keyframes pulseExpand {
          0% { transform: scale(0.5); opacity: 0.4; }
          100% { transform: scale(4); opacity: 0; }
        }

        /* SPINNING RING */
        .spin-ring {
          animation: spinSlow 4s linear infinite;
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }

        /* LOGO GLOW */
        .logo-glow {
          animation: logoBreath 3s ease-in-out infinite;
        }
        @keyframes logoBreath {
          0%, 100% { box-shadow: 0 4px 20px rgba(99,102,241,0.4); }
          50% { box-shadow: 0 4px 30px rgba(99,102,241,0.6); }
        }

        /* BUTTON SHIMMER */
        .shimmer::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmerSlide 3s ease-in-out infinite;
          z-index: 1;
        }
        @keyframes shimmerSlide {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }

        /* LINK GLOW */
        .link-glow:hover {
          text-shadow: 0 0 12px rgba(129,140,248,0.5);
          color: #a5b4fc !important;
        }

        /* WAVE ANIMATIONS */
        .wave { animation: waveFloat 6s ease-in-out infinite; }
        .wave-2 { animation-delay: 1s; animation-duration: 8s; }
        .wave-3 { animation-delay: 2s; animation-duration: 7s; }
        @keyframes waveFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* SIGNUP INPUTS */
        .signup-input:focus {
          border-color: rgba(129,140,248,0.5) !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1), 0 0 16px rgba(99,102,241,0.08) !important;
        }
        .signup-input::placeholder { color: rgba(255,255,255,0.2); }

        /* INPUT PLACEHOLDERS */
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </>
  );
};
