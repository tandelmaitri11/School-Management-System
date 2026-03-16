import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import Footer from "./Footer";

function AboutSection() {
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
          box-shadow: 0 1.5rem 3rem rgba(0,0,0,0.1) !important;
        }
        .tracking-wider {
          letter-spacing: 0.05em;
        }
      `}</style>

      <HomeNavbar />
      
      {/* Decorative background glow elements */}
      <div 
        className="position-absolute rounded-circle opacity-25" 
        style={{ 
          width: '500px', height: '500px', 
          background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', 
          top: '-10%', left: '-10%', filter: 'blur(50px)', zIndex: 0 
        }}
      ></div>
      <div 
        className="position-absolute rounded-circle opacity-25" 
        style={{ 
          width: '400px', height: '400px', 
          background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', 
          bottom: '5%', right: '-5%', filter: 'blur(50px)', zIndex: 0 
        }}
      ></div>

      <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
        <div className="row align-items-center min-vh-75 py-4 py-lg-5 g-5">
          
          {/* Left Content: Mission Statement */}
          <div className="col-lg-6 pe-lg-5">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase tracking-wider mb-4 border border-primary border-opacity-25 shadow-sm">
              <i className="bi bi-bullseye fs-6"></i> Our Mission
            </div>
            
            <h2 className="display-4 fw-bolder text-dark mb-4" style={{ letterSpacing: '-1px', lineHeight: 1.2 }}>
              Digitizing the future of classrooms.
            </h2>
            
            <p className="text-muted fs-5 mb-5" style={{ lineHeight: 1.7 }}>
              Founded in 2024, SchoolY was built to bridge the gap between administrative complexity and educational excellence.
            </p>
            
            {/* Visual Accent */}
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)', borderRadius: '4px' }}></div>
              <span className="text-muted small fw-bold text-uppercase tracking-wider">Empowering Education</span>
            </div>
          </div>

          {/* Right Content: Stats Cards */}
          <div className="col-lg-6">
            <div className="position-relative px-md-3">
              
              {/* Backdrop shape to anchor the design */}
              <div 
                className="position-absolute top-50 start-50 translate-middle w-100 h-100 rounded-5 d-none d-md-block" 
                style={{ 
                  background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", 
                  transform: "rotate(-4deg)", 
                  zIndex: -1,
                  opacity: 0.15 
                }}
              ></div>

              <div className="row g-4 align-items-center">
                {/* Schools Stat */}
                <div className="col-sm-6">
                  <div className="card border-0 shadow-lg rounded-5 p-4 p-xl-5 text-center hover-lift" style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)" }}>
                    <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-buildings fs-1"></i>
                    </div>
                    <h2 className="display-4 fw-bolder mb-2 text-dark">
                      500<span className="text-primary">+</span>
                    </h2>
                    <p className="fw-bold text-muted mb-0 text-uppercase tracking-wider small">Schools</p>
                  </div>
                </div>
                
                {/* Students Stat */}
                <div className="col-sm-6">
                  <div className="card border-0 shadow-lg rounded-5 p-4 p-xl-5 text-center hover-lift mt-sm-5" style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)" }}>
                    <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-people fs-1"></i>
                    </div>
                    <h2 className="display-4 fw-bolder mb-2 text-dark">12k</h2>
                    <p className="fw-bold text-muted mb-0 text-uppercase tracking-wider small">Students</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

        </div>
      </div>
      <Footer/>
    </div>
    
  );
  
}

export default AboutSection;