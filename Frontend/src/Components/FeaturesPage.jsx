import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";

function FeaturesPage() {
  return (
    <div className="bg-light min-vh-100">
      <HomeNavbar />
      <div className="container py-5 text-center">
        <h2 className="fw-bold mb-5">Powerful tools for every stakeholder</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="p-5 rounded-5 border bg-white">
              <div
                className="icon-box mb-4 mx-auto"
                style={{
                  width: "70px",
                  height: "70px",
                  background: "rgba(209,123,39,0.1)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bi bi-shield-check fs-2" style={{ color: "#d17b27" }}></i>
              </div>
              <h5 className="fw-bold">Safe & Secure</h5>
              <p className="text-muted small">Enterprise-grade encryption for all student and financial records.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-5 rounded-5 border bg-white">
              <div
                className="icon-box mb-4 mx-auto"
                style={{
                  width: "70px",
                  height: "70px",
                  background: "rgba(209,123,39,0.1)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bi bi-graph-up-arrow fs-2" style={{ color: "#d17b27" }}></i>
              </div>
              <h5 className="fw-bold">Analytics</h5>
              <p className="text-muted small">Track student, class, and operational performance in one dashboard.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-5 rounded-5 border bg-white">
              <div
                className="icon-box mb-4 mx-auto"
                style={{
                  width: "70px",
                  height: "70px",
                  background: "rgba(209,123,39,0.1)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bi bi-people fs-2" style={{ color: "#d17b27" }}></i>
              </div>
              <h5 className="fw-bold">Role Based Access</h5>
              <p className="text-muted small">Dedicated views for admin, teachers, students, and parents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
