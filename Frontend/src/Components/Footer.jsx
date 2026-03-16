import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const brandColor = "#2563eb"; // Updated to modern primary blue

  return (
    <footer 
      className="pt-5 pb-4 bg-white border-top" 
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="container px-4 px-lg-5 mt-3">
        <div className="row gy-4">
          
          {/* Column 1: Brand & Bio */}
          <div className="col-lg-4 col-md-12 text-center text-lg-start">
            <div className="d-flex align-items-center justify-content-center justify-content-lg-start mb-4">
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center me-2 shadow-sm" 
                style={{ 
                  background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", 
                  width: "38px", 
                  height: "38px" 
                }}
              >
                <i className="bi bi-mortarboard-fill text-white fs-5"></i>
              </div>
              <h4 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
                School<span className="text-primary">Y</span>
              </h4>
            </div>
            <p className="text-muted pe-lg-4" style={{ lineHeight: 1.7 }}>
              Empowering the next generation of educators with smart, 
              scalable, and intuitive digital management tools.
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-lg-start mt-4">
              <a href="#" className="fs-5 hover-accent"><i className="bi bi-facebook"></i></a>
              <a href="#" className="fs-5 hover-accent"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="fs-5 hover-accent"><i className="bi bi-linkedin"></i></a>
              <a href="#" className="fs-5 hover-accent"><i className="bi bi-instagram"></i></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-uppercase small mb-4 tracking-wider">Platform</h6>
            <ul className="list-unstyled">
              <li className="mb-3"><Link to="/features" className="hover-link">Features</Link></li>
              <li className="mb-3"><a href="#" className="hover-link">Pricing</a></li>
              <li className="mb-3"><a href="#" className="hover-link">Testimonials</a></li>
              <li className="mb-3"><a href="#" className="hover-link">FAQ</a></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-uppercase small mb-4 tracking-wider">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-3"><Link to="/about" className="hover-link">About Us</Link></li>
              <li className="mb-3"><Link to="/contact" className="hover-link">Contact</Link></li>
              <li className="mb-3"><Link to="/privacy-policy" className="hover-link">Privacy Policy</Link></li>
              <li className="mb-3"><Link to="/terms" className="hover-link">Terms</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="col-lg-4 col-md-12">
            <h6 className="fw-bold text-uppercase small mb-4 tracking-wider text-center text-lg-start">Stay Updated</h6>
            <p className="text-muted small text-center text-lg-start mb-3" style={{ lineHeight: 1.6 }}>Get the latest education trends & updates.</p>
            
            <div className="input-group mb-3 shadow-sm rounded-pill overflow-hidden bg-light p-1 border border-secondary border-opacity-10">
              <input 
                type="email" 
                className="form-control border-0 bg-transparent px-4 py-2 shadow-none" 
                placeholder="Email address" 
                style={{ fontSize: '0.95rem' }}
              />
              <Link to="/contact" style={{ textDecoration: 'none' }}>
                <button 
                  className="btn text-white px-4 rounded-pill fw-medium hover-lift" 
                  style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", border: "none" }}
                  type="button"
                >
                  Join
                </button>
              </Link>
            </div>
          </div>
        </div>

        <hr className="my-5 opacity-10" />

        {/* Bottom Bar */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <p className="text-muted small mb-0 fw-medium">
            (c) 2026 <strong className="text-dark">SchoolY</strong>. Built with <i className="bi bi-heart-fill text-danger mx-1"></i> for modern schools.
          </p>
          <div className="d-flex gap-4">
             <span className="text-muted small fw-medium"><i className="bi bi-globe me-1"></i> English (US)</span>
             <span className="text-muted small fw-medium"><i className="bi bi-shield-check me-1 text-success"></i> SSL Secured</span>
          </div>
        </div>
      </div>

      <style>{`
        .hover-link {
          color: #64748b !important;
          text-decoration: none;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .hover-link:hover {
          color: ${brandColor} !important;
          padding-left: 6px;
        }
        .hover-accent {
          color: #475569 !important;
          transition: all 0.2s ease;
          display: inline-block;
        }
        .hover-accent:hover {
          color: ${brandColor} !important;
          transform: translateY(-4px);
        }
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.2);
        }
        .tracking-wider {
          letter-spacing: 0.08em;
          color: #334155;
        }
      `}</style>
    </footer>
  );
}

export default Footer;