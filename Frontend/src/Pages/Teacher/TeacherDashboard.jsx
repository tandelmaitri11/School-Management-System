// TeacherDashboard.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeacherNavbar from "./teacher_navbar"; 

function TeacherDashboard() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  
  useEffect(() => {
    if (!userRole || userRole !== "Teacher") {
      navigate("/login");
    }
  }, [userRole, navigate]);

  return (
    <div>
      {/* Only render the TeacherNavbar */}
      
    </div>
  );
}

export default TeacherDashboard;
