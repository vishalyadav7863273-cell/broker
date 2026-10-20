import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tabFor, useNotif } from '../context/NotifContext';
import { fmtDateTime } from '../api/data';

export function Bell() {
  const { notifications, unread, markRead, markAll } = useNotif();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const go = (n) => { markRead(n._id); setOpen(false); nav(`/admin?tab=${tabFor(n.notificationType)}`); };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} className="relative grid h-11 w-11 place-items-center rounded-xl hover:bg-ink/5">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" /></svg>
        {unread > 0 && <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-[18px] text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <b>Notifications</b>
              {unread > 0 && <button onClick={markAll} className="text-xs font-semibold underline">Mark all read</button>}
            </div>
            <ul className="max-h-96 divide-y divide-ink/5 overflow-y-auto">
              {notifications.length === 0 && <li className="p-6 text-center text-sm text-slate2">Nothing yet. New visit requests will show up here.</li>}
              {notifications.slice(0, 8).map((n) => (
                <li key={n._id}>
                  <button onClick={() => go(n)} className={`block w-full px-4 py-3 text-left hover:bg-ink/5 ${n.readStatus ? '' : 'bg-mint/60'}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold">{!n.readStatus && <span className="h-2 w-2 rounded-full bg-red-600" />}{n.title}</span>
                    <span className="mt-0.5 block text-sm text-slate2">{n.message}</span>
                    <span className="mt-1 block text-xs text-slate2/80">{fmtDateTime(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Link to="/admin?tab=notifications" onClick={() => setOpen(false)} className="block border-t border-ink/10 px-4 py-3 text-center text-sm font-semibold underline">View all</Link>
          </div>
        </>
      )}
    </div>
  );
}

export function ToastStack() {
  const { toasts, dismiss } = useNotif();
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[22rem] max-w-[92vw] flex-col gap-3" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="rise pointer-events-auto rounded-2xl border border-ink/10 border-l-4 border-l-marigold bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <b className="text-sm">{t.title}</b>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate2 hover:text-ink">✕</button>
          </div>
          <p className="mt-1 text-sm text-slate2">{t.message}</p>
          {t.to && <Link to={t.to} onClick={() => dismiss(t.id)} className="mt-2 inline-block text-sm font-semibold underline">Review now</Link>}
        </div>
      ))}
    </div>
  );
}
