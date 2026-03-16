import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "./HomeNavbar";
import Footer from "../../Components/Footer";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div 
      className="position-relative overflow-hidden"
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        minHeight: "100vh"
      }}
    >
      <style>{`
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-10px);
          box-shadow: 0 1.5rem 3rem rgba(37,99,235,0.1) !important;
        }
        .tracking-wider {
          letter-spacing: 0.05em;
        }
      `}</style>

      <HomeNavbar />

      {/* Decorative background glow elements */}
      <div 
        className="position-absolute rounded-circle opacity-25 d-none d-md-block" 
        style={{ 
          width: '600px', height: '600px', 
          background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', 
          top: '-10%', left: '-10%', filter: 'blur(60px)', zIndex: 0 
        }}
      ></div>
      <div 
        className="position-absolute rounded-circle opacity-20 d-none d-md-block" 
        style={{ 
          width: '500px', height: '500px', 
          background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', 
          bottom: '20%', right: '-10%', filter: 'blur(60px)', zIndex: 0 
        }}
      ></div>

      {/* ===== HERO SECTION ===== */}
      <section className="container py-5 position-relative" style={{ zIndex: 1, marginTop: '3rem', marginBottom: '3rem' }}>
        <div className="row align-items-center g-5">

          {/* Left Text Side */}
          <div className="col-12 col-md-6 text-center text-md-start">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase tracking-wider mb-4 border border-primary border-opacity-25 shadow-sm">
              <i className="bi bi-stars fs-6"></i> The Future of Education
            </div>
            
            <h1 className="fw-bolder display-4 mb-4 text-dark" style={{ letterSpacing: '-1px', lineHeight: 1.2 }}>
              Smart School Management <span className="text-primary">Made Simple.</span>
            </h1>
            
            <p className="text-muted fs-5 mb-5" style={{ lineHeight: 1.6, maxWidth: '540px' }}>
              Manage students, staff, attendance, exams, fees and more — all in one modern digital platform.
            </p>

            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-md-start">
              <button
                className="btn btn-lg text-white fw-bold px-5 rounded-pill shadow-sm hover-lift"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", border: "none" }}
                onClick={() => navigate("/register")}
              >
                Get Started <i className="bi bi-arrow-right ms-2"></i>
              </button>

              <button
                className="btn btn-lg btn-light fw-bold px-5 rounded-pill shadow-sm hover-lift"
                style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#475569" }}
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </div>
          </div>

          {/* Right Side Illustration */}
          <div className="col-12 col-md-6 mt-4 mt-md-0 text-center position-relative">
            {/* Abstract shape behind image */}
            <div className="position-absolute top-50 start-50 translate-middle w-75 h-75 rounded-circle bg-primary opacity-10" style={{ filter: 'blur(40px)' }}></div>
            
            <img
              src="https://img.freepik.com/free-photo/book-stack-with-apple-education-concept_23-2148898685.jpg"
              alt="books illustration"
              className="img-fluid rounded-5 shadow-lg position-relative"
              style={{ border: '8px solid white', transform: 'rotate(2deg)' }}
            />
          </div>

        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-5">
          <h2 className="fw-bolder display-5 text-dark mb-3" style={{ letterSpacing: '-1px' }}>What We Offer</h2>
          <p className="text-muted fs-5 mx-auto" style={{ maxWidth: '600px' }}>
            A complete digital solution for your school.
          </p>
        </div>

        <div className="row g-4">
          {[
            { icon: "bi-people-fill", title: "Student Records", desc: "Easily manage student data, academics and progress.", color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
            { icon: "bi-book", title: "Digital Library", desc: "Provide e-books and digital study material.", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
            { icon: "bi-cash-stack", title: "Fee Management", desc: "Handle fee payments, receipts and reminders effortlessly.", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
            { icon: "bi-calendar-event", title: "Attendance & Scheduling", desc: "Track attendance, exams and classes.", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" }
          ].map((card, idx) => (
            <div className="col-12 col-sm-6 col-lg-3" key={idx}>
              <div className="card border-0 shadow-sm p-4 text-center h-100 rounded-5 bg-white hover-lift">
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-4 mb-4 mx-auto" 
                  style={{ width: '70px', height: '70px', backgroundColor: card.bg }}
                >
                  <i className={`${card.icon} fs-2`} style={{ color: card.color }}></i>
                </div>
                <h5 className="fw-bold text-dark mb-3">{card.title}</h5>
                <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="py-5 mt-5 position-relative" style={{ zIndex: 1, backgroundColor: "#ffffff" }}>
        {/* Subtle top border gradient */}
        <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)' }}></div>
        
        <div className="container row align-items-center mx-auto py-4 py-md-5 g-5">

          {/* Left Image */}
          <div className="col-12 col-md-6 text-center">
            <img
              src="https://img.freepik.com/free-photo/front-view-books-stack-education-day_23-2149241030.jpg"
              className="img-fluid rounded-5 shadow-lg"
              alt="book concept"
              style={{ border: '8px solid #f8fafc', transform: 'rotate(-2deg)' }}
            />
          </div>

          {/* Right Text */}
          <div className="col-12 col-md-6 ps-md-5 mt-4 mt-md-0 text-center text-md-start">
            <h2 className="fw-bolder display-6 text-dark mb-4" style={{ letterSpacing: '-1px' }}>A Better Experience for Schools</h2>
            <p className="text-muted fs-5 mb-5" style={{ lineHeight: 1.7 }}>
              SchoolY helps simplify daily operations, improve communication, support teachers, and provide parents with better transparency — creating a smarter learning environment.
            </p>

            <button
              className="btn btn-lg text-white fw-bold px-5 rounded-pill shadow-sm hover-lift"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", border: "none" }}
              onClick={() => navigate("/register")}
            >
              Explore More
            </button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

export default HomePage;