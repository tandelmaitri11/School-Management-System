import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherNavbar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem("userName") || "Teacher";
  const userRole = localStorage.getItem("userRole") || "Teacher";

  const [openMenu, setOpenMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ✅ Updated menu with Reports & Teacher sections
  const menuItems = [
    { label: "Dashboard", icon: "bi-speedometer2", path: "/teacher/dashboard" },

    {
      label: "My Classes",
      icon: "bi-easel2",
      submenu: [{ label: "All Classes", path: "/teacher/classes" }],
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
      label: "Students",
      icon: "bi-people",
      submenu: [
        { label: "View & Manage", path: "/teacher/viewmangestudents" },
        { label: "Attendance", path: "/teacher/student/attendance" },
        { label: "Attendance History", path: "/teacher/attendance-history" },
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
        { label: "Performance Report", path: "/teacher/reports/performance" },,
      ],
    },

    { label: "Profile", icon: "bi-person-circle", path: "/teacher/profile" },
  ];

  const sidebarBaseStyle = {
    width: "260px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e0e0e0",
    transition: "transform 0.3s ease-in-out",
    zIndex: 1050,
  };

  const sidebarHiddenStyle = {
    transform: "translateX(-100%)",
    position: "fixed",
    top: "65px",
    left: 0,
    height: "calc(100% - 65px)",
  };

  const sidebarVisibleStyle = {
    transform: "translateX(0)",
    position: "fixed",
    top: "65px",
    left: 0,
    height: "calc(100% - 65px)",
  };

  const headerStyle = {
    height: "65px",
    backgroundColor: "#0d6efd",
    color: "#fff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  };

  const activeLinkStyle =
    "fw-semibold border-start border-3 border-primary ps-3 text-primary";

  return (
    <div className="d-flex flex-column vh-100">
      {/* HEADER */}
      <header
        className="d-flex justify-content-between align-items-center px-4"
        style={headerStyle}
      >
        <div className="d-flex align-items-center">
          <button
            className="btn btn-light me-3 d-md-none"
            onClick={toggleSidebar}
          >
            <i className="bi bi-list"></i>
          </button>
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-mortarboard-fill me-2"></i>Teacher Dashboard
          </h5>
        </div>

        <div className="text-white fw-semibold">Welcome, {userName}</div>
      </header>

      {/* BODY */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className="p-3 shadow-sm d-flex flex-column justify-content-between"
          style={{
            ...sidebarBaseStyle,
            ...(sidebarOpen ? sidebarVisibleStyle : sidebarHiddenStyle),
          }}
        >
          <div>
            <ul className="nav flex-column mt-2">
              {menuItems.map((item, idx) => (
                <li key={idx} className="nav-item mb-2">
                  {item.submenu ? (
                    <>
                      <div
                        className={`d-flex justify-content-between align-items-center px-3 py-2 rounded ${
                          item.submenu.some(
                            (sub) => sub.path === location.pathname
                          )
                            ? "bg-light fw-semibold"
                            : ""
                        }`}
                        style={{
                          cursor: "pointer",
                          color: "#444",
                          transition: "all 0.3s",
                        }}
                        onClick={() => toggleMenu(item.label)}
                      >
                        <div className="d-flex align-items-center">
                          <i
                            className={`bi ${item.icon} me-2 text-secondary`}
                          ></i>
                          <span>{item.label}</span>
                        </div>
                        <i
                          className={`bi bi-chevron-${
                            openMenu === item.label ? "up" : "down"
                          } text-muted`}
                          style={{ fontSize: "0.9rem", transition: "0.3s" }}
                        ></i>
                      </div>

                      {openMenu === item.label && (
                        <ul className="nav flex-column mt-1 ms-4 border-start ps-2">
                          {item.submenu.map((sub, i) => (
                            <li key={i} className="nav-item mb-1">
                              <NavLink
                                className={({ isActive }) =>
                                  `nav-link py-1 px-2 ${
                                    isActive
                                      ? activeLinkStyle
                                      : "text-muted ps-2"
                                  }`
                                }
                                to={sub.path}
                                style={{ transition: "color 0.3s" }}
                              >
                                <i className="bi bi-dot me-1"></i>
                                {sub.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <NavLink
                      className={({ isActive }) =>
                        `nav-link d-flex align-items-center px-3 py-2 ${
                          isActive ? activeLinkStyle : "text-muted"
                        }`
                      }
                      to={item.path}
                      style={{ transition: "color 0.3s" }}
                    >
                      <i className={`bi ${item.icon} me-2 text-secondary`}></i>
                      {item.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* BOTTOM SECTION */}
          <div
            className="mt-auto pt-3 border-top text-center"
            style={{ fontSize: "0.9rem" }}
          >
            <div
              className="d-flex justify-content-center align-items-center gap-2 mb-2"
              style={{
                background: "#f8f9fa",
                borderRadius: "8px",
                padding: "8px",
              }}
            >
              <i
                className="bi bi-person-circle text-primary"
                style={{ fontSize: "1.4rem" }}
              ></i>
              <span className="fw-semibold">{userName}</span>
            </div>
            <small className="text-muted d-block mb-2">{userRole}</small>
            <button
              className="btn btn-outline-danger w-100"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main
          className="flex-grow-1 bg-white overflow-auto p-4"
          style={{
            marginLeft: sidebarOpen ? "260px" : "0",
            transition: "margin 0.3s ease",
          }}
        >
          {children}
        </main>
      </div>

      {/* FOOTER */}
      <footer
        className="text-center py-2 border-top bg-light small text-muted"
        style={{ fontSize: "0.9rem" }}
      >
        © 2025 School Management System | Designed for Teachers
      </footer>
    </div>
  );
}
