import { Link } from 'react-router-dom';
import { money } from '../../api/data';
import { VisitList } from './Visits';

export default function Overview({ stats }) {
  if (!stats) return null;
  const cards = [
    ['Pending visits', stats.pendingVisits, '?tab=visits', true],
    ['Visits today', stats.todayVisits, '?tab=visits'],
    ['Available flats', `${stats.available} / ${stats.totalFlats}`, '?tab=flats'],
    ['Tenants', stats.customers, '?tab=customers'],
    ['Collected online', money(stats.collected), '?tab=payments'],
  ];
  return (
    <div>
      {stats.pendingVisits > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-marigold/30 p-5">
          <p className="font-semibold">{stats.pendingVisits} visit request{stats.pendingVisits > 1 && 's'} waiting for your confirmation.</p>
          <Link to="?tab=visits" className="btn btn-primary !py-2">Review requests</Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([k, v, to, hot]) => (
          <Link key={k} to={to} className={`card p-5 transition hover:border-ink/30 ${hot && stats.pendingVisits > 0 ? 'ring-2 ring-marigold' : ''}`}>
            <p className="text-sm text-slate2">{k}</p><p className="mt-1 font-display text-4xl font-semibold">{v}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-10 text-2xl">Needs your action</h2>
      <VisitList status="pending" limit={5} />
    </div>
  );
}
