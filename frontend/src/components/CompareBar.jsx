import { Link, useLocation } from 'react-router-dom';
import { COMPARE_MAX, useCompare } from '../lib/compare';

export default function CompareBar() {
  const { ids, clear } = useCompare();
  const { pathname } = useLocation();
  if (!ids.length || pathname === '/compare' || pathname.startsWith('/admin')) return null;
  const ready = ids.length >= 2;
  return (
    <div role="region" aria-label="Compare homes" className="rise fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(92vw,34rem)] items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-3 text-white shadow-2xl">
      <span className="text-sm"><b>{ids.length}</b> of {COMPARE_MAX} selected{!ready && ' · pick one more'}</span>
      <span className="flex items-center gap-3">
        <button onClick={clear} className="text-sm underline">Clear</button>
        <Link to="/compare" aria-disabled={!ready} tabIndex={ready ? 0 : -1} className={`btn btn-accent !py-2 text-sm ${ready ? '' : 'pointer-events-none opacity-50'}`}>Compare</Link>
      </span>
    </div>
  );
}
