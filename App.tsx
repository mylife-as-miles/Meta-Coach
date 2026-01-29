import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './components/Landing';
import Auth from './components/Auth';
import ChooseGame from './components/onboarding/ChooseGame';
import SyncRoster from './components/onboarding/SyncRoster';
import CalibrateAI from './components/onboarding/CalibrateAI';
import { OnboardingProvider } from './context/OnboardingContext';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardOverview from './components/dashboard/DashboardOverview';
import MatchHistory from './components/dashboard/MatchHistory';
import PlayerHub from './components/dashboard/PlayerHub';
import StrategyLab from './components/dashboard/StrategyLab';
import Settings from './components/dashboard/Settings';
import CommunicationLogs from './components/dashboard/CommunicationLogs';
import CoachProfile from './components/dashboard/CoachProfile';
import { Sun, Moon } from './components/Icons';

// Wrapper component for onboarding routes
const OnboardingRoutes: React.FC = () => {
  return (
    <OnboardingProvider>
      <Routes>
        <Route path="step-1" element={<ChooseGame />} />
        <Route path="step-2" element={<SyncRoster />} />
        <Route path="step-3" element={<CalibrateAI />} />
      </Routes>
    </OnboardingProvider>
  );
};

const App: React.FC = () => {
  // Default to true (dark mode) as per the design requirements
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDark ? 'bg-[#0E100A] text-white' : 'bg-gray-50 text-gray-900'}`}>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth onNavigateHome={() => navigate('/')} />} />

        {/* Onboarding Routes - wrapped with OnboardingProvider */}
        <Route path="/onboarding/*" element={<OnboardingRoutes />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="match-history" element={<MatchHistory />} />
          <Route path="player-hub" element={<PlayerHub />} />
          <Route path="strategy-lab" element={<StrategyLab />} />
          <Route path="communication-logs" element={<CommunicationLogs />} />
          <Route path="profile" element={<CoachProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {/* Theme Toggle - Global */}
      <button
        aria-label="Toggle Dark Mode"
        className="fixed bottom-6 left-6 z-50 p-3 rounded-full bg-surface-dark border border-white/10 text-white shadow-lg hover:scale-105 transition-all hover:bg-white hover:text-black"
        onClick={() => setIsDark(!isDark)}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
};

export default App;
