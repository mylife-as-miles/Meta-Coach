import React from 'react';
import ScrollReveal from './ScrollReveal';

const stats = [
  { label: 'Active Teams', value: '500+', suffix: 'Organizations' },
  { label: 'Data Points', value: '10M+', suffix: 'Analyzed Daily' },
  { label: 'Win Rate', value: '24%', suffix: 'Improvement' },
  { label: 'Coaching', value: '24/7', suffix: 'AI Availability' },
];

const Stats: React.FC = () => {
  return (
    <section className="py-12 md:py-20 border-b border-white/5 relative z-10 bg-background-dark/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {stats.map((stat, index) => (
            <ScrollReveal 
              key={index} 
              delay={index * 0.1} 
              className="flex flex-col items-center text-center p-3 sm:p-4 hover:bg-white/5 rounded-xl transition-colors duration-300"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-primary font-medium text-xs sm:text-sm md:text-base mb-1">
                {stat.label}
              </div>
              <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider">
                {stat.suffix}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;