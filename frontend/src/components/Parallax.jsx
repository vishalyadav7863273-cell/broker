import { useEffect, useRef } from 'react';

// Moves its children slightly slower than the page scrolls, for depth. Does nothing for reduced-motion visitors.
export default function Parallax({ speed = 0.08, className = '', children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (ref.current) ref.current.style.transform = `translate3d(0, ${(Math.min(window.scrollY, 900) * speed).toFixed(1)}px, 0)`; });
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', tick); };
  }, [speed]);
  return <div ref={ref} className={className}>{children}</div>;
}
