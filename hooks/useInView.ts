import { useEffect, useState, useRef } from 'react';

interface Options extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useInView({ threshold = 0.1, rootMargin = "0px", triggerOnce = true }: Options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}