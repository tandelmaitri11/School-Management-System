import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";
import NotificationBell from "../../Components/NotificationBell";

const sidebarScrollStyles = `
  .sidebar-scroll {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .sidebar-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

function Navbar({ children }) {
  const navigate = useNavigate();
  const { settings } = useDashboardSettings();
  const isDark = settings.theme === "dark";

  const [openMenu, setOpenMenu] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userName = localStorage.getItem("userName") || "Admin";
  const userRole = localStorage.getItem("userRole") || "Administrator";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Optional: close submenu when collapsing
  useEffect(() => {
    if (sidebarCollapsed) setOpenMenu(null);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 991.98px)");
    const update = () => {
      setIsMobile(media.matches);
      if (media.matches) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      } else {
        setSidebarOpen(true);
      }
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const menuItems = [
    { label: "Dashboard", icon: "bi-speedometer2", path: "/Dashboard" },
    {
      label: "Classes",
      icon: "bi-easel",
      submenu: [
        { label: "All Classes", path: "/classes/all" },
        { label: "Add New", path: "/classes/new" },
      ],
    },
    {
      label: "Subject",
      icon: "bi-journal-bookmark",
      submenu: [
        { label: "All Subject", path: "/subject/allsubject" },
        { label: "Add New Subject", path: "/subject/newsubject" },
      ],
    },
    {
      label: "TimeTable",
      icon: "bi-calendar2-week",
      submenu: [
        { label: "Manage TimeTable", path: "/admin/timetable" },
        { label: "View Class TimeTable", path: "/admin/view/timetable" },
      ],
    },
    {
      label: "Students",
      icon: "bi-people",
      submenu: [
        { label: "All Students", path: "/Students/allstudents" },
      ],
    },
    {
      label: "Teacher",
      icon: "bi-person-badge-fill",
      submenu: [
        { label: "All Teachers", path: "/teacher/allteacher" },
        { label: "Add New", path: "/teacher/addteacher" },
        { label: "Class/Section List", path: "/teacher/assignments" },
        { label: "Attendance", path: "/teacher/attendance" },
      ],
    },
    {
      label: "Attendance",
      icon: "bi-card-checklist",
      submenu: [
        { label: "Student Attendance", path: "/attendance/student_attendance" },
        { label: "Teacher Attendance", path: "/attendance/teacher_attendance" },
      ],
    },
    {
      label: "Fees",
      icon: "bi-wallet2",
      submenu: [
        { label: "Fees Structure", path: "/admin/fees" },
        { label: "Student Fees", path: "/studentfees" },
        { label: "Fees Reports", path: "/admin/fees-reports" },
      ],
    },
    {
      label: "Salary",
      icon: "bi-cash-coin",
      submenu: [
        { label: "Teacher Salary", path: "/approve-salary" },
        { label: "Teacher Salary Record", path: "/teacher-salary-record" },
        { label: "Salary Lists", path: "/salarylist" },
      ],
    },
    {
      label: "LMS",
      icon: "bi-collection-play",
      submenu: [{ label: "LMS Control", path: "/admin/lms" }],
    },
    {
      label: "Contact",
      icon: "bi-chat-dots",
      submenu: [{ label: "Contact Messages", path: "/admin/contact/messages" }],
    },
    {
      label: "Announcements",
      icon: "bi-megaphone",
      submenu: [{ label: "Announcements / Notifications", path: "/admin/announcements" }],
    },
    {
      label: "Settings",
      icon: "bi-gear",
      submenu: [
        { label: "Appearance", path: "/settings/preferences" },
        { label: "Logout", action: handleLogout },
      ],
    },
  ];

  const shellStyle = {
    minHeight: "100vh",
    background: "var(--dash-bg)",
    color: "var(--dash-text)",
  };

  const headerStyle = {
    height: "70px",
    position: "sticky",
    top: 0,
    zIndex: 1030,
    background: isDark
      ? "linear-gradient(90deg, #111 0%, #2a2a2a 100%)"
      : "linear-gradient(90deg, #0d6efd 0%, #6f42c1 100%)",
    color: "white",
  };

  const sidebarWidth = isMobile ? 280 : sidebarCollapsed ? 84 : 280;

  const sidebarStyle = {
    width: sidebarWidth,
    transition: "width .2s ease",
    background: "var(--dash-card-bg)",
    borderRight: "1px solid var(--dash-border)",
    position: isMobile ? "fixed" : "sticky",
    top: 70,
    left: 0,
    height: "calc(100vh - 70px)",
    overflowY: "auto",
    zIndex: 1040,
    transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
    transitionProperty: "transform, width",
    boxShadow: isMobile ? "0 16px 40px rgba(0,0,0,0.18)" : "none",
  };

  const mainStyle = {
    minHeight: "calc(100vh - 70px - 44px)",
    padding: "1.25rem",
    overflow: "auto",
  };

  const footerStyle = {
    height: "44px",
    background: "var(--dash-card-bg)",
    borderTop: "1px solid var(--dash-border)",
    color: "var(--dash-muted)",
  };

  const navItemBase = {
    borderRadius: 12,
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textDecoration: "none",
    transition: "all .15s ease",
    border: "1px solid transparent",
  };

  const navItemInactive = {
    color: "var(--dash-text)",
  };

  const navItemActive = {
    color: "#0d6efd",
    background: "rgba(13,110,253,.10)",
    border: "1px solid rgba(13,110,253,.20)",
    fontWeight: 600,
  };

  const navIconStyle = {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f3f5",
    color: "var(--dash-text)",
    flex: "0 0 auto",
  };

  const sectionTitleStyle = {
    fontSize: 11,
    letterSpacing: ".08em",
    color: "var(--dash-muted)",
    fontWeight: 700,
    padding: sidebarCollapsed ? "10px 12px" : "12px 18px 6px",
    textTransform: "uppercase",
  };

  const submenuWrapStyle = {
    marginLeft: sidebarCollapsed ? 0 : 44,
    paddingLeft: sidebarCollapsed ? 0 : 10,
    borderLeft: sidebarCollapsed ? "none" : "1px dashed #dee2e6",
  };

  const submenuLinkBase = (isActive) => ({
    display: "block",
    textDecoration: "none",
    borderRadius: 10,
    padding: sidebarCollapsed ? "8px 10px" : "8px 12px",
    margin: "6px 0",
    color: isActive ? "#0d6efd" : "#6c757d",
    background: isActive ? "rgba(13,110,253,.10)" : "transparent",
    border: isActive ? "1px solid rgba(13,110,253,.20)" : "1px solid transparent",
    fontWeight: isActive ? 600 : 500,
    transition: "all .15s ease",
    textAlign: sidebarCollapsed ? "center" : "left",
  });

  const chevronBtnStyle = {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 10,
    display: sidebarCollapsed ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--dash-soft-bg)",
    border: "1px solid var(--dash-border)",
    color: "var(--dash-text)",
  };

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div style={{ ...shellStyle, fontSize: "var(--dash-font-size)" }} className="dashboard-shell">
      <style>{sidebarScrollStyles}</style>
      {/* HEADER */}
      <header style={headerStyle} className="d-flex align-items-center px-3 px-md-4 shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-light btn-sm rounded-pill d-lg-none"
            onClick={() => setSidebarOpen((s) => !s)}
            title="Menu"
            style={{ border: "1px solid rgba(255,255,255,.35)" }}
          >
            <i className="bi bi-list" />
          </button>
          <button
            className="btn btn-light btn-sm rounded-pill d-none d-lg-inline-flex"
            onClick={() => setSidebarCollapsed((s) => !s)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ border: "1px solid rgba(255,255,255,.35)" }}
          >
            <i className={`bi ${sidebarCollapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"}`} />
          </button>

          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: 38,
                height: 38,
                background: "rgba(255,255,255,.18)",
                border: "1px solid rgba(255,255,255,.22)",
              }}
            >
              <i className="bi bi-mortarboard-fill text-white" />
            </div>
            <div className="text-white">
              <div className="fw-bold" style={{ lineHeight: 1.1 }}>
                SchoolY Admin
              </div>
              <div className="small opacity-75" style={{ lineHeight: 1.1 }}>
                Smart Education Management
              </div>
            </div>
          </div>
        </div>

        <div className="ms-auto d-flex align-items-center gap-2">
          <NotificationBell />

          <div className="dropdown">
            <button
              className="btn btn-light btn-sm rounded-pill dropdown-toggle"
              data-bs-toggle="dropdown"
              style={{ border: "1px solid rgba(255,255,255,.35)" }}
            >
              <span className="fw-semibold">{userName}</span>
              <span className="opacity-75 ms-2 d-none d-md-inline">({userRole})</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 overflow-hidden">
              <li>
                <NavLink className="dropdown-item py-2" to="/profile">
                  <i className="bi bi-person me-2" />
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink className="dropdown-item py-2" to="/settings/preferences">
                  <i className="bi bi-gear me-2" />
                  Settings
                </NavLink>
              </li>
              <li>
                <hr className="dropdown-divider my-1" />
              </li>
              <li>
                <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 70,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 1035,
          }}
        />
      )}

      {/* BODY */}
      <div className="d-flex">
        {/* SIDEBAR */}
        <aside style={sidebarStyle} className="shadow-sm sidebar-scroll">
          <div className="p-3">
            <div
              className="d-flex align-items-center justify-content-between"
              style={{
                padding: sidebarCollapsed ? "6px 6px" : "10px 12px",
                borderRadius: 14,
                background: "#f8f9fa",
                border: "1px solid #e9ecef",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 34,
                    height: 34,
                    background: "linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)",
                    color: "#fff",
                    fontWeight: 800,
                  }}
                  title={userName}
                >
                  {(userName || "A").slice(0, 1).toUpperCase()}
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <div className="fw-semibold" style={{ lineHeight: 1.1 }}>
                      {userName}
                    </div>
                    <div className="small text-muted" style={{ lineHeight: 1.1 }}>
                      {userRole}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={sectionTitleStyle}>{sidebarCollapsed ? "MENU" : "Main Menu"}</div>

          <div className="px-2 pb-3">
            {menuItems.map((item, idx) => (
              <div key={idx} className="mb-1">
                {/* SUBMENU ITEM */}
                {item.submenu ? (
                  <>
                    <button
                      type="button"
                      className="w-100 bg-transparent border-0 text-start"
                      onClick={() => toggleMenu(item.label)}
                      style={{
                        ...navItemBase,
                        ...(openMenu === item.label ? navItemActive : navItemInactive),
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span style={navIconStyle}>
                        <i className={`bi ${item.icon}`} />
                      </span>

                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-grow-1">{item.label}</span>
                          <span style={chevronBtnStyle}>
                            <i className={`bi ${openMenu === item.label ? "bi-chevron-up" : "bi-chevron-down"}`} />
                          </span>
                        </>
                      )}
                    </button>

                    {/* submenu */}
                    {openMenu === item.label && (
                      <div style={{ ...submenuWrapStyle, marginTop: 6 }}>
                        {item.submenu.map((sub, i) => (
                          <div key={i}>
                            {sub.action ? (
                              <button
                                onClick={() => {
                                  sub.action();
                                  handleNavClick();
                                }}
                                className="w-100 bg-transparent border-0"
                                style={submenuLinkBase(false)}
                                title={sidebarCollapsed ? sub.label : undefined}
                              >
                                {sidebarCollapsed ? <i className="bi bi-box-arrow-right" /> : sub.label}
                              </button>
                            ) : (
                              <NavLink
                                to={sub.path}
                                onClick={handleNavClick}
                                style={({ isActive }) => submenuLinkBase(isActive)}
                                title={sidebarCollapsed ? sub.label : undefined}
                              >
                                {sidebarCollapsed ? <i className="bi bi-dot" /> : sub.label}
                              </NavLink>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* SINGLE LINK ITEM */
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    style={({ isActive }) => ({
                      ...navItemBase,
                      ...(isActive ? navItemActive : navItemInactive),
                    })}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span style={navIconStyle}>
                      <i className={`bi ${item.icon}`} />
                    </span>
                    {!sidebarCollapsed && <span className="flex-grow-1">{item.label}</span>}
                    {!sidebarCollapsed && <i className="bi bi-arrow-right-short opacity-50" />}
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={mainStyle} className="flex-grow-1">
          <div className="container-fluid">{children}</div>
        </main>
      </div>

      {/* FOOTER */}
      <footer style={footerStyle} className="d-flex align-items-center justify-content-center small">
        © 2025 <strong className="ms-1 me-1">SchoolY</strong> — Smart Education Management System
      </footer>
    </div>
  );
}

export default Navbar;
