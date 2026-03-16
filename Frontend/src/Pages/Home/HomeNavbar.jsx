import React from "react";
import { useNavigate } from "react-router-dom";

function HomeNavbar() {
  const navigate = useNavigate();

  return (
    <header 
      className="navbar navbar-expand-lg sticky-top px-3 px-lg-4 py-3"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        
        {/* Brand Logo */}
        <div 
          className="d-flex align-items-center gap-2" 
          onClick={() => navigate("/")}
          style={{ cursor: 'pointer' }}
        >
          <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: "38px", height: "38px" }}>
            <i className="bi bi-mortarboard-fill fs-5"></i>
          </div>
          <h3 className="fw-bolder mb-0 tracking-tight text-dark" style={{ letterSpacing: '-0.5px' }}>
            School<span className="text-primary">Y</span>
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-3 mt-2 mt-lg-0 align-items-center">
          <button 
            className="btn btn-link text-secondary fw-semibold text-decoration-none px-3" 
            onClick={() => navigate("/login")}
            style={{ transition: "color 0.2s" }}
            onMouseOver={(e) => e.target.style.color = "#2563eb"}
            onMouseOut={(e) => e.target.style.color = "#6c757d"}
          >
            Login
          </button>
          <button
            className="btn fw-bold text-white px-4 rounded-pill shadow-sm"
            style={{ 
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", 
              border: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 20px rgba(37,99,235,0.2)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
            }}
            onClick={() => navigate("/register")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}

export default HomeNavbar;