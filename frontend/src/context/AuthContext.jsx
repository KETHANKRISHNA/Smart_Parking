import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { AUTH_LOGOUT_EVENT } from '../services/api';
import { session } from '../services/session';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => session.getUser());
  const [token, setToken] = useState(() => session.getToken());
  const [loading, setLoading] = useState(Boolean(session.getToken()));

  const clearLocalSession = useCallback(() => {
    session.clear();
    setUser(null);
    setToken(null);
  }, []);

  // The API client dispatches this when a refresh attempt fails (expired or revoked session)
  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, clearLocalSession);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clearLocalSession);
  }, [clearLocalSession]);

  // On first load, confirm the stored session is still valid and pick up role changes.
  // Only a rejected session logs the user out: a network blip must not.
  useEffect(() => {
    if (!session.getToken()) return undefined;
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled || !res.success || !res.data) return;
        setUser(res.data);
        session.saveUser(res.data);
      })
      .catch((err) => {
        if (!cancelled && (err.status === 401 || err.status === 403)) clearLocalSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clearLocalSession]);

  const establishSession = useCallback((data) => {
    const profile = session.save(data);
    setToken(data.token);
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      if (!res.success || !res.data) throw new Error(res.message || 'Login failed');
      return establishSession(res.data);
    },
    [establishSession]
  );

  const register = useCallback(
    async (form) => {
      const res = await api.post('/auth/register', form);
      if (!res.success || !res.data) throw new Error(res.message || 'Registration failed');
      return establishSession(res.data);
    },
    [establishSession]
  );

  const logout = useCallback(() => {
    if (session.getToken()) {
      api.post('/auth/logout').catch(() => {});
    }
    clearLocalSession();
  }, [clearLocalSession]);

  const updateUser = useCallback((updated) => {
    setUser((prev) => {
      const merged = { ...prev, ...updated };
      session.saveUser(merged);
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'ROLE_ADMIN',
      isManager: user?.role === 'ROLE_PARKING_MANAGER',
      isUser: user?.role === 'ROLE_USER',
      loading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
