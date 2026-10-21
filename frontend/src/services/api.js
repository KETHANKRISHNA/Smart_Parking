import axios from 'axios';
import { session } from './session';

// In production the API is same-origin (/api/... is proxied by Vercel or served by the Spring Boot jar).
// VITE_API_BASE_URL is only needed to point a dev build at some other backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const AUTH_LOGOUT_EVENT = 'auth:logout';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// A bare client for the refresh call so it can never recurse through the interceptors below
const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];
const isAuthCall = (config) => AUTH_PATHS.some((p) => config?.url?.startsWith(p));

api.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = null;

/** Exchanges the refresh token for a new pair. Concurrent 401s share one in-flight request. */
const refreshSession = () => {
  if (!refreshing) {
    const refreshToken = session.getRefreshToken();
    refreshing = (refreshToken
      ? refreshClient.post('/auth/refresh', { refreshToken }).then((res) => {
          session.save(res.data.data);
          return res.data.data.token;
        })
      : Promise.reject(new Error('No refresh token'))
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

const toError = (error) => {
  const body = error.response?.data;
  const err = new Error(body?.message || error.message || 'An unexpected error occurred');
  err.status = error.response?.status;
  // Spring returns { field: message } for validation failures
  err.fieldErrors = body && typeof body.data === 'object' && body.data !== null ? body.data : undefined;
  return err;
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall(original)) {
      original._retried = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        session.clear();
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      }
    }
    return Promise.reject(toError(error));
  }
);

export default api;
