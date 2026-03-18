import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Admin/navbar";
import Dashboard from "./Dashboard";

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    
      <Dashboard />
    
  );
}

export default AdminDashboard;