import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const brandColor = "#d17b27";

  return (
    <footer className="pt-5 pb-4 bg-white border-top">
      <div className="container px-4 px-lg-5">
        <div className="row gy-4">
          
          {/* Column 1: Brand & Bio */}
          <div className="col-lg-4 col-md-12 text-center text-lg-start">
            <div className="d-flex align-items-center justify-content-center justify-content-lg-start mb-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-2" 
                   style={{ backgroundColor: brandColor, width: "35px", height: "35px" }}>
                <i className="bi bi-mortarboard-fill text-white fs-5"></i>
              </div>
              <h4 className="fw-bold mb-0">
                School<span style={{ color: brandColor }}>Y</span>
              </h4>
            </div>
            <p className="text-muted pe-lg-4">
              Empowering the next generation of educators with smart, 
              scalable, and intuitive digital management tools.
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-lg-start mt-4">
              <a href="#" className="text-dark fs-5 hover-accent"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-dark fs-5 hover-accent"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="text-dark fs-5 hover-accent"><i className="bi bi-linkedin"></i></a>
              <a href="#" className="text-dark fs-5 hover-accent"><i className="bi bi-instagram"></i></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-uppercase small mb-4 tracking-wider">Platform</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/features" className="text-muted text-decoration-none hover-link">Features</Link></li>
              <li className="mb-2"><a href="#" className="text-muted text-decoration-none hover-link">Pricing</a></li>
              <li className="mb-2"><a href="#" className="text-muted text-decoration-none hover-link">Testimonials</a></li>
              <li className="mb-2"><a href="#" className="text-muted text-decoration-none hover-link">FAQ</a></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-uppercase small mb-4 tracking-wider">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/about" className="text-muted text-decoration-none hover-link">About Us</Link></li>
              <li className="mb-2"><Link to="/contact" className="text-muted text-decoration-none hover-link">Contact</Link></li>
              <li className="mb-2"><Link to="/privacy-policy" className="text-muted text-decoration-none hover-link">Privacy Policy</Link></li>
              <li className="mb-2"><Link to="/terms" className="text-muted text-decoration-none hover-link">Terms</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="col-lg-4 col-md-12">
            <h6 className="fw-bold text-uppercase small mb-4 tracking-wider text-center text-lg-start">Stay Updated</h6>
            <p className="text-muted small text-center text-lg-start">Get the latest education trends & updates.</p>
            <div className="input-group mb-3 shadow-sm rounded-pill overflow-hidden border">
              <input 
                type="email" 
                className="form-control border-0 px-4 py-2" 
                placeholder="Email address" 
                style={{ fontSize: '0.9rem' }}
              />
              <button 
                className="btn text-white px-4" 
                style={{ backgroundColor: brandColor }}
                type="button"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <hr className="my-5 opacity-10" />

        {/* Bottom Bar */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <p className="text-muted small mb-0">
            (c) 2026 <strong>SchoolY</strong>. Built with <i className="bi bi-heart-fill text-danger mx-1"></i> for modern schools.
          </p>
          <div className="d-flex gap-4">
             <span className="text-muted small"><i className="bi bi-globe me-1"></i> English (US)</span>
             <span className="text-muted small"><i className="bi bi-shield-check me-1"></i> SSL Secured</span>
          </div>
        </div>
      </div>

      <style>{`
        .hover-link:hover {
          color: ${brandColor} !important;
          padding-left: 5px;
          transition: all 0.2s ease;
        }
        .hover-accent:hover {
          color: ${brandColor} !important;
          transform: translateY(-3px);
          transition: all 0.2s ease;
          display: inline-block;
        }
        .tracking-wider {
          letter-spacing: 0.08em;
          color: #2d3436;
        }
      `}</style>
    </footer>
  );
}

export default Footer;
