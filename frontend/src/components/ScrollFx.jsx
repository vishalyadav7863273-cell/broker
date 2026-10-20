import { useEffect, useState } from 'react';
import { useCompare } from '../lib/compare';

// Thin progress bar at the top of the page + a back-to-top button that appears after scrolling.
export default function ScrollFx() {
  const [p, setP] = useState(0);
  const compare = useCompare();
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return (
    <>
      <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-marigold" style={{ transform: `scaleX(${p})` }} />
      <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed right-6 z-40 ${compare.ids.length ? 'bottom-24' : 'bottom-6'} grid h-12 w-12 place-items-center rounded-full bg-ink text-white shadow-lg transition duration-300 hover:-translate-y-1 ${p > 0.12 ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </button>
    </>
  );
}
