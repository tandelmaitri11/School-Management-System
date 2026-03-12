import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import NotificationBell from "../../Components/NotificationBell";
import useNotifications from "../../hooks/useNotifications";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";

export default function ParentNavbar({ children }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { unreadCount } = useNotifications(50);
  const { settings } = useDashboardSettings();
  const isDark = settings.theme === "dark";

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("parentId");
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `d-flex align-items-center gap-3 px-3 py-2 mt-1 rounded-3 text-decoration-none fw-medium transition-all ${
      isActive ? "bg-primary text-white shadow-sm" : ""
    }`;

  return (
    <div
      className="d-flex min-vh-100 dashboard-shell"
      style={{ background: "var(--dash-bg)", color: "var(--dash-text)", fontSize: "var(--dash-font-size)" }}
    >
      <aside
        className="border-end shadow-sm d-flex flex-column z-3"
        style={{
          width: "260px",
          position: "sticky",
          top: 0,
          height: "100vh",
          background: "var(--dash-card-bg)",
          borderColor: "var(--dash-border)",
        }}
      >
        <div className="p-4 d-flex align-items-center gap-3 border-bottom" style={{ borderColor: "var(--dash-border)" }}>
          <div className="bg-primary bg-gradient text-white rounded p-2 d-flex justify-content-center align-items-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
            </svg>
          </div>
          <div className="fw-bold fs-5" style={{ letterSpacing: "0.5px", color: "var(--dash-text)" }}>Parent Portal</div>
        </div>

        <div className="px-3 py-3 flex-grow-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="text-uppercase text-muted fw-bold mb-2 px-3 mt-1" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>
            Main Menu
          </div>
          <nav className="nav flex-column gap-1">
            <NavLink to="/parent/dashboard" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.293l6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zm5-.793V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
                <path d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
              </svg>
              Dashboard
            </NavLink>

            <NavLink to="/parent/profile" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              </svg>
              Child Profile
            </NavLink>

            <NavLink to="/parent/attendance" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
              </svg>
              Attendance
            </NavLink>

            <NavLink to="/parent/performance" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z"/>
              </svg>
              Performance
            </NavLink>

            <NavLink to="/parent/exams" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                <path d="M4.5 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Exams
            </NavLink>

            <NavLink to="/parent/fees" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
              </svg>
              Fees
            </NavLink>

            <NavLink to="/parent/notifications" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
              <span className="flex-grow-1">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill ms-auto">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/parent/settings" className={navLinkClass} style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--dash-text)" })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.703-2.687.701-1.984 1.984l.17.31a1.464 1.464 0 0 1-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.703 1.283.701 2.687 1.984 1.984l.31-.17a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.703 2.687-.701 1.984-1.984l-.17-.31a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.703-1.283-.701-2.687-1.984-1.984l-.31.17a1.464 1.464 0 0 1-2.105-.872zM8 10.93A2.93 2.93 0 1 1 8 5.07a2.93 2.93 0 0 1 0 5.86z"/>
              </svg>
              Settings & Appearance
            </NavLink>
          </nav>
        </div>

        <div className="mt-auto p-4 border-top" style={{ borderColor: "var(--dash-border)", background: "var(--dash-soft-bg)" }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: "42px", height: "42px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
              </svg>
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold text-truncate" style={{ fontSize: "0.9rem", color: "var(--dash-text)" }}>
                {localStorage.getItem("userName") || "Parent User"}
              </div>
              <div className="text-muted small text-truncate" style={{ fontSize: "0.8rem" }}>
                Logged In
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn w-100 text-danger d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-3 transition-all"
            style={{ background: isDark ? "var(--dash-card-bg)" : "#fff", borderColor: "var(--dash-border)" }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 d-flex flex-column overflow-auto position-relative" style={{ height: "100vh", background: "var(--dash-bg)" }}>
        <div
          className="border-bottom shadow-sm px-4 py-3 d-flex align-items-center justify-content-end gap-3"
          style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-border)" }}
        >
          <NotificationBell buttonClassName="btn btn-light border rounded-circle d-flex align-items-center justify-content-center" />
        </div>
        <div className="p-4">
          {children}
        </div>
      </main>

      {showLogoutConfirm ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(15, 23, 42, 0.45)", zIndex: 2000 }}
        >
          <div
            className="rounded-4 shadow-lg p-4"
            style={{ width: "100%", maxWidth: "420px", background: "var(--dash-card-bg)", color: "var(--dash-text)" }}
          >
            <h5 className="fw-bold mb-2">Confirm Sign Out</h5>
            <p className="text-muted mb-4">Are you sure you want to sign out from the parent portal?</p>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light border"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
