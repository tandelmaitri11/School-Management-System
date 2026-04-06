import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Badge, Dropdown, Navbar } from "react-bootstrap";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";
import NotificationBell from "../../Components/NotificationBell";
import useNotifications from "../../hooks/useNotifications";

// --- INTERNAL STYLES (For animations & scrollbars) ---
const globalStyles = `
  .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .sidebar-scroll::-webkit-scrollbar { width: 5px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  .nav-link-item { transition: all 0.2s ease-in-out; border-radius: 8px; margin-bottom: 4px; }
  .nav-link-item:hover { background-color: #f1f5f9; color: #3b6ea5; }
  
  .nav-active { background-color: #e0f2fe !important; color: #0284c7 !important; font-weight: 600; }
  
  .submenu-container { animation: slideDown 0.2s ease-out forwards; transform-origin: top; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function StudentNavbar({ children }) {
  const navigate = useNavigate();
  const { settings } = useDashboardSettings();
  const isDark = settings.theme === "dark";
  const userName = localStorage.getItem("userName") || "Student";
  const studentClass = localStorage.getItem("studentClass") || "N/A";
  const studentSection = localStorage.getItem("studentSection") || "";
  const studentStream = localStorage.getItem("studentStream") || "";
  const { notifications } = useNotifications(100);
  const unreadAssignmentCount = (notifications || []).filter(
    (n) => n?.type === "ASSIGNMENT" && !n?.isRead
  ).length;
  const unreadAnnouncementCount = (notifications || []).filter(
    (n) => n?.type === "ANNOUNCEMENT" && !n?.isRead
  ).length;

  // --- STATE ---
  const [activeSubmenu, setActiveSubmenu] = useState(null); // Track which submenu is open
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- HANDLERS ---
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSubmenu = (label) => {
    setActiveSubmenu(activeSubmenu === label ? null : label);
  };

  // --- MENU CONFIG ---
  const menuItems = [
    { to: "/student/dashboard", label: "Dashboard", icon: "bi-grid-fill" },
    {
      label: "Assignments",
      icon: "bi-journal-bookmark-fill",
      to: "/student/assignments",
      submenu: [
        { label: "View All", to: "/student/assignments" },
        { label: "Submit Work", to: "/student/submitassignments" },
      ],
    },
    {
      label: "Exams",
      icon: "bi-trophy-fill",
      to: "/student/exams",
      submenu: [{ label: "All Exams", to: "/student/exams" }],
    },
    { to: "/student/lms", label: "Learning (LMS)", icon: "bi-play-circle-fill" },
    { to: "/timetable", label: "TimeTable", icon: "bi-calendar-week-fill" },
    { to: "/student/attendance/view", label: "Attendance", icon: "bi-check-circle-fill" },
    { to: "/student/report", label: "Progress Report", icon: "bi-bar-chart-line-fill" },
    { to: "/student/analytics", label: "Analytics", icon: "bi-graph-up" },
    { to: "/student/fees", label: "Fees", icon: "bi-wallet-fill" },
    { to: "/student/announcements", label: "Announcements / Notifications", icon: "bi-megaphone-fill" },
  ];

  return (
    <div
      className="d-flex dashboard-shell"
      style={{ backgroundColor: "var(--dash-bg)", minHeight: "100vh", fontSize: "var(--dash-font-size)" }}
    >
      <style>{globalStyles}</style>

      {/* --- OVERLAY (Mobile) --- */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.4)", zIndex: 1040, backdropFilter: "blur(2px)"
          }}
        />
      )}

      {/* --- SIDEBAR --- */}
        <aside
          className="d-flex flex-column bg-white shadow-sm"
          style={{
            width: "260px",
            height: "100vh",
          position: "fixed",
          top: 0, left: 0,
            zIndex: 1050,
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            borderRight: "1px solid var(--dash-border)",
            background: "var(--dash-card-bg)",
          }}
        >
        {/* Logo Section */}
        <div className="d-flex align-items-center justify-content-center py-4 border-bottom" style={{ height: "70px" }}>
          <div className="fw-bold text-primary fs-4 d-flex align-items-center">
            <i className="bi bi-mortarboard-fill me-2 fs-3"></i>
            SchoolY
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow-1 overflow-auto sidebar-scroll p-3">
          <small className="text-uppercase text-muted fw-bold ms-2 mb-2 d-block" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
            Main Menu
          </small>
          
          <nav className="nav flex-column">
            {menuItems.map((item, index) => {
              const hasSub = !!item.submenu;
              const isActiveParent = activeSubmenu === item.label;

              return (
                <div key={index} className="mb-1">
                  <NavLink
                    to={item.to}
                    onClick={(e) => {
                      if (hasSub) {
                        e.preventDefault();
                        toggleSubmenu(item.label);
                      } else {
                        if (isMobile) setSidebarOpen(false);
                      }
                    }}
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center px-3 py-2 nav-link-item text-dark ${
                        !hasSub && isActive ? "nav-active" : ""
                      }`
                    }
                  >
                    <i className={`bi ${item.icon} me-3 fs-5`} style={{ opacity: 0.7 }}></i>
                    <span className="flex-grow-1">{item.label}</span>
                    
                    {/* Badge */}
                    {item.label === "Assignments" && unreadAssignmentCount > 0 && (
                      <Badge bg="danger" pill className="ms-2 shadow-sm">
                        {unreadAssignmentCount}
                      </Badge>
                    )}
                    {item.label === "Announcements / Notifications" && unreadAnnouncementCount > 0 && (
                      <Badge bg="danger" pill className="ms-2 shadow-sm">
                        {unreadAnnouncementCount}
                      </Badge>
                    )}

                    {/* Chevron */}
                    {hasSub && (
                      <i className={`bi bi-chevron-down ms-2 transition-transform ${isActiveParent ? "rotate-180" : ""}`} 
                         style={{ fontSize: '0.8rem', transform: isActiveParent ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}></i>
                    )}
                  </NavLink>

                  {/* Submenu */}
                  {hasSub && isActiveParent && (
                    <div className="submenu-container ms-4 ps-2 border-start border-2 mt-1">
                      {item.submenu.map((sub, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={sub.to}
                          onClick={() => isMobile && setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `d-block py-2 px-3 text-decoration-none rounded-2 mb-1 ${
                              isActive ? "text-primary bg-light fw-semibold" : "text-muted"
                            }`
                          }
                          style={{ fontSize: "0.9rem" }}
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Optional Info) */}
        <div className="p-3 border-top text-center bg-light">
           <small className="text-muted" style={{fontSize:'11px'}}>© 2024 SchoolY Portal</small>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div 
        className="flex-grow-1 d-flex flex-column" 
        style={{ 
          marginLeft: !isMobile && sidebarOpen ? "260px" : "0", 
          transition: "margin-left 0.3s ease",
          width: "100%"
        }}
      >
        
        {/* --- TOP HEADER --- */}
        <Navbar
          expand
          className="shadow-sm py-2 px-3 sticky-top"
          style={{
            height: "70px",
            borderBottom: "1px solid var(--dash-border)",
            background: isDark ? "#17181a" : "#fff",
            color: "var(--dash-text)",
          }}
        >
          <div className="d-flex align-items-center w-100">
            {/* Toggle Button */}
            <button
              className="btn btn-light border-0 me-3 text-secondary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            {/* Page Title (Optional dynamic logic could go here) */}
            <h5 className="m-0 d-none d-md-block text-secondary fw-normal">Student Portal</h5>

            <div className="ms-auto d-flex align-items-center gap-3">
              <NotificationBell buttonClassName="btn btn-light border-0 rounded-pill" />

              {/* User Dropdown */}
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0 bg-transparent text-dark p-0">
                  <div className="text-end me-2 d-none d-sm-block">
                    <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{userName}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Class {studentClass}
                      {studentSection ? `-${studentSection}` : ""}
                      {studentStream ? ` (${studentStream})` : ""}
                    </div>
                  </div>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="avatar"
                    className="rounded-circle border"
                    width="40"
                    height="40"
                  />
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 mt-2">
                  <Dropdown.Item as={NavLink} to="/studentprofile">
                     <i className="bi bi-person me-2"></i> My Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={NavLink} to="/student/settings">
                     <i className="bi bi-gear me-2"></i> Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                     <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Navbar>

        {/* --- DYNAMIC PAGE CONTENT --- */}
        <main className="p-4" style={{ overflowX: "hidden", background: "var(--dash-bg)", color: "var(--dash-text)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
