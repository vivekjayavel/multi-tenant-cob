/**
 * uploadApi — axios instance for file uploads.
 *
 * File uploads MUST go directly to Express (port 3001 in dev, same origin in prod).
 * When routed through Next.js rewrites, Next.js's body parser consumes the
 * multipart stream before the proxy forwards it, so multer never sees the file.
 *
 * In production, Express serves everything on port 3000 — same origin, no proxy.
 * In dev (two-server mode), Express is on 3001 — call it directly.
 */

import axios from 'axios';

// In dev:  NEXT_PUBLIC_API_URL = http://localhost:3001  (set in .env)
// In prod: NEXT_PUBLIC_API_URL is not set → uses same origin (window.location.origin)
function getUploadBase() {
  if (typeof window === 'undefined') return '';

  // Explicit env var always wins (set in .env for dev)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/api`;
  }

  // Production: same origin as the page
  return `${window.location.origin}/api`;
}

const uploadApi = axios.create({
  withCredentials: true,
  // Don't set Content-Type — let browser set multipart/form-data with boundary
});

// Attach auth token from localStorage
uploadApi.interceptors.request.use((config) => {
  config.baseURL = getUploadBase();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // Never override Content-Type for FormData — axios/browser handle boundary automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

uploadApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined' && err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default uploadApi;
