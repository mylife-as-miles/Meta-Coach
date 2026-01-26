import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './components/Landing';
import Auth from './components/Auth';
import ChooseGame from './components/onboarding/ChooseGame';
import SyncRoster from './components/onboarding/SyncRoster';
import CalibrateAI from './components/onboarding/CalibrateAI';
import Dashboard from './components/Dashboard';
import { Sun, Moon } from './components/Icons';

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

        {/* Onboarding Routes */}
        <Route path="/onboarding/step-1" element={<ChooseGame />} />
        <Route path="/onboarding/step-2" element={<SyncRoster />} />
        <Route path="/onboarding/step-3" element={<CalibrateAI />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
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