import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getNotifications, getUnreadCount, markOneRead, markAllRead, deleteNotification } from "../api/notification.api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications({ limit: 20 });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.meta?.unreadCount ?? 0);
    } catch {
      // A failed fetch must not read as "you're all caught up" — that's a
      // materially different (and false) message to show the user.
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const pollUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.data?.count ?? 0);
    } catch {
      // silently fail
    }
  }, [user]);

  // Initial load + 60-second polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchNotifications();

    intervalRef.current = setInterval(pollUnreadCount, 60000);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchNotifications, pollUnreadCount]);

  const markRead = useCallback(async (id) => {
    try {
      await markOneRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const removeNotification = useCallback(async (id) => {
    const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
