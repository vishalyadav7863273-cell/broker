import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setToken } from '../api/client';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((data) => {
    setToken(data.accessToken);
    setUser(data.user);
    setCustomer(data.customer || null);
    return data;
  }, []);

  // Restore session from the refresh cookie on page load
  useEffect(() => {
    api.post('/auth/refresh')
      .then(({ data }) => apply(data))
      .then(() => api.get('/auth/me'))
      .then(({ data }) => { setUser(data.user); setCustomer(data.customer); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apply]);

  const login = async (email, password, portal) => apply((await api.post('/auth/login', { email, password, portal })).data);
  const registerUser = async (body) => apply((await api.post('/auth/register', body)).data);
  const registerCustomer = async (body) => apply((await api.post('/auth/customer/register', body)).data);
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setToken(null); setUser(null); setCustomer(null);
  };

  const isAdmin = ['admin', 'staff'].includes(user?.role);
  return (
    <Ctx.Provider value={{ user, customer, loading, isAdmin, login, registerUser, registerCustomer, logout }}>
      {children}
    </Ctx.Provider>
  );
}
