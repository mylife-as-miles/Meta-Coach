import React from 'react';
import { Triangle, Video, Droplet, LayoutGrid } from './Icons';
import ScrollReveal from './ScrollReveal';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 bg-background-dark py-10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal 
          animation="fade-up"
          className="flex flex-wrap justify-center md:justify-between items-center gap-x-8 gap-y-6 md:gap-8 opacity-60 md:opacity-40 md:hover:opacity-100 transition-opacity duration-500"
        >
          
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-white group cursor-pointer">
            <Triangle className="text-primary fill-current group-hover:rotate-180 transition-transform duration-500" size={20} /> 
            <span>ClickUp</span>
          </div>

          <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-white group cursor-pointer">
            <div className="flex space-x-[-4px] group-hover:space-x-0 transition-all duration-300">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#F06A6A]"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#F06A6A]"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#F06A6A]"></div>
            </div>
            <span>asana</span>
          </div>

          <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-white hover:text-blue-200 transition-colors cursor-pointer">
            <Video size={20} className="text-gray-300" /> 
            <span>Google Meet</span>
          </div>

          <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-white hover:text-blue-400 transition-colors cursor-pointer">
            <Droplet size={20} className="text-blue-400 fill-current" /> 
            <span>Webflow</span>
          </div>

          <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-white hover:text-green-400 transition-colors cursor-pointer">
            <LayoutGrid size={20} className="text-green-500" /> 
            <span>Microsoft</span>
          </div>

          <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-white font-serif italic hover:tracking-widest transition-all duration-300 cursor-pointer">
            <span>Upwork</span>
          </div>

        </ScrollReveal>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
        <p className="mb-4 md:mb-0">&copy; 2024 MetaCoach Analytics. All rights reserved.</p>
        <div className="flex gap-6">
          <a className="hover:text-primary cursor-pointer transition-colors">Privacy</a>
          <a className="hover:text-primary cursor-pointer transition-colors">Terms</a>
          <a className="hover:text-primary cursor-pointer transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;