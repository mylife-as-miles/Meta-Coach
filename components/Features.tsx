import React from 'react';
import ScrollReveal from './ScrollReveal';
import { Brain, TrendingUp, Users, Target, Zap, Shield } from './Icons';

const features = [
  {
    icon: <Brain size={24} />,
    title: "AI Strategy Engine",
    description: "Real-time tactical suggestions based on millions of match outcomes and pro-play patterns."
  },
  {
    icon: <TrendingUp size={24} />,
    title: "Performance Analytics",
    description: "Deep dive metrics that track individual mechanics, team synergy, and objective control."
  },
  {
    icon: <Users size={24} />,
    title: "Roster Management",
    description: "Seamlessly manage substitutions, scrim schedules, and player wellness tracking."
  },
  {
    icon: <Target size={24} />,
    title: "Draft Simulation",
    description: "Predict opponent picks and bans with our advanced Monte Carlo draft simulation engine."
  },
  {
    icon: <Zap size={24} />,
    title: "Instant VOD Review",
    description: "Auto-generated highlight reels focusing on key turning points and mistakes."
  },
  {
    icon: <Shield size={24} />,
    title: "Secure Data Vault",
    description: "Enterprise-grade encryption for your custom strats and private scrim data."
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-16 md:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-primary uppercase border border-primary/20 rounded-full bg-primary/5">
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            Everything you need to <span className="text-primary font-serif italic">dominate.</span>
          </h2>
          <p className="text-gray-400 leading-relaxed text-sm md:text-base">
            Our platform combines cutting-edge AI with intuitive design to give coaches and players the ultimate competitive advantage.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <ScrollReveal 
              key={index} 
              delay={index * 0.1}
              className="group p-6 md:p-8 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;