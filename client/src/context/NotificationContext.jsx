import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getNotificationSummary } from '../services/messaging.service';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState({
    unreadMessages: 0,
    cartCount: 0,
    pendingBookings: 0
  });

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
       setNotifications({ unreadMessages: 0, cartCount: 0, pendingBookings: 0 });
       return;
    }
    try {
       const res = await getNotificationSummary();
       // Supports multiple return wrappers gracefully based on backend style
       setNotifications({
          unreadMessages: res.unreadMessages !== undefined ? res.unreadMessages : (res.data?.unreadMessages || 0),
          cartCount: res.cartCount !== undefined ? res.cartCount : (res.data?.cartCount || 0),
          pendingBookings: res.pendingBookings !== undefined ? res.pendingBookings : (res.data?.pendingBookings || 0)
       });
    } catch (err) {
       console.error("Notifications fetch failed", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleAuthLogout = () => {
      setNotifications({ unreadMessages: 0, cartCount: 0, pendingBookings: 0 });
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 60000); // 60s polling
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider value={{ ...notifications, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
