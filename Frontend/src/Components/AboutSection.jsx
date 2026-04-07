import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";
import { Link } from "react-router-dom";

function AboutSection() {
  return (
    <div 
      className="min-vh-100 position-relative"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        color: "#0f172a"
      }}
    >
      <style>{`
        .text-gradient {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bento-card {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .bento-card:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important;
        }
        .bg-soft-blue { background-color: #f0f7ff; }
        .bg-soft-purple { background-color: #faf5ff; }
      `}</style>

      <HomeNavbar />

      <main className="container py-5 mt-lg-5">
        <div className="row g-5 align-items-center">
          
          {/* Left Column: Story & Vision */}
          <div className="col-lg-5">
            <div className="mb-4">
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 mb-3">
                Since 2024
              </span>
              <h1 className="display-3 fw-bold mb-4 tracking-tight">
                Our story is <br />
                <span className="text-gradient">Education First.</span>
              </h1>
              <p className="lead text-secondary mb-5" style={{ lineHeight: 1.8 }}>
                We didn't just build a software; we built a digital ecosystem. SchoolY simplifies the chaos of administration so educators can focus on what matters: <strong>the students.</strong>
              </p>
            </div>

            <div className="row g-4">
              <div className="col-12 d-flex gap-3">
                <div className="flex-shrink-0">
                   <div className="rounded-circle bg-soft-blue p-3 text-primary">
                      <i className="bi bi-shield-check fs-4"></i>
                   </div>
                </div>
                <div>
                  <h5 className="fw-bold">Secure by Design</h5>
                  <p className="small text-muted">Enterprise-grade security protecting every student record.</p>
                </div>
              </div>
              <div className="col-12 d-flex gap-3">
                <div className="flex-shrink-0">
                   <div className="rounded-circle bg-soft-purple p-3 text-purple" style={{color: '#7c3aed'}}>
                      <i className="bi bi-lightning-charge fs-4"></i>
                   </div>
                </div>
                <div>
                  <h5 className="fw-bold">Real-time Insights</h5>
                  <p className="small text-muted">Instant data analytics for attendance, grades, and fees.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: The Bento Grid Stats */}
          <div className="col-lg-7">
            <div className="row g-4">
              {/* Big Stat Card */}
              <div className="col-md-7">
                <div className="card bento-card h-100 border-0 rounded-5 p-5 bg-dark text-white shadow-lg overflow-hidden position-relative">
                   <div className="position-relative" style={{ zIndex: 1 }}>
                    <h3 className="display-2 fw-bold mb-0">12k</h3>
                    <p className="fs-5 opacity-75">Active Students</p>
                    <hr className="w-25 opacity-50 my-4" />
                    <p className="small mb-0">Growing by 15% every month since launch.</p>
                   </div>
                   {/* Abstract background shape */}
                   <div className="position-absolute bottom-0 end-0 opacity-25" style={{ width: '150px', height: '150px', background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(40px)' }}></div>
                </div>
              </div>

              {/* Small Stat 1 */}
              <div className="col-md-5">
                <div className="card bento-card border-0 rounded-5 p-4 bg-soft-blue h-100 text-center">
                  <div className="mb-3 text-primary">
                    <i className="bi bi-buildings-fill fs-1"></i>
                  </div>
                  <h2 className="fw-bold mb-1">500+</h2>
                  <p className="text-muted small fw-medium text-uppercase">Partner Schools</p>
                </div>
              </div>

              {/* Small Stat 2 */}
              <div className="col-md-5">
                <div className="card bento-card border-0 rounded-5 p-4 bg-soft-purple h-100 text-center">
                  <div className="mb-3" style={{color: '#7c3aed'}}>
                    <i className="bi bi-globe2 fs-1"></i>
                  </div>
                  <h2 className="fw-bold mb-1">10+</h2>
                  <p className="text-muted small fw-medium text-uppercase">Cities Reached</p>
                </div>
              </div>

              {/* Message/Action Card */}
              <div className="col-md-7">
                <div className="card bento-card border-0 rounded-5 p-4 bg-white shadow-sm h-100 d-flex flex-row align-items-center gap-4">
                  <div className="rounded-4 bg-light p-4 d-none d-sm-block">
                    <i className="bi bi-quote fs-2 text-secondary"></i>
                  </div>
                  <div>
                    <p className="mb-2 italic text-dark-emphasis">"The efficiency we gained in one semester was game-changing."</p>
                    <footer className="blockquote-footer mb-0">Principal, Elite Academy</footer>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* CTA Section before Footer */}
      <section className="container py-5 my-5">
        <div className="rounded-5 p-5 text-center shadow-sm border border-light bg-light">
          <h2 className="fw-bold mb-3">Ready to transform your school?</h2>
          <p className="text-muted mb-4">Join the hundreds of institutions already using SchoolY.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-primary px-4 py-2 rounded-pill fw-bold">Get Started</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AboutSection;