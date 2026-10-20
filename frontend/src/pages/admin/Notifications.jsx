import { useNavigate } from 'react-router-dom';
import { tabFor, useNotif } from '../../context/NotifContext';
import { fmtDateTime } from '../../api/data';
import { Empty } from '../../components/ui';

export default function Notifications() {
  const { notifications, unread, markRead, markAll } = useNotif();
  const nav = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-slate2">{unread} unread</p>
        {unread > 0 && <button onClick={markAll} className="btn btn-ghost !py-2 text-sm">Mark all as read</button>}
      </div>
      {notifications.length === 0 ? <div className="mt-6"><Empty title="No notifications yet">Visit requests, cancellations and new tenant sign-ups will be listed here.</Empty></div> : (
        <ul className="mt-4 space-y-3">
          {notifications.map((n) => (
            <li key={n._id}>
              <button onClick={() => { markRead(n._id); nav(`/admin?tab=${tabFor(n.notificationType)}`); }} className={`card block w-full p-4 text-left hover:border-ink/30 ${n.readStatus ? '' : 'bg-mint/60'}`}>
                <span className="flex items-center gap-2 font-semibold">{!n.readStatus && <span className="h-2 w-2 rounded-full bg-red-600" aria-label="Unread" />}{n.title}</span>
                <span className="mt-1 block text-sm text-slate2">{n.message}</span>
                <span className="mt-1 block text-xs text-slate2/80">{fmtDateTime(n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
