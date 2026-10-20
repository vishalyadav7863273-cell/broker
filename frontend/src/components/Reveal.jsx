import { useEffect, useRef, useState } from 'react';

// Fades and slides its children in the first time they scroll into view.
// variant: up | left | right | scale. `delay` (ms) staggers siblings. Shows instantly if the user prefers reduced motion.
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { setShown(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal reveal-${variant} ${shown ? 'is-in' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
