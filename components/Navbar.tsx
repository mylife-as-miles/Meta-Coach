import React, { useState } from 'react';
import { Activity, ArrowRight, Menu, X } from './Icons';

interface NavbarProps {
  onLoginClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full z-50 fixed top-0 border-b border-white/5 backdrop-blur-md bg-background-dark/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer group z-50 relative" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-black transition-transform group-hover:scale-110">
            <Activity size={18} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">MetaCoach</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-10 text-sm font-medium text-gray-400">
          <a className="hover:text-primary transition-colors cursor-pointer">Match Analysis</a>
          <a className="hover:text-primary transition-colors cursor-pointer">Player Insights</a>
          <a className="hover:text-primary transition-colors cursor-pointer">Strategy Lab</a>
          <a className="hover:text-primary transition-colors cursor-pointer">Team Performance</a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <a onClick={onLoginClick} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors text-gray-300">Log In</a>
          <button className="flex items-center gap-2 bg-surface-dark border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-white hover:text-black transition-all group">
            <span>Say Hello</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden z-50 text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-background-dark/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex flex-col items-center gap-8 text-lg font-medium text-gray-300">
            <a href="#" className="hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Match Analysis</a>
            <a href="#" className="hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Player Insights</a>
            <a href="#" className="hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Strategy Lab</a>
            <a href="#" className="hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Team Performance</a>
            <div className="w-12 h-[1px] bg-white/10 my-2"></div>
            <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => { setIsMobileMenuOpen(false); if (onLoginClick) onLoginClick(); }}>Log In</a>
            <button className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded-full text-base font-bold hover:bg-white transition-all" onClick={() => setIsMobileMenuOpen(false)}>
              <span>Say Hello</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;