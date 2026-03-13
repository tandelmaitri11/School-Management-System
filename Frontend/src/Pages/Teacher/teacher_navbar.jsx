import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button } from "react-bootstrap";
import { useDashboardSettings } from "../../context/dashboardSettingsContext";
import NotificationBell from "../../Components/NotificationBell";
import useNotifications from "../../hooks/useNotifications";

const customStyles = `
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
  .sidebar-link {
    transition: all 0.2s ease-in-out;
    border-radius: 0 8px 8px 0;
    margin-right: 8px;
  }
  .sidebar-link:hover {
    background-color: rgba(13, 110, 253, 0.05);
    color: #0d6efd !important;
    transform: translateX(4px);
  }
  .sidebar-link:hover i {
    color: #0d6efd !important;
  }
  .submenu-link {
    transition: all 0.2s ease;
    border-radius: 6px;
  }
  .submenu-link:hover {
    background-color: rgba(13, 110, 253, 0.08);
    color: #0d6efd !important;
  }
`;

export default function TeacherNavbar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useDashboardSettings();
  const isDark = settings.theme === "dark";
  const userName = localStorage.getItem("userName") || "Teacher";
  const userRole = localStorage.getItem("userRole") || "Teacher";

  const [openMenu, setOpenMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { notifications } = useNotifications(100);
  const announcementCount = (notifications || []).filter(
    (n) => n?.type === "ANNOUNCEMENT" && !n?.isRead
  ).length;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleLinkClick = () => {
    if (windowWidth < 768) setSidebarOpen(false);
  };

  const menuItems = [
    { label: "Dashboard", icon: "bi-speedometer2", path: "/teacher/dashboard" },
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
      icon: "bi-chat-dots",
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
      label: "Learning",
      icon: "bi-collection-play",
      submenu: [{ label: "LMS Content", path: "/teacher/lms" }],
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

  const sidebarStyle = {
    width: "280px",
    backgroundColor: "var(--dash-card-bg)",
    borderRight: "1px solid rgba(0,0,0,0.05)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1055,
    position: "fixed",
    top: "70px",
    left: 0,
    height: "calc(100% - 70px)",
    transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
    overflow: "hidden",
    boxShadow:
      sidebarOpen && windowWidth < 768 ? "4px 0 15px rgba(0,0,0,0.1)" : "none",
  };

  const headerStyle = {
    height: "70px",
    backgroundColor: isDark ? "#17181a" : "#0d6efd",
    color: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 1060,
  };

  const activeLinkStyle =
    "fw-bold bg-primary bg-opacity-10 text-primary border-start border-4 border-primary";

  return (
    <div
      className="d-flex flex-column vh-100 dashboard-shell bg-light"
      style={{ fontSize: "var(--dash-font-size)", paddingTop: "70px" }}
    >
      <style>{customStyles}</style>

      {/* HEADER */}
      <header
        className="d-flex justify-content-between align-items-center px-3 px-md-4"
        style={headerStyle}
      >
        <div className="d-flex align-items-center">
          {windowWidth < 768 && (
            <button
              className="btn btn-outline-light border-0 me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
              onClick={toggleSidebar}
            >
              <i className="bi bi-list fs-4"></i>
            </button>
          )}

          <div className="d-flex align-items-center bg-white bg-opacity-10 px-3 py-2 rounded-pill">
            <i className="bi bi-mortarboard-fill fs-5 me-2 text-white"></i>
            <h5 className="mb-0 fw-bold tracking-wide">Teacher Portal</h5>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 gap-md-4">
          <NotificationBell />
          <div className="d-none d-sm-flex align-items-center gap-2 bg-white bg-opacity-10 py-1 px-3 rounded-pill border border-light border-opacity-25">
            <div className="text-white text-end">
              <div className="fw-bold" style={{ fontSize: "0.9rem" }}>
                {userName}
              </div>
            </div>
            <i className="bi bi-person-circle fs-4 text-white"></i>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="d-flex flex-column bg-white" style={sidebarStyle}>
          <div
            className="sidebar-scroll py-3"
            style={{ overflowY: "auto", flex: 1 }}
          >
            <ul className="nav flex-column gap-1">
              <li
                className="nav-item px-3 mb-2 text-uppercase text-muted fw-bold"
                style={{ fontSize: "0.75rem", letterSpacing: "1px" }}
              >
                Main Menu
              </li>

              {menuItems.map((item, idx) => {
                const isActiveGroup =
                  item.submenu &&
                  item.submenu.some((sub) => sub.path === location.pathname);

                const isOpen = openMenu === item.label || isActiveGroup;

                return (
                  <li key={idx} className="nav-item w-100">
                    {item.submenu ? (
                      <>
                        <div
                          className={`sidebar-link d-flex justify-content-between align-items-center px-4 py-2 text-secondary ${
                            isActiveGroup
                              ? "bg-primary bg-opacity-10 text-primary fw-bold border-start border-4 border-primary"
                              : ""
                          }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleMenu(item.label)}
                        >
                          <div className="d-flex align-items-center">
                            <i
                              className={`bi ${item.icon} fs-5 me-3 ${
                                isActiveGroup ? "text-primary" : "text-muted"
                              }`}
                            ></i>
                            <span style={{ fontSize: "0.95rem" }}>
                              {item.label}
                            </span>

                            {item.label === "Announcements" &&
                              announcementCount > 0 && (
                                <span className="badge bg-danger rounded-pill ms-2 shadow-sm">
                                  {announcementCount}
                                </span>
                              )}
                          </div>

                          <i
                            className={`bi bi-chevron-${
                              isOpen ? "up" : "down"
                            } ${isActiveGroup ? "text-primary" : "text-muted"}`}
                            style={{
                              fontSize: "0.8rem",
                              transition: "transform 0.3s",
                            }}
                          ></i>
                        </div>

                        {isOpen && (
                          <ul className="nav flex-column mt-1 mb-2 px-3">
                            <div className="border-start border-2 border-secondary border-opacity-25 ms-3 ps-2">
                              {item.submenu.map((sub, i) => (
                                <li key={i} className="nav-item mb-1">
                                  <NavLink
                                    className={({ isActive }) =>
                                      `nav-link submenu-link py-2 px-3 d-flex align-items-center ${
                                        isActive
                                          ? "fw-bold text-primary bg-primary bg-opacity-10"
                                          : "text-secondary"
                                      }`
                                    }
                                    style={{ fontSize: "0.9rem" }}
                                    to={sub.path}
                                    onClick={handleLinkClick}
                                  >
                                    <i className="bi bi-dash me-2 opacity-50"></i>
                                    {sub.label}
                                  </NavLink>
                                </li>
                              ))}
                            </div>
                          </ul>
                        )}
                      </>
                    ) : (
                      <NavLink
                        className={({ isActive }) =>
                          `sidebar-link nav-link d-flex align-items-center px-4 py-2 ${
                            isActive ? activeLinkStyle : "text-secondary"
                          }`
                        }
                        to={item.path}
                        onClick={handleLinkClick}
                      >
                        <i
                          className={`bi ${item.icon} fs-5 me-3 ${
                            location.pathname === item.path
                              ? "text-primary"
                              : "text-muted"
                          }`}
                        ></i>
                        <span style={{ fontSize: "0.95rem" }}>
                          {item.label}
                        </span>
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* BOTTOM SECTION */}
          <div className="p-3 border-top bg-white">
            <div className="bg-light rounded-4 p-3 mb-3 border border-secondary border-opacity-10 d-flex align-items-center gap-3">
              <div
                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary"
                style={{ width: "45px", height: "45px" }}
              >
                <i className="bi bi-person-fill fs-4"></i>
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-dark text-truncate">{userName}</div>
                <div className="text-muted small text-truncate">{userRole}</div>
              </div>
            </div>

            <button
              className="btn btn-outline-danger w-100 rounded-pill fw-semibold d-flex justify-content-center align-items-center transition"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2 fs-5"></i>
              Secure Logout
            </button>
          </div>
        </aside>

        {/* OVERLAY ON MOBILE */}
        {sidebarOpen && windowWidth < 768 && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1050, backdropFilter: "blur(2px)" }}
            onClick={toggleSidebar}
          ></div>
        )}

        {/* MAIN CONTENT */}
        <main
          className="flex-grow-1 overflow-auto p-3 p-md-4"
          style={{
            marginLeft: sidebarOpen && windowWidth >= 768 ? "280px" : "0",
            transition: "margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "var(--dash-bg, #f8f9fc)",
            color: "var(--dash-text)",
            minHeight: "calc(100vh - 70px)",
          }}
        >
          <div className="container-fluid p-0 pb-4">{children}</div>
        </main>
      </div>

      {/* FOOTER */}
      <footer
        className="text-center py-3 border-top small position-relative"
        style={{
          fontSize: "0.85rem",
          background: "var(--dash-card-bg, #fff)",
          color: "var(--dash-muted)",
          marginLeft: sidebarOpen && windowWidth >= 768 ? "280px" : "0",
          transition: "margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1040,
        }}
      >
        <span className="fw-medium">
          © {new Date().getFullYear()} School Management System
        </span>
        <span className="mx-2 text-muted opacity-50">|</span>
        <span>Designed for Teachers</span>
      </footer>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal show={showLogoutModal} onHide={cancelLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
            Confirm Logout
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to logout from your account?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelLogout}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmLogout}>
            Yes, Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
