import React from 'react';
import ScrollReveal from './ScrollReveal';
import { ArrowRight, Cpu } from './Icons';

const CTA: React.FC = () => {
  return (
    <section className="py-16 md:py-24 relative z-10 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

        <ScrollReveal animation="scale-up" className="relative bg-gradient-to-b from-surface-dark to-black border border-white/10 rounded-3xl p-8 md:p-16 text-center overflow-hidden">
          
          {/* Decorative Grid on Card */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 md:mb-8 border border-white/10 animate-pulse-slow">
              <Cpu className="text-primary w-6 h-6 md:w-8 md:h-8" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 tracking-tight">
              Ready to level up your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">coaching game?</span>
            </h2>
            
            <p className="text-base md:text-lg text-gray-400 max-w-xl mb-8 md:mb-10">
              Join elite organizations using MetaCoach to analyze, strategize, and win. Start your 14-day free trial today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button className="flex items-center justify-center gap-2 bg-primary text-black px-8 py-3 md:py-4 rounded-full font-bold hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/20">
                Start Free Trial
                <ArrowRight size={18} />
              </button>
              <button className="flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white px-8 py-3 md:py-4 rounded-full font-bold hover:bg-white/10 transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CTA;