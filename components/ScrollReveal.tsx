import React from 'react';
import { useInView } from '../hooks/useInView';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // in seconds
  animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-right';
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  animation = 'fade-up' 
}) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const getAnimationClass = () => {
    switch (animation) {
      case 'fade-up':
        return isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
      case 'fade-in':
        return isInView ? 'opacity-100' : 'opacity-0';
      case 'scale-up':
        return isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
      case 'slide-right':
        return isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10';
      default:
        return isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
    }
  };

  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ease-out ${getAnimationClass()} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;