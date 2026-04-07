import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";
import { Link } from "react-router-dom";
function PrivacyPolicyPage() {
  const sections = [
    { id: "collect", icon: "bi-database-fill-add", title: "1. Information We Collect", content: "We collect account details, academic records, attendance data, fee records, and system usage logs needed to provide school management services." },
    { id: "usage", icon: "bi-gear-wide-connected", title: "2. How We Use Information", content: "Data is used to manage classes, users, attendance, exams, timetable, communication, and billing workflows. We do not sell personal data." },
    { id: "sharing", icon: "bi-share-fill", title: "3. Data Sharing", content: "We may share data with authorized school staff and trusted service providers strictly for platform operations, security, and compliance." },
    { id: "security", icon: "bi-shield-check", title: "4. Data Security", content: "We apply technical and organizational safeguards to protect data from unauthorized access, loss, or misuse." },
    { id: "retention", icon: "bi-hourglass-split", title: "5. Data Retention", content: "Data is retained for operational and legal requirements, then securely deleted or anonymized when no longer required." },
    { id: "contact", icon: "bi-envelope-at-fill", title: "6. Contact Us", content: "For privacy questions, reach out to our legal team at schooly309@gmail.com." },
  ];

  return (
    <div 
      className="min-vh-100"
      style={{
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b"
      }}
    >
      <HomeNavbar />

      {/* Hero Section */}
      <div className="py-5 mb-5" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", color: "white" }}>
        <div className="container pt-5">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-4">
                  <li className="breadcrumb-item"><a href="/" className="text-info text-decoration-none">Home</a></li>
                  <li className="breadcrumb-item active text-white-50" aria-current="page">Privacy Policy</li>
                </ol>
              </nav>
              <h1 className="display-3 fw-bold mb-3">Privacy <span className="text-info">Policy</span></h1>
              <p className="lead opacity-75 mb-0">How we handle your data to ensure a safe learning environment.</p>
              <div className="mt-4 d-flex align-items-center gap-3">
                <span className="badge rounded-pill px-3 py-2 bg-info bg-opacity-25 text-info border border-info border-opacity-50">
                  Version 2.1
                </span>
                <small className="opacity-50">Last updated: February 21, 2026</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        <div className="row g-5">
          {/* Side Navigation - Hidden on Mobile */}
          <div className="col-lg-4 d-none d-lg-block">
            <div className="sticky-top" style={{ top: "100px", zIndex: 10 }}>
              <div className="p-4 rounded-4 bg-white shadow-sm border border-light">
                <h6 className="fw-bold text-uppercase small text-muted mb-4">On this page</h6>
                <nav className="nav flex-column gap-2">
                  {sections.map((s) => (
                    <a key={s.id} href={`#${s.id}`} className="nav-link p-2 rounded text-dark-emphasis d-flex align-items-center gap-2 hover-bg-light transition-all">
                      <i className={`bi ${s.icon} text-primary`}></i>
                      {s.title.split(". ")[1]}
                    </a>
                  ))}
                </nav>
                <hr className="my-4 text-muted opacity-25" />
                <div className="bg-light p-3 rounded-3 border border-dashed text-center">
                  <p className="small text-muted mb-0">Need a PDF copy?</p>
                  <button className="btn btn-link btn-sm text-primary fw-bold text-decoration-none">Download Policy</button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-8">
            <div className="d-flex flex-column gap-5">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-5">
                  <div className="d-flex align-items-start gap-4">
                    <div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-4 shadow-sm" 
                         style={{ width: "56px", height: "56px", backgroundColor: "white", border: "1px solid #e2e8f0" }}>
                      <i className={`bi ${section.icon} fs-4 text-primary`}></i>
                    </div>
                    <div>
                      <h3 className="fw-bold h4 mb-3">{section.title}</h3>
                      <div className="p-4 rounded-4 bg-white border border-light shadow-sm" style={{ lineHeight: "1.8", color: "#475569" }}>
                        {section.content}
                        {section.id === "contact" && (
                          <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded-3 border-start border-primary border-4">
                            <span className="fw-medium text-primary">Response Time:</span> Usually within 24 business hours.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Bottom Note */}
            <div className="mt-5 p-5 rounded-5 bg-dark text-white text-center shadow-lg position-relative overflow-hidden">
               <div className="position-relative" style={{ zIndex: 1 }}>
                <h4 className="fw-bold mb-3">Questions about your rights?</h4>
                <p className="opacity-75 mb-4">We are committed to protecting your privacy and being transparent about how we use your data.</p>
                <Link to="/contact" className="btn btn-outline-light px-4 py-2 fw-bold rounded-pill">Contact Us</Link>
               </div>
               {/* Decorative Circle */}
               <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" style={{ background: "radial-gradient(circle at 10% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)" }}></div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* In-page Styles */}
      <style>{`
        .scroll-mt-5 { scroll-margin-top: 120px; }
        .hover-bg-light:hover { background-color: #f1f5f9; color: #2563eb !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .breadcrumb-item + .breadcrumb-item::before { color: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
}

export default PrivacyPolicyPage;