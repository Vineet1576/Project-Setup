import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNotificationManager } from '../components/common/NotificationManager';

const SocketContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function SocketProvider({ children }) {
  const { auth } = useAuth();
  const { showNotification } = useNotificationManager();
  const [socket, setSocket] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const token = auth?.token;
    if (!token) {
      setSocket(null);
      return;
    }

    const s = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    s.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[admin-socket] connected as', token.slice(0, 8), '…');
    });
    s.on('connect_error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[admin-socket] connect_error:', err?.message || err);
    });
    s.on('new_notification', (notification) => {
      if (notification?.type === 'admin_broadcast') return;
      setNotificationCount((c) => c + 1);
      showNotification(notification);
    });
    s.on('notifications_all_read', () => setNotificationCount(0));
    s.on('notification_read', () => setNotificationCount((c) => Math.max(0, c - 1)));
    s.on('notification_dismissed', () => setNotificationCount((c) => Math.max(0, c - 1)));
    s.on('disconnect', (reason) => {
      // eslint-disable-next-line no-console
      console.warn('[admin-socket] disconnected:', reason);
    });

    setSocket(s);
    return () => {
      s?.disconnect();
      setSocket(null);
    };
  }, [auth?.token, showNotification]);

  const refreshCount = useCallback((count) => setNotificationCount(count), []);

  const value = useMemo(
    () => ({ socket, refreshCount }),
    [socket, refreshCount],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};
