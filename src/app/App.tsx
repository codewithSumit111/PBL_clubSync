import React, { useState } from 'react';
import { useSelector, Provider } from 'react-redux';
import { store, RootState } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './views/LoginPage';
import { DashboardOverview } from './views/DashboardOverview';
import { ClubListView } from './views/ClubListView';
import { LogbookView } from './views/LogbookView';
import { CCAAnalytics } from './views/CCAAnalytics';
import { AchievementView } from './views/AchievementView';
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [currentView, setCurrentView] = useState('dashboard');

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
      logbook: 'Activity Logbook',
      achievements: 'Student Achievements',
      analytics: 'Institutional Analytics',
      settings: 'Account Settings'
    };
    return titles[currentView] || 'Portal';
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header title={getTitle()} />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
      
      <Toaster position="bottom-right" />
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
