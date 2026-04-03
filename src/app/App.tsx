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
        return <LogbookView />;
      case 'achievements':
        return <AchievementView />;
      case 'add-club-lead':
        return <ManageClubLeads />;
      case 'manage-notices':
        return <ManageNotices />;
      case 'cca-progress':
        return <StudentCCAView />;
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
      <div className="flex min-h-screen font-['Inter',sans-serif]" style={{ background: 'linear-gradient(135deg, #e0f2f1 0%, #e8eaf6 35%, #f3e5f5 65%, #e0f2f1 100%)' }}>
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => { setCurrentView(view); setSidebarOpen(false); }} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        <main className="flex-1 flex flex-col min-w-0">
          <Header title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {renderView()}
            </div>
          </div>
        </main>

        <Toaster position="bottom-right" />
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

