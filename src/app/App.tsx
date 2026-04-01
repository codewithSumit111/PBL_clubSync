import React, { useState } from 'react';
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
import { ClubMembersView } from './views/ClubMembersView';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isRestoring, setIsRestoring] = useState(true);

  React.useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('clubsync_token');
      if (storedToken && !isAuthenticated) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const data = await res.json();
          if (data.success && data.user) {
             const safeUser = { ...data.user, name: data.user.name || data.user.club_name || 'User' };
             dispatch({
               type: 'auth/setUser',
               payload: { user: safeUser, token: storedToken }
             });
          } else {
            localStorage.removeItem('clubsync_token');
          }
        } catch (e) {
          console.error('Session restore failed:', e);
        }
      }
      setIsRestoring(false);
    };
    restoreSession();
  }, [dispatch, isAuthenticated]);

  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex gap-2 font-bold text-slate-500">
          Loading ClubSync...
        </div>
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
        return <ClubListView />;
      case 'logbook':
        return <LogbookView />;
      case 'achievements':
        return <AchievementView />;
      case 'add-club-lead':
        return <ManageClubLeads />;
      case 'student-mgmt':
        return <ClubMembersView />;
      case 'analytics':
        return <CCAAnalytics />;
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
      logbook: 'Activity Logbook',
      achievements: 'Student Achievements',
      analytics: 'Institutional Analytics',
      settings: 'Account Settings'
    };
    return titles[currentView] || 'Portal';
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Inter',sans-serif] selection:bg-indigo-100 selection:text-indigo-900">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        <main className="flex-1 flex flex-col min-w-0">
          <Header title={getTitle()} />
          <div className="flex-1 overflow-y-auto p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
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

