import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Badge } from "react-bootstrap";
import api from "../../api/api";

export default function StudentNavbar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = localStorage.getItem("userName") || "Student";
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchNewAssignments = async () => {
    try {
      const studentClass = localStorage.getItem("studentClass");
      if (!studentClass) return;

      const res = await api.get(`/api/assignments/classes`, {
        params: { classes: studentClass },
      });

      const assignments = res.data || [];
      const lastSeen = localStorage.getItem("lastAssignmentViewTime");

      const newCount = lastSeen
        ? assignments.filter((a) => new Date(a.createdAt) > new Date(lastSeen)).length
        : assignments.length;

      setNewAssignmentsCount(newCount);
    } catch (err) {
      console.error("Error fetching new assignments:", err);
    }
  };

  useEffect(() => {
    fetchNewAssignments();
    const interval = setInterval(fetchNewAssignments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/student/assignments")) {
      localStorage.setItem("lastAssignmentViewTime", new Date().toISOString());
      setNewAssignmentsCount(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const colors = {
    sidebarBg: "#eaf2fb",
    sidebarText: "#2e3a59",
    sidebarActive: "#dbe7fb",
    mainBg: "#f8fbff",
    accent: "#3b6ea5",
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: colors.mainBg }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          backgroundColor: colors.sidebarBg,
          color: colors.sidebarText,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 0",
          borderRight: "1px solid #d4e1f4",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              color: colors.accent,
            }}
          >
            <i className="bi bi-mortarboard-fill me-2"></i>SchoolY
          </div>

          {/* Nav Links */}
          <nav style={{ width: "100%" }}>
            {[
              { to: "/student/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
              {
                to: "/student/assignments",
                label: "Assignments",
                icon: "bi-journal-text",
                submenu: [
                  { label: "View All Assignments", to: "/student/assignments" },
                  { label: "Submit Assignment", to: "/student/submitassignments" },
                ],
              },
              {
                to: "/student/attendance/view",
                label: "Attendance",
                icon: "bi-calendar-check",
              },
              { to: "/student/report", label: "Report", icon: "bi-bar-chart" },
              { to: "/student/fees", label: "Fees", icon: "bi-cash" },
              { to: "/studentprofile", label: "Profile", icon: "bi-person-circle" },
            ].map((item) => (
              <div key={item.to}>
                <div
                  onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}
                  style={{ cursor: "pointer" }}
                >
                  <NavLink
                    to={item.to}
                    end
                    className="d-flex align-items-center text-decoration-none px-4 py-2"
                    style={({ isActive }) => ({
                      color: isActive ? "#2e6bd1" : "#4b587a",
                      backgroundColor: isActive ? colors.sidebarActive : "transparent",
                      fontWeight: isActive ? "600" : "500",
                      borderLeft: isActive ? "4px solid #2e6bd1" : "4px solid transparent",
                    })}
                  >
                    <i className={`bi ${item.icon} me-3`}></i>
                    {item.label}

                    {item.label === "Assignments" && newAssignmentsCount > 0 && (
                      <Badge bg="primary" pill className="ms-auto">
                        {newAssignmentsCount}
                      </Badge>
                    )}
                  </NavLink>
                </div>

                {activeMenu === item.label && item.submenu && (
                  <div style={{ marginLeft: "45px", marginTop: "5px" }}>
                    {item.submenu.map((sub, index) => (
                      <NavLink
                        key={index}
                        to={sub.to}
                        className="d-block text-decoration-none px-3 py-2"
                      >
                        <i className="bi bi-caret-right-fill me-2"></i>
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Profile */}
        <div style={{ textAlign: "center" }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="avatar"
            width="60"
            className="rounded-circle mb-2"
          />
          <div style={{ fontWeight: "600" }}>{userName}</div>
          <div style={{ fontSize: "0.85rem", color: "#6c7da0" }}>Student</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flexGrow: 1 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
          <button onClick={handleLogout} className="btn btn-primary">
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
        <main style={{ padding: "1.5rem 2rem" }}>{children}</main>
      </div>
    </div>
  );
}
