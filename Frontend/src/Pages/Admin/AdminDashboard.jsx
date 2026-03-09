// ✅ AdminDashboard.jsx (same logic, fixed to render pages inside Navbar layout)
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Admin/navbar";
import Dashboard from "./Dashboard";

function AdminDashboard() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (!userRole || userRole !== "Admin") navigate("/login");
  }, [userRole, navigate]);

  return (
    <Navbar>
      <Dashboard />
    </Navbar>
  );
}

export default AdminDashboard;
