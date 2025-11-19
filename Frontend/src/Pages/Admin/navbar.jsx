import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function Navbar({ children }) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const userName = localStorage.getItem("userName") || "Admin";
  const userRole = localStorage.getItem("userRole") || "Administrator";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

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
      icon: "bi-easel",
      submenu: [
        { label: "All Subject", path: "/subject/allsubject" },
        { label: "Add New Subject", path: "/subject/newsubject" },
      ],
    },
    {
      label: "Students",
      icon: "bi-person-badge",
      submenu: [
        { label: "All Students", path: "/Students/allstudents" },
        
        { label: "Search Student", path: "/Students/search" },
      ],
    },
    {
      label: "Teacher",
      icon: "bi-person-badge-fill",
      submenu: [
        { label: "All Teachers", path: "/teacher/allteacher" },
        { label: "Add New", path: "/teacher/addteacher" },
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
        { label: "Fees Stucture", path: "/admin/fees" },
        { label: "Student Fees", path: "/studentfees" },
      ],
    },
    {
      label: "Salary",
      icon: "bi-wallet",
      submenu: [
        { label: "Teacher Salary", path: "/pay-salary" },
        { label: "Manage Salary", path: "/approve-salary" },
        { label: "Salary Lists", path: "/salarylist" },
      ],
    },
    // {
    //   label: "Reports",
    //   icon: "bi-bar-chart-line-fill",
    //   path: "/reports",
    // },
    {
      label: "Settings",
      icon: "bi-gear",
      submenu: [
        { label: "Logout", action: handleLogout },
      ],
    },
  ];

  const sidebarStyle = {
    minWidth: "270px",
    maxWidth: "270px",
    backgroundColor: "#ffffff", // changed to white
    overflowY: "auto",
    borderRight: "1px solid #ddd",
    padding: "1rem",
  };

  const sidebarItemStyle = {
    cursor: "pointer",
    transition: "0.3s",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const sidebarItemHover = {
    backgroundColor: "#f0f0f0",
  };

  const activeLinkStyle = {
    backgroundColor: "#0d6efd",
    color: "white",
    fontWeight: "600",
    borderRadius: "8px",
    display: "block",
    padding: "0.6rem 1rem",
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* HEADER */}
      <header
        className="d-flex justify-content-between align-items-center px-4 shadow-sm"
        style={{
          height: "65px",
          background: "linear-gradient(90deg, #0d6efd, #003b9f)",
          color: "white",
        }}
      >
        <h4 className="m-0 fw-bold" style={{ fontSize: "1.5rem" }}>
          <i className="bi bi-mortarboard-fill me-2"></i>SchoolY Admin
        </h4>
        <div className="dropdown">
          <button
            className="btn rounded-pill dropdown-toggle px-3 py-1"
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #0d6efd",
              color: "#0d6efd",
            }}
            data-bs-toggle="dropdown"
          >
            {userName} ({userRole})
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow">
            <li>
              <NavLink className="dropdown-item" to="/profile">
                <i className="bi bi-person me-2"></i>Profile
              </NavLink>
            </li>
            <li>
              <NavLink className="dropdown-item" to="/Settings/account">
                <i className="bi bi-gear me-2"></i>Settings
              </NavLink>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </li>
          </ul>
        </div>
      </header>

      {/* BODY */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside style={sidebarStyle}>
          <ul className="nav flex-column">
            {menuItems.map((item, idx) => (
              <li key={idx} className="nav-item mb-1">
                {item.submenu ? (
                  <>
                    <div
                      onClick={() => toggleMenu(item.label)}
                      style={{
                        ...sidebarItemStyle,
                        ...(openMenu === item.label ? sidebarItemHover : {}),
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <i className={`bi ${item.icon} me-2`} style={{ color: "#333" }}></i>
                        <span className="fw-semibold" style={{ color: "#333" }}>{item.label}</span>
                      </div>
                      <i
                        className={`bi ${
                          openMenu === item.label ? "bi-chevron-up" : "bi-chevron-down"
                        }`}
                        style={{ color: "#333" }}
                      ></i>
                    </div>
                    {openMenu === item.label && (
                      <ul className="nav flex-column ms-3 mt-1">
                        {item.submenu.map((sub, i) => (
                          <li key={i} className="nav-item">
                            {sub.action ? (
                              <button
                                onClick={sub.action}
                                className="btn btn-link nav-link text-secondary py-1 px-2 text-start w-100"
                              >
                                {sub.label}
                              </button>
                            ) : (
                              <NavLink
                                to={sub.path}
                                style={({ isActive }) =>
                                  isActive
                                    ? activeLinkStyle
                                    : { color: "#555", padding: "0.6rem 1rem", display: "block" }
                                }
                              >
                                {sub.label}
                              </NavLink>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    style={({ isActive }) =>
                      isActive
                        ? activeLinkStyle
                        : { color: "#555", padding: "0.6rem 1rem", display: "block" }
                    }
                  >
                    <i className={`bi ${item.icon} me-2`} style={{ color: "#333" }}></i>
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-grow-1 bg-light p-4 overflow-auto">{children}</main>
      </div>

      {/* FOOTER */}
      <footer
        className="text-center py-2 small"
        style={{ background: "#f8f9fa", color: "#555", borderTop: "1px solid #ddd" }}
      >
        © 2025 <strong>SchoolY</strong> — Smart Education Management System
      </footer>
    </div>
  );
}

export default Navbar;
