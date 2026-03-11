import React from "react";
import { useNavigate } from "react-router-dom";

function HomeNavbar() {
  const navigate = useNavigate();

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top px-3 px-lg-4 py-3">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        <h2 className="fw-bold text-uppercase mb-0">
          <span style={{ color: "#d17b27" }}>School</span>Y
        </h2>

        <div className="d-flex gap-2 mt-2 mt-lg-0">
          <button className="btn btn-outline-dark fw-semibold px-3" onClick={() => navigate("/login")}>
            Login
          </button>
          <button
            className="btn fw-semibold text-white px-3"
            style={{ backgroundColor: "#d17b27" }}
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
