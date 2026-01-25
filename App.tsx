import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Background from './components/Background';
import ScrollProgress from './components/ScrollProgress';
import Auth from './components/Auth';
import { Sun, Moon } from './components/Icons';

type ViewState = 'landing' | 'auth';

const App: React.FC = () => {
  // Default to true (dark mode) as per the design requirements
  const [isDark, setIsDark] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (currentView === 'auth') {
    return <Auth onNavigateHome={() => setCurrentView('landing')} />;
  }

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDark ? 'text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ScrollProgress />
      <Background />
      
      <Navbar onLoginClick={() => setCurrentView('auth')} />
      
      <main className="flex-grow flex flex-col">
        <Hero />
        <Stats />
        <Features />
        <CTA />
      </main>
      
      <Footer />

      {/* Theme Toggle */}
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