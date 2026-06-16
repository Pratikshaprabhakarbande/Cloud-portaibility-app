/**
 * Axios instance with JWT handling.
 * - Attaches the access token to every request.
 * - On a 401, transparently tries to refresh the token once, then retries.
 * - Persists tokens via the small token store below.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ACCESS_KEY = 'cp_access_token';
const REFRESH_KEY = 'cp_refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh-on-401 (single retry, with a shared in-flight refresh promise)
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken: tokenStore.refresh });
        const { data } = await refreshing;
        refreshing = null;
        const tokens = data?.data?.tokens;
        if (tokens) {
          tokenStore.set(tokens);
          original.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(original);
        }
      } catch {
        refreshing = null;
        tokenStore.clear();
        // Force a clean re-login
        if (typeof window !== 'undefined') window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

/** Normalize an axios error into a readable message. */
export function getErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
}

export default api;
