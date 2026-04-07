import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";

function FeaturesPage() {
  const features = [
    { 
      title: "Smart Attendance", 
      icon: "bi-calendar-check", 
      desc: "Automate daily attendance tracking and notify parents instantly via SMS." 
    },
    { 
      title: "Fee Management", 
      icon: "bi-wallet2", 
      desc: "Manage invoices, online payments, and track pending dues effortlessly." 
    },
    { 
      title: "Exam Portal", 
      icon: "bi-journal-text", 
      desc: "Seamless online testing and automatic, beautifully formatted result cards." 
    },
    { 
      title: "Role Based Access", 
      icon: "bi-shield-lock", 
      desc: "Dedicated and secure portals for admins, teachers, students, and parents." 
    },
    { 
      title: "Communication", 
      icon: "bi-chat-dots", 
      desc: "Built-in messaging, broadcast announcements, and event calendar system." 
    },
    { 
      title: "Data Analytics", 
      icon: "bi-bar-chart-line", 
      desc: "Track student and school performance with clear, actionable insights." 
    },
  ];

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Tiny CSS for that "Perfect" hover feel */}
      <style>{`
        .modern-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .modern-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important;
        }
        .icon-wrapper {
          width: 72px;
          height: 72px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <HomeNavbar />

      <main className="flex-grow-1">
        
        {/* Modern Header */}
        <div className="container py-5 text-center mt-md-4">
          <div className="d-inline-block px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small mb-4 tracking-wider">
            PLATFORM FEATURES
          </div>
          <h1 className="display-4 fw-bold text-dark mb-3" style={{ letterSpacing: "-1px" }}>
            Everything you need to <span className="text-primary">succeed.</span>
          </h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "600px" }}>
            A complete suite of tools designed to simplify administration, empower teachers, and engage parents.
          </p>
        </div>

        {/* Polished Grid */}
        <div className="container pb-5">
          <div className="row g-4">
            {features.map((feat, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm modern-card text-center rounded-4">
                  <div className="card-body p-4 p-lg-5">
                    
                    {/* Centered Soft Icon Background */}
                    <div className="icon-wrapper bg-primary bg-opacity-10 rounded-circle mb-4">
                      <i className={`bi ${feat.icon} text-primary fs-2`}></i>
                    </div>
                    
                    {/* Text */}
                    <h5 className="fw-bold mb-3 text-dark">{feat.title}</h5>
                    <p className="text-secondary mb-0" style={{ lineHeight: "1.6" }}>
                      {feat.desc}
                    </p>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default FeaturesPage;