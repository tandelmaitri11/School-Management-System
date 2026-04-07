import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";

const roleToAnnouncementPath = {
  Student: "/student/announcements",
  Teacher: "/teacher/announcements",
  Admin: "/admin/announcements",
  Parent: "/parent/notifications",
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
    if (n?.type === "RESULT" && userRole === "Parent") {
      return "/parent/exams";
    }
    if (n?.type === "ATTENDANCE" && userRole === "Parent") {
      return "/parent/notifications";
    }
    if (n?.type === "ASSIGNMENT") return roleToAssignmentPath[userRole] || "/";
    if (n?.type === "ANNOUNCEMENT") return roleToAnnouncementPath[userRole] || "/";
    if (userRole === "Parent") return "/parent/notifications";
    return "/";
  };

  const onNotificationClick = async (n) => {
    if (!n?.isRead) await markRead(n._id);
    setOpen(false);
    navigate(resolveRoute(n));
  };

  return (
    <div ref={wrapRef} className="position-relative">
      {/* Injected UI Styles for the dropdown */}
      <style>{`
        .notif-dropdown {
          transform-origin: top right;
          animation: dropFade 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes dropFade {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .notif-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .notif-scroll::-webkit-scrollbar-track {
          background: #f8f9fa; 
        }
        .notif-scroll::-webkit-scrollbar-thumb {
          background: #dee2e6; 
          border-radius: 10px;
        }
        .notif-scroll::-webkit-scrollbar-thumb:hover {
          background: #ced4da; 
        }
        .notif-item {
          transition: background-color 0.2s ease;
        }
        .notif-item:hover {
          background-color: #f8fafc !important;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}</style>

      {/* Bell Button */}
      <button
        type="button"
        className={`${buttonClassName} position-relative d-inline-flex align-items-center justify-content-center`}
        style={{ border: "1px solid rgba(255,255,255,.35)", width: "36px", height: "36px" }}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <i className="bi bi-bell fs-5" />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: "0.65rem", padding: "0.3em 0.5em" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="visually-hidden">unread messages</span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-4 border border-light notif-dropdown"
          style={{ width: "380px", zIndex: 2000, overflow: "hidden" }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-light bg-opacity-50">
            <h6 className="mb-0 fw-bold text-dark">Notifications</h6>
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none fw-semibold p-0"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              style={{ color: unreadCount === 0 ? "#adb5bd" : "#2563eb" }}
            >
              <i className="bi bi-check2-all me-1"></i> Mark all read
            </button>
          </div>

          {/* List Area */}
          <div className="notif-scroll" style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
            
            {/* Loading State */}
            {loading && list.length === 0 && (
              <div className="px-4 py-5 text-center">
                <div className="spinner-border spinner-border-sm text-primary mb-3" role="status"></div>
                <p className="text-muted small fw-medium mb-0">Fetching notifications...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && list.length === 0 && (
              <div className="px-4 py-5 text-center">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px" }}>
                  <i className="bi bi-bell-slash text-muted fs-3"></i>
                </div>
                <h6 className="fw-semibold text-dark">You're all caught up!</h6>
                <p className="text-muted small mb-0">No new notifications right now.</p>
              </div>
            )}

            {/* Notification Items */}
            {list.map((n) => (
              <button
                key={n._id}
                type="button"
                className={`w-100 text-start border-0 px-4 py-3 border-bottom notif-item position-relative ${n.isRead ? 'bg-white' : 'bg-primary bg-opacity-10'}`}
                onClick={() => onNotificationClick(n)}
              >
                {/* Unread Indicator Dot */}
                {!n.isRead && (
                  <div className="position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle bg-primary" style={{ width: "6px", height: "6px" }}></div>
                )}

                <div className="d-flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${n.isRead ? 'bg-light text-secondary' : 'bg-white text-primary shadow-sm'}`} style={{ width: "40px", height: "40px" }}>
                      <i className={`bi ${n.isRead ? 'bi-bell' : 'bi-bell-fill'}`}></i>
                    </div>
                  </div>
                  
                  <div className="flex-grow-1 min-vw-0">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className={`fw-bold text-truncate pe-2 ${n.isRead ? 'text-dark' : 'text-primary'}`} style={{ fontSize: "0.9rem" }}>
                        {n.title}
                      </div>
                      <div className="text-muted flex-shrink-0 text-nowrap" style={{ fontSize: "0.75rem", paddingTop: "2px" }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    <div className={`small line-clamp-2 ${n.isRead ? 'text-muted' : 'text-dark opacity-75'}`} style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {n.message}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
          </div>
          
          {/* Footer (Optional, to match SaaS feel) */}
          {list.length > 0 && (
             <div className="p-2 text-center border-top bg-light bg-opacity-50">
               <span className="small text-muted" style={{ fontSize: "11px" }}>End of notifications</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}