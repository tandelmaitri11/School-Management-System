import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";

const roleToAnnouncementPath = {
  Student: "/student/announcements",
  Teacher: "/teacher/announcements",
  Admin: "/admin/announcements",
};

const roleToAssignmentPath = {
  Student: "/student/assignments",
  Teacher: "/teacher/viewassignment",
  Admin: "/teacher/assignments",
};

const timeAgo = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function NotificationBell({ buttonClassName = "btn btn-light btn-sm rounded-pill" }) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "";
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    loading,
  } = useNotifications(10);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  React.useEffect(() => {
    const closeOnOutside = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const list = useMemo(() => notifications || [], [notifications]);

  const resolveRoute = (n) => {
    if (n?.type === "RESULT" && n?.data?.examId && userRole === "Student") {
      return `/student/exam-result/${n.data.examId}`;
    }
    if (n?.type === "ASSIGNMENT") return roleToAssignmentPath[userRole] || "/";
    if (n?.type === "ANNOUNCEMENT") return roleToAnnouncementPath[userRole] || "/";
    return "/";
  };

  const onNotificationClick = async (n) => {
    if (!n?.isRead) await markRead(n._id);
    setOpen(false);
    navigate(resolveRoute(n));
  };

  return (
    <div ref={wrapRef} className="position-relative">
      <button
        type="button"
        className={buttonClassName}
        style={{ border: "1px solid rgba(255,255,255,.35)" }}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <i className="bi bi-bell" />
        {unreadCount > 0 && (
          <span className="badge bg-danger rounded-pill ms-2">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white shadow rounded-4 border"
          style={{ width: 360, maxHeight: 420, zIndex: 2000, overflow: "hidden" }}
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <strong>Notifications</strong>
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading && list.length === 0 && (
              <div className="px-3 py-3 text-muted small">Loading notifications...</div>
            )}
            {!loading && list.length === 0 && (
              <div className="px-3 py-3 text-muted small">No notifications yet.</div>
            )}
            {list.map((n) => (
              <button
                key={n._id}
                type="button"
                className="w-100 text-start border-0 bg-white px-3 py-3 border-bottom"
                onClick={() => onNotificationClick(n)}
              >
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div>
                    <div className="fw-semibold" style={{ fontSize: "0.92rem" }}>
                      {n.title}
                    </div>
                    <div className="text-muted small">{n.message}</div>
                  </div>
                  {!n.isRead && <span className="badge bg-primary-subtle text-primary">new</span>}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                  {timeAgo(n.createdAt)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
