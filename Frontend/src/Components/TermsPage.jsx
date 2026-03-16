import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";

function TermsPage() {
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
          background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', 
          top: '-20%', right: '-10%', filter: 'blur(60px)', zIndex: 0 
        }}
      ></div>

      <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
        
        {/* Header */}
        <div className="text-center mb-5 mt-3">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase tracking-wider mb-3 border border-primary border-opacity-25 shadow-sm" style={{ letterSpacing: '0.05em' }}>
             <i className="bi bi-file-earmark-text fs-6"></i> Legal
          </div>
          <h1 className="display-4 fw-bolder text-dark mb-3" style={{ letterSpacing: '-1px' }}>Terms and Conditions</h1>
          <p className="text-muted fs-5">Last updated: February 21, 2026</p>
        </div>

        {/* Content Card */}
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
              <div className="card-body p-4 p-md-5 bg-white">
                
                <h5 className="fw-bold text-dark mt-2 mb-3">1. Acceptance of Terms</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  By using SchoolY, you agree to these terms. If you do not agree, do not use the platform.
                </p>

                <h5 className="fw-bold text-dark mb-3">2. User Responsibilities</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  Users must provide accurate information, keep credentials secure, and use the platform only for lawful
                  educational and administrative purposes.
                </p>

                <h5 className="fw-bold text-dark mb-3">3. Data and Content</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  Schools remain responsible for the data they upload and must ensure proper authorization for student and
                  staff records.
                </p>

                <h5 className="fw-bold text-dark mb-3">4. Service Availability</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  We aim for reliable service but do not guarantee uninterrupted access. Maintenance and outages may occur.
                </p>

                <h5 className="fw-bold text-dark mb-3">5. Limitation of Liability</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  To the maximum extent permitted by law, SchoolY is not liable for indirect or consequential damages
                  arising from use of the platform.
                </p>

                <h5 className="fw-bold text-dark mb-3">6. Changes to Terms</h5>
                <p className="text-muted mb-5" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  We may update these terms periodically. Continued use after updates means you accept the revised terms.
                </p>

                <h5 className="fw-bold text-dark mb-3">7. Contact</h5>
                <p className="text-muted mb-2" style={{ lineHeight: 1.7, fontSize: '1.05rem' }}>
                  For legal questions, contact <strong className="text-dark">legal@schooly.com</strong>.
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

export default TermsPage;