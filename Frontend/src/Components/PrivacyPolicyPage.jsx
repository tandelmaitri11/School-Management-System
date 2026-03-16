import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";

function PrivacyPolicyPage() {
  return (
    <div 
      className="min-vh-100 position-relative overflow-hidden"
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <HomeNavbar />

      {/* Decorative background glow */}
      <div 
        className="position-absolute rounded-circle opacity-25 d-none d-md-block" 
        style={{ 
          width: '600px', height: '600px', 
          background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', 
          top: '-20%', left: '-10%', filter: 'blur(60px)', zIndex: 0 
        }}
      ></div>

      <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
        
        {/* Header */}
        <div className="text-center mb-5 mt-3">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase tracking-wider mb-3 border border-primary border-opacity-25 shadow-sm" style={{ letterSpacing: '0.05em' }}>
             <i className="bi bi-shield-lock fs-6"></i> Legal
          </div>
          <h1 className="display-4 fw-bolder text-dark mb-3" style={{ letterSpacing: '-1px' }}>Privacy Policy</h1>
          <p className="text-muted fs-5">Last updated: February 21, 2026</p>
        </div>

        {/* Content Card */}
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
              <div className="card-body p-4 p-md-5 bg-white">
                
                <h5 className="fw-bold text-dark mt-2 mb-3">1. Information We Collect</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  We collect account details, academic records, attendance data, fee records, and system usage logs
                  needed to provide school management services.
                </p>

                <h5 className="fw-bold text-dark mb-3">2. How We Use Information</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  Data is used to manage classes, users, attendance, exams, timetable, communication, and billing
                  workflows. We do not sell personal data.
                </p>

                <h5 className="fw-bold text-dark mb-3">3. Data Sharing</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  We may share data with authorized school staff and trusted service providers strictly for platform
                  operations, security, and compliance.
                </p>

                <h5 className="fw-bold text-dark mb-3">4. Data Security</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  We apply technical and organizational safeguards to protect data from unauthorized access, loss, or
                  misuse.
                </p>

                <h5 className="fw-bold text-dark mb-3">5. Data Retention</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  Data is retained for operational and legal requirements, then securely deleted or anonymized when no
                  longer required.
                </p>

                <h5 className="fw-bold text-dark mb-3">6. Contact</h5>
                <p className="text-muted mb-2" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  For privacy questions, contact us at <strong className="text-dark">privacy@schooly.com</strong>.
                </p>

              </div>
            </div>
          </div>
        </div>

      </div>
      <Footer/>
    </div>
  );
}

export default PrivacyPolicyPage;