import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal — DentaFlow-inspired scroll-triggered fade+slide-up animation.
 * Re-triggers reliably whenever scrolled into view (once = false by default).
 *
 * @param delay     - CSS transition delay in ms (for staggered children)
 * @param threshold - how much of the element must be visible (0.12 = 12%)
 * @param once      - if true, animates only once; default is false so it re-animates smoothly on every scroll
 */
export function useScrollReveal(delay = 0, threshold = 0.12, once = false) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(22px)',
    transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return { ref, isVisible, style };
}
