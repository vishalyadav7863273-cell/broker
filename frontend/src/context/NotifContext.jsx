import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import api, { getToken, setToken } from '../api/client';
import { notifRead, notifReadAll } from '../api/data';
import { useAuth } from './AuthContext';

const Ctx = createContext({ notifications: [], unread: 0, toasts: [], tick: 0, dismiss() {}, markRead() {}, markAll() {} });
export const useNotif = () => useContext(Ctx);

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
export const tabFor = (type) => (type === 'customer_registered' ? 'customers' : type.startsWith('payment') ? 'payments' : 'visits');

const beep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch { /* audio not available */ }
};

// Live notifications for admin/staff: loads the inbox on login, then listens on a socket.
export function NotifProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [tick, setTick] = useState(0); // bumps whenever visits change, so admin lists refetch

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((t) => {
    setToasts((p) => [t, ...p].slice(0, 4));
    setTimeout(() => dismiss(t.id), 9000);
  }, [dismiss]);

  useEffect(() => {
    if (!user || !isAdmin) { setNotifications([]); setUnread(0); setToasts([]); return undefined; }
    let alive = true;
    api.get('/notifications').then(({ data }) => {
      if (!alive) return;
      setNotifications(data.notifications); setUnread(data.unread);
      if (data.unread > 0) toast({ id: 'welcome', title: `${data.unread} unread notification${data.unread > 1 ? 's' : ''}`, message: 'New visit requests and tenant sign-ups are waiting for you.', to: '/admin?tab=notifications' });
    }).catch(() => {});

    const socket = io(SOCKET_URL, { auth: (cb) => cb({ token: getToken() }), withCredentials: true });
    let retries = 0;
    socket.on('connect', () => { retries = 0; });
    // An expired access token is rejected by the server: refresh it and reconnect.
    socket.on('connect_error', async () => {
      if (retries++ >= 3) return;
      try { setToken((await api.post('/auth/refresh')).data.accessToken); setTimeout(() => socket.connect(), 1500); } catch { /* logged out */ }
    });
    socket.on('notification', (n) => {
      setNotifications((p) => [n, ...p].slice(0, 50));
      setUnread((u) => u + 1);
      toast({ id: n._id, title: n.title, message: n.message, to: `/admin?tab=${tabFor(n.notificationType)}` });
      beep();
    });
    socket.on('visit:changed', () => setTick((t) => t + 1));
    socket.on('payment:changed', () => setTick((t) => t + 1));
    return () => { alive = false; socket.disconnect(); };
  }, [user?.id, isAdmin, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    setNotifications((p) => p.map((n) => (n._id === id && !n.readStatus ? (setUnread((u) => Math.max(0, u - 1)), { ...n, readStatus: true }) : n)));
    try { await notifRead(id); } catch { /* ignore */ }
  };
  const markAll = async () => {
    setNotifications((p) => p.map((n) => ({ ...n, readStatus: true }))); setUnread(0);
    try { await notifReadAll(); } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{ notifications, unread, toasts, tick, dismiss, markRead, markAll }}>{children}</Ctx.Provider>;
}
