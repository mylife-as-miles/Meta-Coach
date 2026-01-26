import React, { useState, useEffect } from 'react';
import { Brain, Scan, Play } from './Icons';
import ScrollReveal from './ScrollReveal';

const Hero: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized coordinates (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="flex-grow flex items-center relative z-10 pt-24 sm:pt-28 lg:pt-0 pb-12 px-4 sm:px-6 lg:px-8 min-h-[100dvh] overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-24 items-center">
        
        {/* Text Content */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 order-1">
          <ScrollReveal animation="fade-in" delay={0.2}>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 w-fit backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors cursor-default">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                Next Gen Analytics
              </span>
            </div>
          </ScrollReveal>
          
          <ScrollReveal animation="slide-right" delay={0.4}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-medium leading-[1.1] tracking-tight text-white text-balance">
              Manage your team <br className="hidden sm:block" />
              with <span className="text-primary italic font-serif">confidence.</span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={0.6}>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed font-light text-balance">
              Trusted esports flexible solutions and personalized AI support to help you reach your championship goals. From micro-stats to macro-strategy.
            </p>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={0.8}>
            <div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4">
              <button className="group flex items-center justify-center gap-3 bg-transparent border border-white/20 text-white px-8 py-4 rounded-md font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto cursor-pointer">
                <Scan className="group-hover:animate-spin" size={20} />
                Explore Platform
              </button>
              <button className="w-14 h-14 hidden sm:flex items-center justify-center rounded-full border border-white/20 text-primary hover:bg-primary hover:text-black hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(210,249,111,0.2)] cursor-pointer">
                <Play size={24} fill="currentColor" />
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* Abstract Visual with Parallax */}
        <div className="lg:col-span-5 h-[350px] sm:h-[400px] lg:h-[500px] xl:h-[600px] relative flex items-center justify-center perspective-1000 order-2">
          <ScrollReveal animation="scale-up" delay={0.5} className="w-full h-full flex items-center justify-center">
            <div 
              className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-72 lg:h-72 xl:w-96 xl:h-96 transition-transform duration-100 ease-out"
              style={{
                transform: `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`
              }}
            >
              {/* Glow Behind */}
              <div 
                className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] sm:blur-[80px] animate-pulse-slow transition-transform duration-700"
                style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}
              ></div>
              
              {/* Center Brain Node */}
              <div 
                className="absolute inset-0 m-auto w-24 h-24 sm:w-32 sm:h-32 lg:w-28 lg:h-28 xl:w-40 xl:h-40 bg-surface-dark rounded-full border border-white/10 flex items-center justify-center shadow-2xl z-20 group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(210,249,111,0.3)]"
                style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` }}
              >
                <Brain className="text-primary animate-pulse group-hover:scale-110 transition-transform duration-300 w-10 h-10 sm:w-12 sm:h-12 xl:w-16 xl:h-16" />
              </div>
              
              {/* Orbit Rings */}
              <div className="absolute inset-0 border border-white/5 rounded-full animate-spin-slow"></div>
              <div className="absolute -inset-6 sm:-inset-8 lg:-inset-6 xl:-inset-10 border border-dashed border-white/10 rounded-full animate-reverse-spin"></div>
              <div className="absolute -inset-12 sm:-inset-16 lg:-inset-12 xl:-inset-20 border border-white/5 rounded-full opacity-30"></div>
              
              {/* Decorative Lines with Parallax */}
              <div 
                className="absolute top-1/2 left-1/2 w-[180px] sm:w-[240px] lg:w-[220px] xl:w-[280px] h-[1px] bg-gradient-to-r from-primary/30 to-transparent -translate-y-1/2 origin-left rotate-[-25deg]"
                style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px) translateY(-50%) rotate(-25deg)` }}
              ></div>
              <div 
                className="absolute top-1/2 left-1/2 w-[150px] sm:w-[200px] lg:w-[180px] xl:w-[240px] h-[1px] bg-gradient-to-r from-primary/30 to-transparent -translate-y-1/2 origin-left rotate-[145deg]"
                style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) translateY(-50%) rotate(145deg)` }}
              ></div>
              
              {/* Floating Labels with stronger Parallax */}
              <div 
                className="absolute -top-6 sm:-top-10 -right-4 bg-surface-dark border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-300 shadow-lg flex items-center gap-2 animate-bounce transition-transform duration-100" 
                style={{ 
                  animationDuration: '3s',
                  transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` 
                }}
              >
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Real-time Data
              </div>
              
              <div 
                className="absolute bottom-0 -left-10 sm:-left-16 bg-surface-dark border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-300 shadow-lg flex items-center gap-2 animate-bounce transition-transform duration-100" 
                style={{ 
                  animationDuration: '4s', 
                  animationDelay: '1s',
                  transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)`
                }}
              >
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                AI Coaching
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
      
      {/* Absolute Location Info */}
      <div className="absolute bottom-8 right-6 hidden xl:flex flex-col items-end text-[10px] text-gray-600 uppercase tracking-widest gap-2 font-mono">
        <div className="flex items-center gap-2">
          <span>[ ↵ ] Scroll down to discover more</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
          <span>San Francisco, CA</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;