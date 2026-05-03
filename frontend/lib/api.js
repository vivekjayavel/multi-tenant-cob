import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined') {
      const status = err.response?.status, code = err.response?.data?.code;
      if (status === 401) {
        localStorage.removeItem('token');
        const currentPath = window.location.pathname;
        // Don't redirect to login from public pages
        if (!currentPath.startsWith('/checkout') && !currentPath.startsWith('/cart')) {
          if (code === 'TOKEN_REVOKED')  window.location.href = '/login?reason=revoked';
          else if (code === 'TOKEN_EXPIRED') window.location.href = '/login?reason=expired';
          else if (currentPath.startsWith('/admin')) window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
