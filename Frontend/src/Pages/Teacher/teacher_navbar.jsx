import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api"; // Added API import to fetch the image
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button } from "react-bootstrap";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";
import NotificationBell from "../../Components/NotificationBell";
import useNotifications from "../../hooks/useNotifications";

const customStyles = `
  :root {
    --sidebar-width: 280px;
    --header-height: 76px;
    --brand-primary: #4f46e5;
    --brand-primary-soft: rgba(79, 70, 229, 0.1);
  }
  
  body {
    background-color: #f8fafc;
  }

  /* Custom Scrollbar */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Sidebar Links */
  .nav-item-custom {
    margin-bottom: 4px;
  }
  .sidebar-link {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
    color: #475569;
    font-weight: 500;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    text-decoration: none;
    border: 1px solid transparent;
  }
  .sidebar-link:hover {
    background-color: #f1f5f9;
    color: #0f172a;
    transform: translateX(4px);
  }
  .sidebar-link.active-group {
    background-color: var(--brand-primary-soft);
    color: var(--brand-primary);
    border-color: rgba(79, 70, 229, 0.2);
  }
  .sidebar-link.active-group i {
    color: var(--brand-primary) !important;
  }

  /* Submenu Links */
  .submenu-container {
    position: relative;
  }
  .submenu-container::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 0;
    bottom: 10px;
    width: 2px;
    background-color: #e2e8f0;
    border-radius: 2px;
  }
  .submenu-link {
    transition: all 0.2s ease;
    border-radius: 8px;
    color: #64748b;
    padding: 8px 16px 8px 48px;
    display: block;
    text-decoration: none;
    font-size: 0.9rem;
    position: relative;
  }
  .submenu-link:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
  .submenu-link.active {
    color: var(--brand-primary);
    font-weight: 600;
    background-color: var(--brand-primary-soft);
  }
  .submenu-link.active::before {
    content: '';
    position: absolute;
    left: 23px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background-color: var(--brand-primary);
    border-radius: 4px;
  }

  /* Floating Header */
  .glass-header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  /* Main Layout Transitions */
  .main-content {
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar-drawer {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Profile Hover Effect */
  .profile-hover {
    transition: all 0.2s ease;
  }
  .profile-hover:hover {
    background-color: #f1f5f9;
    transform: translateY(-2px);
  }
`;

export default function TeacherNavbar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useDashboardSettings();
  
  const userName = localStorage.getItem("userName") || "Teacher";
  const userRole = localStorage.getItem("userRole") || "Teacher";
  const teacherId = localStorage.getItem("teacherId");

  const [openMenu, setOpenMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 992);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // State to hold the live profile image
  const [navProfileImage, setNavProfileImage] = useState(localStorage.getItem("profileImage") || "");

  const { notifications } = useNotifications(100);
  const announcementCount = (notifications || []).filter(
    (n) => n?.type === "ANNOUNCEMENT" && !n?.isRead
  ).length;

  // Fetch the latest profile image on mount
  useEffect(() => {
    const fetchLatestProfileImage = async () => {
      if (!teacherId) return;
      try {
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
        if (res.data && res.data.picture) {
          setNavProfileImage(res.data.picture);
          // Update local storage so it doesn't flicker next time
          localStorage.setItem("profileImage", res.data.picture);
        }
      } catch (err) {
        console.error("Failed to fetch profile image for navbar:", err);
      }
    };
    fetchLatestProfileImage();
  }, [teacherId]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 992) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    localStorage.clear();
    setShowLogoutModal(false);
    navigate("/login");
  };
  const cancelLogout = () => setShowLogoutModal(false);

  const handleLinkClick = () => {
    if (windowWidth < 992) setSidebarOpen(false);
  };

  const menuItems = [
    { label: "Dashboard", icon: "bi-grid-1x2", path: "/teacher/dashboard" },
    {
      label: "My Classes",
      icon: "bi-easel2",
      submenu: [{ label: "All Classes", path: "/teacher/classes" }],
    },
    {
      label: "Time Table",
      icon: "bi-calendar3",
      submenu: [{ label: "Time Table", path: "/teacher/timetable" }],
    },
    {
      label: "Assignments",
      icon: "bi-journal-check",
      submenu: [
        { label: "Assign Assignment", path: "/teacher/assignment" },
        { label: "View Assignment", path: "/teacher/viewassignment" },
      ],
    },
    {
      label: "Exam",
      icon: "bi-file-earmark-text",
      submenu: [
        { label: "Add Exam", path: "/teacher/addexam" },
        { label: "Manage Exam", path: "/teacher/mangeexam" },
      ],
    },
    {
      label: "Students",
      icon: "bi-people",
      submenu: [
        { label: "View & Manage", path: "/teacher/viewmangestudents" },
        { label: "Attendance", path: "/teacher/student/attendance" },
        { label: "Attendance History", path: "/teacher/attendance-history" },
      ],
    },
    {
      label: "Parents",
      icon: "bi-chat-square-dots",
      submenu: [
        { label: "Leave Requests", path: "/teacher/parent/leave-requests" },
        { label: "Messages", path: "/teacher/parent/messages" },
      ],
    },
    {
      label: "Teacher",
      icon: "bi-person-badge",
      submenu: [
        { label: "My Attendance", path: "/teacher/my-attendance" },
        { label: "My Salary", path: "/teacher/my-salary" },
      ],
    },
    {
      label: "Reports",
      icon: "bi-bar-chart-line",
      submenu: [
        { label: "Attendance Report", path: "/teacher/reports/attendance" },
        { label: "Performance Report", path: "/teacher/reports/performance" },
      ],
    },
     {
      label: "Analytics",
      icon: "bi-graph-up",
      submenu: [
        { label: "Attendance Report", path: "/teacher/analytics" },
      ],
    },
    {
      label: "Learning",
      icon: "bi-collection-play",
      submenu: [
        { label: "LMS Content", path: "/teacher/lms" },
        { label: "Student LMS Progress", path: "/teacher/lms/student-progress" },
      ],
    },
    {
      label: "Announcements",
      icon: "bi-megaphone",
      submenu: [
        {
          label: "Announcements / Notifications",
          path: "/teacher/announcements",
        },
      ],
    },
    { label: "Profile", icon: "bi-person-circle", path: "/teacher/profile" },
    { label: "Settings", icon: "bi-gear", path: "/teacher/settings" },
  ];

  // Helper to construct the profile image URL properly
  const getProfileImageUrl = () => {
    if (!navProfileImage) return `https://ui-avatars.com/api/?name=${userName}&background=e2e8f0&color=475569&bold=true`;
    if (navProfileImage.startsWith("http") || navProfileImage.startsWith("blob:")) return navProfileImage;
    // Maps relative paths to your backend server (Assuming backend runs on port 3000 based on your profile component)
    return `http://localhost:3000/${navProfileImage.replace(/^\//, '')}`; 
  };

  return (
    <div className="d-flex flex-column dashboard-shell min-vh-100 position-relative">
      <style>{customStyles}</style>

      {/* --- SIDEBAR --- */}
      <aside 
        className="sidebar-drawer bg-white shadow-sm d-flex flex-column position-fixed top-0 start-0 h-100"
        style={{ 
          width: "var(--sidebar-width)", 
          zIndex: 1040,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Sidebar Brand/Logo Area */}
        <div className="d-flex align-items-center px-4" style={{ height: "var(--header-height)", borderBottom: "1px solid #f1f5f9" }}>
          <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: "36px", height: "36px" }}>
            <i className="bi bi-mortarboard-fill fs-5"></i>
          </div>
          <h4 className="mb-0 fw-bold text-dark tracking-wide fs-5">SchoolY<span className="text-primary">.</span></h4>
          
          {/* Mobile Close Button */}
          {windowWidth < 992 && (
            <button className="btn btn-sm btn-light border-0 ms-auto text-secondary rounded-circle" onClick={toggleSidebar}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="custom-scrollbar py-3 px-3 flex-grow-1" style={{ overflowY: "auto" }}>
          <div className="text-uppercase text-muted fw-bold mb-3 ps-2" style={{ fontSize: "0.7rem", letterSpacing: "1.2px" }}>
            Main Menu
          </div>
          <ul className="nav flex-column mb-4">
            {menuItems.map((item, idx) => {
              const isActiveGroup = item.submenu && item.submenu.some((sub) => sub.path === location.pathname);
              const isOpen = openMenu === item.label || isActiveGroup;
              const isSingleActive = location.pathname === item.path;

              return (
                <li key={idx} className="nav-item-custom w-100">
                  {item.submenu ? (
                    <>
                      <div
                        className={`sidebar-link justify-content-between ${isActiveGroup ? "active-group" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleMenu(item.label)}
                      >
                        <div className="d-flex align-items-center">
                          <i className={`bi ${item.icon} fs-5 me-3 ${isActiveGroup ? "text-primary" : "text-secondary opacity-75"}`}></i>
                          <span>{item.label}</span>
                          {item.label === "Announcements" && announcementCount > 0 && (
                            <span className="badge bg-danger rounded-pill ms-2 shadow-sm">{announcementCount}</span>
                          )}
                        </div>
                        <i className={`bi bi-chevron-${isOpen ? "up" : "down"} opacity-50`} style={{ fontSize: "0.8rem" }}></i>
                      </div>

                      {isOpen && (
                        <div className="submenu-container mt-1 mb-2">
                          {item.submenu.map((sub, i) => (
                            <NavLink
                              key={i}
                              to={sub.path}
                              onClick={handleLinkClick}
                              className={({ isActive }) => `submenu-link ${isActive ? "active" : ""}`}
                            >
                              {sub.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={handleLinkClick}
                      className={({ isActive }) => `sidebar-link ${isActive ? "active-group" : ""}`}
                    >
                      <i className={`bi ${item.icon} fs-5 me-3 ${isSingleActive ? "text-primary" : "text-secondary opacity-75"}`}></i>
                      <span>{item.label}</span>
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer User Info (Now Displays Uploaded Image) */}
        <div className="p-4 border-top" style={{ borderColor: "#f1f5f9" }}>
          <Link 
            to="/teacher/profile" 
            onClick={handleLinkClick} 
            className="d-flex align-items-center mb-3 text-decoration-none p-2 rounded-3 profile-hover"
            style={{ margin: "-8px -8px 16px -8px" }}
          >
            <img 
              src={getProfileImageUrl()} 
              alt="Profile" 
              className="rounded-circle me-3 shadow-sm border border-light"
              style={{ width: "42px", height: "42px", objectFit: "cover" }} 
              onError={(e) => {
                // Fallback if the image fails to load
                e.target.src = `https://ui-avatars.com/api/?name=${userName}&background=e2e8f0&color=475569&bold=true`;
              }}
            />
            <div className="overflow-hidden text-start flex-grow-1">
              <h6 className="mb-0 fw-bold text-dark text-truncate">{userName}</h6>
              <small className="text-muted text-truncate d-block">{userRole}</small>
            </div>
          </Link>
          <button className="btn btn-light w-100 rounded-3 fw-semibold text-danger d-flex justify-content-center align-items-center border-0 shadow-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </aside>

      {/* --- OVERLAY FOR MOBILE --- */}
      {sidebarOpen && windowWidth < 992 && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
          style={{ zIndex: 1030 }}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div 
        className="main-content d-flex flex-column min-vh-100"
        style={{ 
          marginLeft: sidebarOpen && windowWidth >= 992 ? "var(--sidebar-width)" : "0",
        }}
      >
        {/* --- HEADER --- */}
        <header className="glass-header position-sticky top-0 w-100 z-3 px-3 px-md-4 d-flex justify-content-between align-items-center" style={{ height: "var(--header-height)" }}>
          <div className="d-flex align-items-center">
            {/* Hamburger Menu */}
            {(!sidebarOpen || windowWidth < 992) && (
              <button className="btn btn-light border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px" }} onClick={toggleSidebar}>
                <i className="bi bi-list fs-5"></i>
              </button>
            )}
            
            {/* Breadcrumb / Portal Title */}
            <div className="d-none d-sm-flex align-items-center text-muted">
               <span className="fw-medium text-dark">Educator Workspace</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <NotificationBell />
            <div className="d-none d-md-flex align-items-center border-start ps-3 ms-2 h-100">
               <span className="text-secondary small fw-medium">Academic Year 2026</span>
            </div>
          </div>
        </header>

        {/* --- RENDERED PAGE CONTENT --- */}
        <main className="flex-grow-1 p-0">
          {children}
        </main>

        {/* --- FOOTER --- */}
        <footer className="text-center py-4 text-muted mt-auto" style={{ fontSize: "0.85rem" }}>
          <span className="fw-medium">© {new Date().getFullYear()} SchoolY Management System.</span>
          <span className="mx-2 opacity-25">|</span>
          <span>Designed with <i className="bi bi-heart-fill text-danger mx-1"></i> for Educators.</span>
        </footer>
      </div>

      {/* --- LOGOUT MODAL --- */}
      <Modal show={showLogoutModal} onHide={cancelLogout} centered backdrop="static">
        <div className="border-0 rounded-4 overflow-hidden">
          <Modal.Header className="border-0 pb-0 pt-4 px-4 justify-content-center position-relative">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex justify-content-center align-items-center mx-auto mb-2" style={{ width: "64px", height: "64px" }}>
              <i className="bi bi-box-arrow-right fs-2"></i>
            </div>
          </Modal.Header>
          <Modal.Body className="text-center pt-2 pb-4 px-4">
            <h4 className="fw-bold text-dark mb-2">Ready to Leave?</h4>
            <p className="text-muted mb-0">You are about to securely log out of your teacher portal. Any unsaved changes may be lost.</p>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 pb-4 px-4 d-flex justify-content-center gap-2">
            <Button variant="light" className="rounded-pill px-4 fw-semibold border shadow-sm flex-grow-1" onClick={cancelLogout}>
              Cancel
            </Button>
            <Button variant="danger" className="rounded-pill px-4 fw-semibold shadow-sm flex-grow-1" onClick={confirmLogout}>
              Yes, Logout
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

    </div>
  );
}