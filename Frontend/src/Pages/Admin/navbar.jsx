import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";
import NotificationBell from "../../Components/NotificationBell";

function Navbar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    if (sidebarCollapsed) setOpenMenu(null);
  }, [sidebarCollapsed]);

  // Auto-expand submenu if a child route is active on load
  useEffect(() => {
    const currentPath = location.pathname;
    const activeParent = menuItems.find(item => 
      item.submenu && item.submenu.some(sub => currentPath.startsWith(sub.path))
    );
    if (activeParent && !sidebarCollapsed) {
      setOpenMenu(activeParent.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, sidebarCollapsed]);

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
    { label: "Dashboard", icon: "bi-grid-1x2-fill", path: "/Dashboard" },
    {
      label: "Classes",
      icon: "bi-easel2-fill",
      submenu: [
        { label: "All Classes", path: "/classes/all" },
        { label: "Add New", path: "/classes/new" },
      ],
    },
    {
      label: "Subject",
      icon: "bi-journal-bookmark-fill",
      submenu: [
        { label: "All Subject", path: "/subject/allsubject" },
        { label: "Add New Subject", path: "/subject/newsubject" },
      ],
    },
    {
      label: "TimeTable",
      icon: "bi-calendar-week-fill",
      submenu: [
        { label: "Manage TimeTable", path: "/admin/timetable" },
        { label: "View Class TimeTable", path: "/admin/view/timetable" },
      ],
    },
    {
      label: "Students",
      icon: "bi-mortarboard-fill",
      submenu: [
        { label: "All Students", path: "/Students/allstudents" },
      ],
    },
    {
      label: "Parents",
      icon: "bi-people-fill",
      submenu: [
        { label: "All Parents", path: "/admin/parents/all" },
        { label: "Add New Parent", path: "/admin/parents/add" },
      ],
    },
    {
      label: "Teacher",
      icon: "bi-person-video3",
      submenu: [
        { label: "All Teachers", path: "/teacher/allteacher" },
        { label: "Add New", path: "/teacher/addteacher" },
        { label: "Class/Section List", path: "/teacher/assignments" },
        { label: "Attendance", path: "/teacher/attendance" },
      ],
    },
    {
      label: "Attendance",
      icon: "bi-clipboard2-check-fill",
      submenu: [
        { label: "Student Attendance", path: "/attendance/student_attendance" },
        { label: "Teacher Attendance", path: "/attendance/teacher_attendance" },
      ],
    },
    {
      label: "Fees",
      icon: "bi-wallet-fill",
      submenu: [
        { label: "Fees Structure", path: "/admin/fees" },
        { label: "Student Fees", path: "/studentfees" },
        { label: "Fees Reports", path: "/admin/fees-reports" },
      ],
    },
    {
      label: "Salary",
      icon: "bi-cash-stack",
      submenu: [
        { label: "Teacher Salary", path: "/approve-salary" },
        { label: "Teacher Salary Record", path: "/teacher-salary-record" },
        { label: "Salary Lists", path: "/salarylist" },
      ],
    },
    {
      label: "LMS",
      icon: "bi-play-btn-fill",
      submenu: [{ label: "LMS Control", path: "/admin/lms" }],
    },
    {
      label: "Contact",
      icon: "bi-chat-left-dots-fill",
      submenu: [{ label: "Contact Messages", path: "/admin/contact/messages" }],
    },
     {
      label: "Analytics",
      icon: "bi-graph-up",
      submenu: [{ label: "Analytics", path: "/admin/analytics" }],
    },
    {
      label: "Announcements",
      icon: "bi-megaphone-fill",
      submenu: [{ label: "Announcements / Notifications", path: "/admin/announcements" }],
    },
    {
      label: "Settings",
      icon: "bi-gear-fill",
      submenu: [
        { label: "Appearance", path: "/settings/preferences" },
        { label: "Logout", action: handleLogout },
      ],
    },
  ];

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarWidth = isMobile ? 280 : sidebarCollapsed ? 88 : 280;

  return (
    <div className={`dashboard-shell ${isDark ? 'theme-dark' : 'theme-light'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Dynamic CSS Variables & Global Styles */}
      <style>{`
        :root {
          --brand-primary: #4f46e5;
          --brand-primary-light: rgba(79, 70, 229, 0.1);
          --brand-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        
        .theme-light {
          --bg-body: #f8fafc;
          --bg-surface: #ffffff;
          --bg-surface-hover: #f1f5f9;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
          --glass-bg: rgba(255, 255, 255, 0.85);
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
          --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .theme-dark {
          --bg-body: #0f172a;
          --bg-surface: #1e293b;
          --bg-surface-hover: #334155;
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
          --border-color: #334155;
          --glass-bg: rgba(30, 41, 59, 0.85);
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
          --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.2);
        }

        .dashboard-shell {
          min-height: 100vh;
          background: var(--bg-body);
          color: var(--text-main);
          display: flex;
          flex-direction: column;
        }

        /* Custom Scrollbar */
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--border-color) transparent;
        }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        /* Smooth Transitions */
        .sidebar-transition {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-item-base {
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: var(--text-muted);
          transition: all 0.2s ease;
          border: 1px solid transparent;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .nav-item-base:hover {
          background: var(--bg-surface-hover);
          color: var(--text-main);
        }

        .nav-item-active {
          color: var(--brand-primary) !important;
          background: var(--brand-primary-light);
          font-weight: 600;
        }

        .nav-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all 0.2s ease;
        }

        .nav-item-active .nav-icon {
          color: var(--brand-primary);
        }

        .submenu-link {
          display: block;
          text-decoration: none;
          border-radius: 8px;
          padding: 8px 12px 8px 46px; /* Indented to align with text */
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-bottom: 2px;
        }
        
        .submenu-link-collapsed {
          padding: 10px;
          text-align: center;
          font-size: 1.2rem;
        }

        .submenu-link:hover {
          color: var(--text-main);
          background: var(--bg-surface-hover);
        }

        .submenu-link.active {
          color: var(--brand-primary);
          font-weight: 600;
          background: transparent;
        }
        
        .submenu-link-collapsed.active {
          background: var(--brand-primary-light);
        }

        .glass-header {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
        }
      `}</style>

      {/* HEADER */}
      <header className="glass-header d-flex align-items-center justify-content-between px-3 px-md-4 shadow-sm" style={{ height: 72, position: "sticky", top: 0, zIndex: 1030 }}>
        
        {/* Left: Logo & Toggles */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn d-lg-none d-flex align-items-center justify-content-center"
            onClick={() => setSidebarOpen((s) => !s)}
            style={{ width: 40, height: 40, background: 'var(--bg-surface-hover)', border: 'none', color: 'var(--text-main)', borderRadius: '10px' }}
          >
            <i className="bi bi-list fs-5" />
          </button>
          
          <button
            className="btn d-none d-lg-flex align-items-center justify-content-center"
            onClick={() => setSidebarCollapsed((s) => !s)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ width: 40, height: 40, background: 'var(--bg-surface-hover)', border: 'none', color: 'var(--text-muted)', borderRadius: '10px' }}
          >
            <i className={`bi ${sidebarCollapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"} fs-5`} />
          </button>

          <div className="d-flex align-items-center gap-2 ms-1">
            <div className="d-flex align-items-center justify-content-center shadow-sm" style={{ width: 40, height: 40, background: 'var(--brand-gradient)', borderRadius: '12px' }}>
              <i className="bi bi-mortarboard-fill text-white fs-5" />
            </div>
            <div className="d-none d-sm-block">
              <h1 className="h6 mb-0 fw-bold text-dark" style={{ color: 'var(--text-main)' }}>SchoolY</h1>
              <span className="small text-muted d-block" style={{ fontSize: '0.75rem', marginTop: '-2px' }}>Workspace</span>
            </div>
          </div>
        </div>

        {/* Right: Profile & Notifications */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <NotificationBell />

          <div className="dropdown">
            <button
              className="btn d-flex align-items-center gap-2 p-1 pe-2 shadow-sm"
              data-bs-toggle="dropdown"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '100px' }}
            >
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontWeight: 700 }}>
                {(userName || "A").slice(0, 1).toUpperCase()}
              </div>
              <div className="d-none d-md-block text-start" style={{ lineHeight: 1.2 }}>
                <div className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{userName}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{userRole}</div>
              </div>
              <i className="bi bi-chevron-down text-muted ms-1 d-none d-md-block" style={{ fontSize: '0.8rem' }} />
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-2" style={{ borderRadius: '12px', minWidth: '200px', background: 'var(--bg-surface)' }}>
              <li>
                <NavLink className="dropdown-item rounded-3 py-2 d-flex align-items-center text-muted" to="/profile">
                  <i className="bi bi-person fs-5 me-3" /> Profile
                </NavLink>
              </li>
              <li>
                <NavLink className="dropdown-item rounded-3 py-2 d-flex align-items-center text-muted" to="/settings/preferences">
                  <i className="bi bi-gear fs-5 me-3" /> Settings
                </NavLink>
              </li>
              <li><hr className="dropdown-divider my-2 border-secondary opacity-25" /></li>
              <li>
                <button className="dropdown-item rounded-3 py-2 d-flex align-items-center text-danger fw-medium" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right fs-5 me-3" /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(2px)", zIndex: 1035 }}
        />
      )}

      {/* BODY CONFIGURATION */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* SIDEBAR */}
        <aside
          className="sidebar-transition custom-scroll"
          style={{
            width: sidebarWidth,
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border-color)",
            position: isMobile ? "fixed" : "relative",
            height: "calc(100vh - 72px)",
            overflowY: "auto",
            zIndex: 1040,
            transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
            boxShadow: isMobile ? "var(--shadow-md)" : "none",
          }}
        >
          <div className="p-3">
            <div className="text-muted fw-bold mb-2 ps-2" style={{ fontSize: "0.7rem", letterSpacing: "1px", marginTop: "10px" }}>
              {sidebarCollapsed ? "---" : "MAIN MENU"}
            </div>

            <div className="d-flex flex-column gap-1">
              {menuItems.map((item, idx) => (
                <div key={idx}>
                  {item.submenu ? (
                    <>
                      <button
                        type="button"
                        className={`w-100 bg-transparent text-start nav-item-base ${openMenu === item.label ? 'nav-item-active' : ''}`}
                        onClick={() => toggleMenu(item.label)}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <span className="nav-icon"><i className={`bi ${item.icon}`} /></span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-grow-1">{item.label}</span>
                            <i className={`bi bi-chevron-${openMenu === item.label ? "up" : "down"} text-muted`} style={{ fontSize: '0.8rem' }} />
                          </>
                        )}
                      </button>

                      {/* Submenu Items */}
                      {openMenu === item.label && (
                        <div className="mt-1 mb-2">
                          {item.submenu.map((sub, i) => (
                            <div key={i}>
                              {sub.action ? (
                                <button
                                  onClick={() => { sub.action(); handleNavClick(); }}
                                  className={`w-100 bg-transparent border-0 text-start ${sidebarCollapsed ? 'submenu-link-collapsed' : 'submenu-link'}`}
                                  title={sidebarCollapsed ? sub.label : undefined}
                                >
                                  {sidebarCollapsed ? <i className="bi bi-box-arrow-right text-danger" /> : sub.label}
                                </button>
                              ) : (
                                <NavLink
                                  to={sub.path}
                                  onClick={handleNavClick}
                                  className={({ isActive }) => `${sidebarCollapsed ? 'submenu-link-collapsed' : 'submenu-link'} ${isActive ? 'active' : ''}`}
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
                    <NavLink
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) => `nav-item-base ${isActive ? 'nav-item-active' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="nav-icon"><i className={`bi ${item.icon}`} /></span>
                      {!sidebarCollapsed && <span className="flex-grow-1">{item.label}</span>}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow-1 d-flex flex-column" style={{ height: "calc(100vh - 72px)", overflowY: "auto" }}>
          <div className="container-fluid flex-grow-1 p-4">
            {children}
          </div>
          
          {/* FOOTER */}
          <footer className="py-3 px-4 text-center text-muted border-top mt-auto" style={{ background: 'transparent', borderColor: 'var(--border-color)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} <strong className="text-dark" style={{ color: 'var(--text-main)' }}>SchoolY</strong> — Smart Education Management
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Navbar;