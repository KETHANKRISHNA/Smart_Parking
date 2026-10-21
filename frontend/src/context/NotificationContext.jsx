import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_MS = 30000;

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.success && Array.isArray(res.data)) setNotifications(res.data);
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    }
  }, [isAuthenticated]);

  // Poll only while signed in and the tab is visible; drop everything on logout so nothing leaks across users
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setIsOpen(false);
      return undefined;
    }
    fetchNotifications();
    const tick = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };
    const interval = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post('/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  }, []);

  const value = useMemo(
    () => ({ notifications, unreadCount, isOpen, setIsOpen, fetchNotifications, markAsRead, markAllAsRead }),
    [notifications, unreadCount, isOpen, fetchNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
