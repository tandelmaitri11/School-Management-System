import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Badge, Dropdown, Navbar } from "react-bootstrap";
import api from "../../api/api";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";
import NotificationBell from "../../Components/NotificationBell";
import useNotifications from "../../hooks/useNotifications";

// --- MODERN PROFESSIONAL LIGHT THEME STYLES ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #f8fafc;
  }

  /* Custom Scrollbar */
  .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .sidebar-scroll::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* Sidebar Branding */
  .modern-sidebar {
    background-color: #ffffff;
    border-right: 1px solid #e2e8f0;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
  }

  /* Navigation Links */
  .nav-link-item { 
    color: #64748b; 
    border-radius: 10px; 
    margin: 0.25rem 1rem; 
    padding: 0.65rem 1rem;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.2s ease; 
  }
  .nav-link-item:hover { 
    background-color: #f1f5f9; 
    color: #0f172a; 
  }
  .nav-link-item i {
    font-size: 1.15rem;
    color: #94a3b8;
    transition: color 0.2s ease;
  }
  .nav-link-item:hover i {
    color: #475569;
  }
  
  /* Active Link State */
  .nav-active { 
    background-color: #eef2ff !important; 
    color: #4f46e5 !important; 
    font-weight: 600; 
  }
  .nav-active i {
    color: #4f46e5 !important;
  }
  
  /* Submenu Styling */
  .submenu-container { 
    margin-left: 2.2rem;
    margin-right: 1rem;
    padding-left: 0.75rem;
    border-left: 2px solid #e2e8f0;
    animation: slideDown 0.2s ease-out forwards; 
    transform-origin: top; 
  }
  .submenu-link {
    color: #64748b;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .submenu-link:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
  .submenu-active {
    color: #4f46e5 !important;
    font-weight: 600;
    background-color: transparent;
  }

  /* Top Navbar */
  .modern-topbar {
    background-color: #ffffff !important;
    border-bottom: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
  }

  /* Utilities */
  .rotate-180 { transform: rotate(180deg); }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function StudentNavbar({ children }) {
  const navigate = useNavigate();
  const { settings } = useDashboardSettings();
  const isDark = settings.theme === "dark"; // Logic kept, but styles enforce the clean light UI requested
  const studentId = localStorage.getItem("studentId");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Student");
  const [studentClass, setStudentClass] = useState(localStorage.getItem("studentClass") || "N/A");
  const [studentSection, setStudentSection] = useState(localStorage.getItem("studentSection") || "");
  const [studentStream, setStudentStream] = useState(localStorage.getItem("studentStream") || "");
  const [completionStatus, setCompletionStatus] = useState(localStorage.getItem("completionStatus") || "");
  const [isNewPromotion, setIsNewPromotion] = useState(localStorage.getItem("isNewPromotion") === "true");
  const { notifications } = useNotifications(100);
  const unreadAssignmentCount = (notifications || []).filter(
    (n) => n?.type === "ASSIGNMENT" && !n?.isRead
  ).length;
  const unreadAnnouncementCount = (notifications || []).filter(
    (n) => n?.type === "ANNOUNCEMENT" && !n?.isRead
  ).length;

  // --- STATE ---
  const [activeSubmenu, setActiveSubmenu] = useState(null);
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

  useEffect(() => {
    const syncStudentPlacement = async () => {
      try {
        if (!studentId) return;
        const res = await api.get(`/api/studentDashboard/profile/${studentId}`);
        const profile = res.data || {};
        const nextName = profile?.name || "Student";
        const nextClass = String(profile?.studentClass || "N/A");
        const nextSection = String(profile?.section || "");
        const nextStream = String(profile?.stream || "");
        const nextCompletion = String(profile?.completionStatus || "");
        const nextIsNewPromotion = !!profile?.isNewPromotion;

        setUserName(nextName);
        setStudentClass(nextClass);
        setStudentSection(nextSection);
        setStudentStream(nextStream);
        setCompletionStatus(nextCompletion);
        setIsNewPromotion(nextIsNewPromotion);

        localStorage.setItem("userName", nextName);
        localStorage.setItem("studentClass", nextClass);
        localStorage.setItem("studentSection", nextSection);
        localStorage.setItem("studentStream", nextStream);
        localStorage.setItem("completionStatus", nextCompletion);
        localStorage.setItem("isNewPromotion", String(nextIsNewPromotion));
      } catch (error) {
        console.error("Failed to sync student placement:", error);
      }
    };

    syncStudentPlacement();
  }, [studentId]);

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
    { to: "/student/dashboard", label: "Dashboard", icon: "bi-grid" },
    {
      label: "Assignments",
      icon: "bi-journal-bookmark",
      to: "/student/assignments",
      submenu: [
        { label: "View All", to: "/student/assignments" },
        { label: "Submit Work", to: "/student/submitassignments" },
      ],
    },
    {
      label: "Exams",
      icon: "bi-trophy",
      to: "/student/exams",
      submenu: [{ label: "All Exams", to: "/student/exams" }],
    },
    { to: "/student/lms", label: "Learning (LMS)", icon: "bi-play-circle" },
    { to: "/timetable", label: "TimeTable", icon: "bi-calendar-week" },
    { to: "/student/attendance/view", label: "Attendance", icon: "bi-check-circle" },
    { to: "/student/report", label: "Progress Report", icon: "bi-bar-chart-line" },
    { to: "/student/analytics", label: "Analytics", icon: "bi-graph-up" },
    { to: "/student/fees", label: "Fees", icon: "bi-wallet2" },
    { to: "/student/announcements", label: "Notifications", icon: "bi-megaphone" },
  ];

  return (
    <div
      className="d-flex dashboard-shell"
      style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}
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
          className="d-flex flex-column modern-sidebar"
          style={{
            width: "260px",
            height: "100vh",
            position: "fixed",
            top: 0, left: 0,
            zIndex: 1050,
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
        {/* Logo Section */}
        <div className="d-flex align-items-center px-4 py-4" style={{ height: "76px", borderBottom: "1px solid #e2e8f0" }}>
          <div className="fw-bold fs-4 d-flex align-items-center" style={{ color: "#4f46e5" }}>
            <div className="d-flex align-items-center justify-content-center text-white me-3 rounded-3" style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)" }}>
               <i className="bi bi-mortarboard-fill fs-5"></i>
            </div>
            <span style={{ letterSpacing: "-0.5px" }}>SchoolY</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow-1 overflow-auto sidebar-scroll py-4">
          <small className="text-uppercase fw-bold mb-3 d-block ps-4" style={{ fontSize: "0.7rem", letterSpacing: "1.2px", color: "#94a3b8" }}>
            Main Menu
          </small>
          
          <nav className="nav flex-column gap-1">
            {menuItems.map((item, index) => {
              const hasSub = !!item.submenu;
              const isActiveParent = activeSubmenu === item.label;

              return (
                <div key={index}>
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
                      `d-flex align-items-center text-decoration-none nav-link-item ${
                        !hasSub && isActive ? "nav-active" : ""
                      }`
                    }
                  >
                    <i className={`bi ${item.icon} me-3`}></i>
                    <span className="flex-grow-1">{item.label}</span>
                    
                    {/* Badge */}
                    {item.label === "Assignments" && unreadAssignmentCount > 0 && (
                      <Badge bg="danger" pill className="ms-2 shadow-sm fw-normal px-2">
                        {unreadAssignmentCount}
                      </Badge>
                    )}
                    {item.label === "Notifications" && unreadAnnouncementCount > 0 && (
                      <Badge bg="danger" pill className="ms-2 shadow-sm fw-normal px-2">
                        {unreadAnnouncementCount}
                      </Badge>
                    )}

                    {/* Chevron */}
                    {hasSub && (
                      <i className={`bi bi-chevron-down ms-2 ${isActiveParent ? "rotate-180" : ""}`} 
                         style={{ fontSize: '0.75rem', transition: 'transform 0.2s', opacity: 0.5 }}></i>
                    )}
                  </NavLink>

                  {/* Submenu */}
                  {hasSub && isActiveParent && (
                    <div className="submenu-container mt-1 mb-2">
                      {item.submenu.map((sub, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={sub.to}
                          onClick={() => isMobile && setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `d-block text-decoration-none submenu-link mb-1 ${
                              isActive ? "submenu-active" : ""
                            }`
                          }
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

        {/* Sidebar Footer */}
        <div className="p-4" style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
           <div className="d-flex align-items-center text-muted">
              <i className="bi bi-shield-check me-2 text-success"></i>
              <small style={{fontSize:'0.75rem', fontWeight: 500}}>Secure Portal</small>
           </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div 
        className="flex-grow-1 d-flex flex-column" 
        style={{ 
          marginLeft: !isMobile && sidebarOpen ? "260px" : "0", 
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: "100%",
          minHeight: "100vh"
        }}
      >
        
        {/* --- TOP HEADER --- */}
        <Navbar
          expand
          className="py-2 px-4 sticky-top modern-topbar d-flex justify-content-between"
          style={{ height: "76px" }}
        >
          <div className="d-flex align-items-center">
            {/* Toggle Button */}
            <button
              className="btn btn-light rounded-circle d-flex align-items-center justify-content-center me-3 border-0 shadow-sm"
              style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', color: '#475569' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <h5 className="m-0 d-none d-md-block fw-semibold" style={{ color: '#0f172a' }}>Student Portal</h5>
          </div>

          <div className="d-flex align-items-center gap-2 gap-md-4">
            {/* Notification Bell */}
            <div className="d-flex align-items-center justify-content-center">
               <NotificationBell buttonClassName="btn btn-light rounded-circle border-0 text-secondary" />
            </div>

            <div style={{ height: '32px', width: '1px', backgroundColor: '#e2e8f0' }} className="d-none d-sm-block"></div>

            {/* User Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0 bg-transparent shadow-none text-dark p-1 rounded-pill hover-bg-light">
                <div className="text-end me-3 d-none d-sm-block">
                  <div className="fw-semibold" style={{ fontSize: "0.9rem", color: '#0f172a' }}>{userName}</div>
                  <div style={{ fontSize: "0.75rem", color: '#64748b', fontWeight: 500 }}>
                    {completionStatus === "Completed Class 12"
                      ? "Graduated"
                      : `Class ${studentClass}${studentSection ? `-${studentSection}` : ""}${studentStream ? ` (${studentStream})` : ""}`}
                    
                    {isNewPromotion && completionStatus !== "Completed Class 12" && (
                      <span className="badge bg-warning text-dark ms-2 rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>NEW</span>
                    )}
                  </div>
                </div>
                <div className="position-relative">
                  <img
                    src="https://ui-avatars.com/api/?name=Student&background=e0e7ff&color=4f46e5"
                    alt="avatar"
                    className="rounded-circle shadow-sm"
                    width="42"
                    height="42"
                    style={{ border: '2px solid #ffffff' }}
                  />
                  <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle" style={{ width: '12px', height: '12px' }}></span>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-lg border-0 mt-3 rounded-4 p-2" style={{ minWidth: '220px', animation: 'slideDown 0.2s ease-out forwards' }}>
                <div className="px-3 py-2 mb-2 border-bottom d-sm-none">
                  <div className="fw-semibold text-dark">{userName}</div>
                  <div className="small text-muted">Class {studentClass}</div>
                </div>
                
                <Dropdown.Item as={NavLink} to="/studentprofile" className="rounded-3 py-2 text-secondary mb-1">
                   <i className="bi bi-person me-3 text-primary"></i> My Profile
                </Dropdown.Item>
                <Dropdown.Item as={NavLink} to="/student/settings" className="rounded-3 py-2 text-secondary mb-1">
                   <i className="bi bi-gear me-3 text-primary"></i> Settings
                </Dropdown.Item>
                <Dropdown.Divider className="my-2 opacity-50" />
                <Dropdown.Item onClick={handleLogout} className="rounded-3 py-2 text-danger">
                   <i className="bi bi-box-arrow-right me-3"></i> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar>

        {/* --- DYNAMIC PAGE CONTENT --- */}
        <main className="p-4 p-md-5 flex-grow-1" style={{ overflowX: "hidden", color: "#0f172a" }}>
          {children}
        </main>
      </div>
    </div>
  );
}