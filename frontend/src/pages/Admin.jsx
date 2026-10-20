import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStats } from '../api/data';
import { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { Alert } from '../components/ui';
import Overview from './admin/Overview';
import Visits from './admin/Visits';
import FlatsAdmin from './admin/FlatsAdmin';
import Customers from './admin/Customers';
import Notifications from './admin/Notifications';
import Payments from './admin/Payments';
import Users from './admin/Users';

export default function Admin() {
  const { user } = useAuth();
  const { tick, unread } = useNotif();
  const [sp, setSp] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const tab = sp.get('tab') || 'overview';

  // Refresh the counters on load, on every live visit change and on every new notification.
  useEffect(() => { adminStats().then(setStats).catch((e) => setError(errMsg(e))); }, [tick, unread]);

  const tabs = [
    ['overview', 'Overview'],
    ['visits', 'Visits', stats?.pendingVisits],
    ['flats', 'Flats'],
    ['payments', 'Payments'],
    ['customers', 'Tenants'],
    ['notifications', 'Notifications', unread],
    ...(user.role === 'admin' ? [['users', 'Staff & users']] : []),
  ];
  const view = { overview: <Overview stats={stats} />, visits: <Visits />, flats: <FlatsAdmin />, payments: <Payments />, customers: <Customers />, notifications: <Notifications />, users: user.role === 'admin' ? <Users /> : null }[tab];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">{user.role === 'admin' ? 'Admin' : 'Staff'} dashboard</h1>
        <button onClick={() => setSp({ tab: 'flats', new: '1' })} className="btn btn-accent">
          <span aria-hidden className="text-xl leading-none">+</span> Add flat
        </button>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-4" aria-label="Admin sections">
        {tabs.map(([k, label, n]) => (
          <button key={k} onClick={() => setSp(k === 'overview' ? {} : { tab: k })} aria-current={tab === k ? 'page' : undefined}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-ink text-white' : 'text-slate2 hover:bg-ink/5 hover:text-ink'}`}>
            {label}{n > 0 && <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{n}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-4"><Alert>{error}</Alert></div>
      <div className="mt-6">{view}</div>
    </div>
  );
}
