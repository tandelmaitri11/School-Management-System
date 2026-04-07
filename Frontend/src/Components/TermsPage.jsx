import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";

function TermsPage() {
  const sections = [
    { id: "acceptance", icon: "bi-check-all", title: "1. Acceptance of Terms", content: "By using SchoolY, you agree to these terms. If you do not agree, do not use the platform. Your access is contingent upon your compliance with these rules." },
    { id: "responsibilities", icon: "bi-person-badge", title: "2. User Responsibilities", content: "Users must provide accurate information, keep credentials secure, and use the platform only for lawful educational and administrative purposes. Misuse of accounts is strictly prohibited." },
    { id: "data", icon: "bi-cloud-check", title: "3. Data and Content", content: "Schools remain responsible for the data they upload and must ensure proper authorization for student and staff records. We act as a processor under your direction." },
    { id: "availability", icon: "bi-activity", title: "4. Service Availability", content: "We aim for reliable service but do not guarantee uninterrupted access. Maintenance and outages may occur. We provide notice for scheduled downtime whenever possible." },
    { id: "liability", icon: "bi-exclamation-octagon", title: "5. Limitation of Liability", content: "To the maximum extent permitted by law, SchoolY is not liable for indirect or consequential damages arising from use of the platform or data loss." },
    { id: "changes", icon: "bi-arrow-repeat", title: "6. Changes to Terms", content: "We may update these terms periodically. Continued use after updates means you accept the revised terms. Please check this page regularly for changes." },
    { id: "contact", icon: "bi-incognito", title: "7. Legal Contact", content: "For formal legal inquiries or service of process, please contact our legal department at legal@schooly.com." },
  ];

  return (
    <div 
      className="min-vh-100"
      style={{
        backgroundColor: "#fcfdfe",
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b"
      }}
    >
      <div className="d-print-none">
        <HomeNavbar />
      </div>

      {/* Modern Indigo Hero */}
      <div className="py-5 d-print-none" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", color: "white" }}>
        <div className="container pt-5 pb-4">
          <div className="row">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 text-info border border-info border-opacity-25 mb-4 small fw-bold">
                <i className="bi bi-file-earmark-ruled"></i> LEGAL AGREEMENT
              </div>
              <h1 className="display-3 fw-bold mb-3 tracking-tight">Terms of <span className="text-info">Service</span></h1>
              <p className="lead opacity-75">Please read these terms carefully before using the SchoolY ecosystem.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-5">
          
          {/* Left Sidebar Navigation - Hidden on Print */}
          <div className="col-lg-4 d-none d-lg-block d-print-none">
            <div className="sticky-top" style={{ top: "110px", zIndex: 10 }}>
              <div className="p-4 rounded-4 bg-white border border-light shadow-sm">
                <h6 className="fw-bold text-muted small text-uppercase mb-4 px-2" style={{ letterSpacing: '1px' }}>Navigation</h6>
                <div className="list-group list-group-flush gap-1">
                  {sections.map((s) => (
                    <a 
                      key={s.id} 
                      href={`#${s.id}`} 
                      className="list-group-item list-group-item-action border-0 rounded-3 py-2 px-3 d-flex align-items-center gap-2 transition-all nav-hover"
                    >
                      <i className={`bi ${s.icon} text-primary`}></i>
                      <span className="small fw-medium">{s.title.split(". ")[1]}</span>
                    </a>
                  ))}
                </div>
                
              </div>
            </div>
          </div>

          {/* Main Terms Content */}
          <div className="col-lg-8 col-print-12">
            <div className="bg-white rounded-5 p-4 p-md-5 border border-light shadow-sm print-card">
              
              {/* Document Header for Print */}
              <div className="d-none d-print-block mb-4 border-bottom pb-3">
                <h2 className="fw-bold">SchoolY: Terms of Service</h2>
                <p className="text-muted small">Official Document Ref: SY-2026-TOS</p>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom d-print-none">
                <span className="text-muted small fw-bold"><i className="bi bi-clock me-1"></i> Updated Feb 2026</span>
                <button className="btn btn-light btn-sm rounded-pill px-3" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>Print / Save PDF
                </button>
              </div>

              {sections.map((section) => (
                <section key={section.id} id={section.id} className="mb-5 scroll-mt print-section">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary d-print-none">
                       <i className={`bi ${section.icon} fs-4`}></i>
                    </div>
                    <h4 className="fw-bold mb-0">{section.title}</h4>
                  </div>
                  <div className="ps-md-5 ps-print-0">
                    <p className="text-secondary fs-5 mb-0 print-text" style={{ lineHeight: "1.8" }}>
                      {section.content}
                    </p>
                  </div>
                  <hr className="mt-5 opacity-5 d-print-none" />
                </section>
              ))}

              {/* Acceptance Confirmation */}
              <div className="mt-5 p-4 rounded-4 bg-light border border-dashed border-primary text-center">
                 <p className="mb-0 text-muted italic">
                   By using our platform, you acknowledge that you have read and understood these Terms of Service.
                 </p>
              </div>

              {/* Signature Section - Only visible on Print */}
              <div className="d-none d-print-block mt-5 pt-5">
                <div className="row mt-5">
                  <div className="col-6">
                    <div className="border-bottom mb-2" style={{height: '40px', width: '200px', borderBottom: '1px solid black !important'}}></div>
                    <p className="small fw-bold">User Signature</p>
                  </div>
                  <div className="col-6 text-end">
                    <p className="small text-muted mb-0">Authorized SchoolY Representative</p>
                    <p className="small text-muted">https://schooly.com/legal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-print-none">
        <Footer />
      </div>

      <style>{`
        .scroll-mt { scroll-margin-top: 130px; }
        .nav-hover:hover { 
          background-color: #f1f5f9 !important; 
          color: #2563eb !important;
          transform: translateX(5px);
        }
        .transition-all { transition: all 0.3s ease; }
        .tracking-tight { letter-spacing: -2px; }

        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            background: white !important;
            font-size: 12pt;
          }
          .container {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
          }
          .col-print-12 {
            width: 100% !important;
            flex: 0 0 100% !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .print-text {
            color: #000 !important;
            font-size: 11pt !important;
            text-align: justify;
          }
          .ps-print-0 {
            padding-left: 0 !important;
          }
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TermsPage;