import React, { useState, useEffect } from 'react';
import { useSelector, Provider, useDispatch } from 'react-redux';
import { store, RootState } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './views/LoginPage';
import { DashboardOverview } from './views/DashboardOverview';
import { ClubListView } from './views/ClubListView';
import { LogbookView } from './views/LogbookView';
import { CCAAnalytics } from './views/CCAAnalytics';
import { AchievementView } from './views/AchievementView';
import { ManageClubLeads } from './views/ManageClubLeads';
import { ManageNotices } from './views/ManageNotices';
import { Toaster } from 'sonner';
// ── Club Role Views ──────────────────────────────────────────
import { ClubStudentMgmt } from './views/club/ClubStudentMgmt';
import { ClubCCAManagement } from './views/club/ClubCCAManagement';
import { ClubAchievements } from './views/club/ClubAchievements';
import { ClubEventsNotifications } from './views/club/ClubEventsNotifications';
import { ClubAnalytics } from './views/club/ClubAnalytics';
import { ClubReports } from './views/club/ClubReports';
import { EventAttendanceView } from './views/EventAttendanceView';
import { StudentAttendanceHistoryView } from './views/StudentAttendanceHistoryView';
import { StudentCCAView } from './views/StudentCCAView';
import { SettingsView } from './views/SettingsView';
import { setUser, logout } from './features/authSlice';
import { API_BASE } from './config';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [isVerifying, setIsVerifying] = useState(!!token && !isAuthenticated);

  const defaultView = user?.role === 'Club' ? 'club-students' : 'dashboard';
  const [currentView, setCurrentView] = useState(defaultView);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      if (token && !isAuthenticated) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            dispatch(setUser({ user: data.user, token }));
          } else {
            dispatch(logout());
          }
        } catch (err) {
          console.error('Session verification failed:', err);
          // Don't logout on network error, but stop loading
        } finally {
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [token, isAuthenticated, dispatch]);

  if (isVerifying) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-indigo-50">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-teal-800 font-bold animate-pulse">Restoring your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'clubs':
      case 'my-clubs':
        return <ClubListView mode={currentView} onViewChange={setCurrentView} />;
      case 'logbook':
          return user?.year === '1' ? (
            <LogbookView />
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Logbook Not Available</h2>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Logbook submissions are only required for 1st year students. As a {user?.year || 'N/A'} year student, you've completed this requirement.
              </p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          );
      case 'qr-attendance':
        return <EventAttendanceView onViewChange={setCurrentView} />;
      case 'attendance-history':
        return <StudentAttendanceHistoryView />;
      case 'achievements':
        return <AchievementView />;
      case 'add-club-lead':
        return <ManageClubLeads />;
      case 'manage-notices':
        return <ManageNotices />;
      case 'cca-progress':
          return user?.year === '1' ? (
            <StudentCCAView />
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">CCA Progress Not Available</h2>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                CCA progress tracking is only for 1st year students. As a {user?.year || 'N/A'} year student, you've completed your CCA requirements.
              </p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          );
      // ── Admin only ───────────────────────────
      case 'analytics':
        return <CCAAnalytics />;
      // ── Club Role Views ──────────────────────
      case 'club-students':
        return <ClubStudentMgmt />;
      case 'club-cca':
        return <ClubCCAManagement />;
      case 'club-achievements':
        return <ClubAchievements />;
      case 'club-events':
        return <ClubEventsNotifications />;
      case 'club-analytics':
        return <ClubAnalytics />;
      case 'club-reports':
        return <ClubReports />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-gray-400">
            <h2 className="text-xl font-bold">View Under Development</h2>
            <p>The {currentView} feature is coming soon.</p>
          </div>
        );
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      clubs: 'Explore All Clubs',
      'my-clubs': 'My Registered Clubs',
      'student-mgmt': 'Student Management',
      'add-club-lead': 'Add Club Lead',
      'manage-notices': 'Manage Notices',
      logbook: 'Activity Logbook',
      'qr-attendance': 'QR Attendance',
      'attendance-history': 'My Check-In History',
      achievements: 'Student Achievements',
      'cca-progress': 'Your CCA Progress',
      analytics: 'Institutional Analytics',
      settings: 'Account Settings',
      // Club views
      'club-students': 'Student Management',
      'club-cca': 'CCA & Marks Management',
      'club-achievements': 'Club Achievements',
      'club-events': 'Events & Notifications',
      'club-analytics': 'Club Analytics',
      'club-reports': 'Reports & Exports',
    };
    return titles[currentView] || 'Portal';
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="min-h-screen p-2 md:p-4 font-['Inter',sans-serif] bg-[#f0f4f8] relative overflow-hidden flex flex-col">
        
        {/* Dynamic Ambient Background Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-teal-400/50 blur-[120px] mix-blend-multiply animate-blob" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-indigo-400/40 blur-[140px] mix-blend-multiply animate-blob" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-rose-300/40 blur-[100px] mix-blend-multiply animate-blob" style={{ animationDelay: '4s' }} />
            <div className="absolute bottom-[20%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-emerald-300/40 blur-[90px] mix-blend-multiply animate-blob" style={{ animationDelay: '6s' }} />
        </div>

        {/* Glassmorphic Application Shell */}
        <div className="flex relative z-10 w-full h-[calc(100vh-16px)] md:h-[calc(100vh-32px)] bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[32px] overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(31,56,104,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <Sidebar 
            currentView={currentView} 
            onViewChange={(view) => { setCurrentView(view); setSidebarOpen(false); }} 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <Header title={getTitle()} onMenuClick={() => setSidebarOpen(true)} onViewChange={setCurrentView} />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide animate-fade-in-up">
              <div className="max-w-7xl mx-auto animate-fade-in-up">
                {renderView()}
              </div>
            </main>
          </div>

          <Toaster position="bottom-right" richColors theme="light" />
        </div>
      </div>
    </>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

