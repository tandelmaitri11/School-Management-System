import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Admin/navbar"; 

function AdminDashboard() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    if (!userRole || userRole !== "Admin") {
      navigate("/login");
    }
  }, [userRole, navigate]);

  return (
    <div>
      <Navbar />
</div>
  );
}

export default AdminDashboard;