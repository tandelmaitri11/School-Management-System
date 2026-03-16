import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";

function FeaturesPage() {
  return (
    <div 
      className="min-vh-100 position-relative overflow-hidden"
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-10px);
          box-shadow: 0 1.5rem 3rem rgba(0,0,0,0.08) !important;
        }
        .tracking-wider {
          letter-spacing: 0.05em;
        }
      `}</style>

      <HomeNavbar />

      {/* Decorative background glow element */}
      <div 
        className="position-absolute rounded-circle opacity-25 d-none d-md-block" 
        style={{ 
          width: '600px', height: '600px', 
          background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', 
          top: '-15%', right: '-10%', filter: 'blur(60px)', zIndex: 0 
        }}
      ></div>

      <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
        
        {/* Header Section */}
        <div className="text-center mb-5 mt-4">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase tracking-wider mb-3 border border-primary border-opacity-25 shadow-sm">
            <i className="bi bi-stars fs-6"></i> Core Features
          </div>
          <h2 className="display-5 fw-bolder text-dark mb-3" style={{ letterSpacing: '-1px' }}>
            Powerful tools for every stakeholder
          </h2>
          <p className="text-muted fs-5 mx-auto" style={{ maxWidth: '600px' }}>
            Everything you need to manage your institution efficiently, securely, and seamlessly.
          </p>
        </div>

        {/* Features Grid */}
        <div className="row g-4 px-lg-4">
          
          {/* Feature 1 */}
          <div className="col-md-4">
            <div className="h-100 p-5 rounded-5 bg-white border-0 shadow-sm hover-lift d-flex flex-column align-items-center text-center">
              <div
                className="icon-box mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(79,70,229,0.1) 100%)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgba(37,99,235,0.2)"
                }}
              >
                <i className="bi bi-shield-check fs-1 text-primary"></i>
              </div>
              <h4 className="fw-bold mb-3 text-dark">Safe & Secure</h4>
              <p className="text-muted mb-0" style={{ lineHeight: 1.6 }}>
                Enterprise-grade encryption for all student and financial records.
              </p>
            </div>
          </div>

          {/* Feature 2 (Staggered down slightly for modern look) */}
          <div className="col-md-4">
            <div className="h-100 p-5 rounded-5 bg-white border-0 shadow-sm hover-lift d-flex flex-column align-items-center text-center mt-md-4">
              <div
                className="icon-box mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.1) 100%)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.2)"
                }}
              >
                <i className="bi bi-graph-up-arrow fs-1 text-success"></i>
              </div>
              <h4 className="fw-bold mb-3 text-dark">Analytics</h4>
              <p className="text-muted mb-0" style={{ lineHeight: 1.6 }}>
                Track student, class, and operational performance in one dashboard.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="col-md-4">
            <div className="h-100 p-5 rounded-5 bg-white border-0 shadow-sm hover-lift d-flex flex-column align-items-center text-center">
              <div
                className="icon-box mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.1) 100%)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgba(245,158,11,0.2)"
                }}
              >
                <i className="bi bi-people fs-1" style={{ color: "#f59e0b" }}></i>
              </div>
              <h4 className="fw-bold mb-3 text-dark">Role Based Access</h4>
              <p className="text-muted mb-0" style={{ lineHeight: 1.6 }}>
                Dedicated views for admin, teachers, students, and parents.
              </p>
            </div>
          </div>

        </div>
      </div>
      <Footer/>
    </div>
  );
}

export default FeaturesPage;