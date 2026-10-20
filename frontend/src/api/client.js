import axios from 'axios';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // refresh token lives in an httpOnly cookie
});

let accessToken = null;
export const setToken = (t) => { accessToken = t; };
export const getToken = () => accessToken;

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { config, response } = err;
    if (response?.status === 401 && config && !config._retry && !config.url.startsWith('/auth/')) {
      config._retry = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null; });
        const { data } = await refreshing;
        setToken(data.accessToken);
        return api(config);
      } catch { /* fall through to original error */ }
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => {
  const d = e?.response?.data;
  if (d?.errors?.length) return d.errors.map((x) => x.message).join(' · ');
  return d?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running on port 5000?' : e?.message) || 'Something went wrong';
};

export default api;
