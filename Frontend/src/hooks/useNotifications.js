import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

export default function useNotifications(limit = 8) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        api.get("/api/notifications/my", { params: { limit } }),
        api.get("/api/notifications/my/unread-count"),
      ]);

      setNotifications(listRes.data?.notifications || []);
      setUnreadCount(Number(countRes.data?.unreadCount || 0));
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (String(n._id) === String(id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch {
      return false;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/api/notifications/my/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return true;
    } catch {
      return false;
    }
  }, []);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    loading,
    notifications,
    unreadCount,
    hasUnread,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
  };
}
