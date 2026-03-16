import React from "react";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import api from "../api/api";
import Footer from "./Footer";

function ContactPage() {
  const brandColor = "#2563eb"; // Updated to match new UI theme
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) {
      setFeedback("Please fill first name, email and message.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");
      const res = await api.post("/api/contact", form);
      if (res.data?.success) {
        setFeedback("Message sent successfully. We will contact you soon.");
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          message: "",
        });
      } else {
        setFeedback(res.data?.message || "Failed to send message.");
      }
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="position-relative overflow-hidden" 
      style={{ backgroundColor: "#f3f4f6", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", minHeight: "100vh" }}
    >
      <HomeNavbar />
      
      {/* Decorative background elements */}
      <div 
        className="position-absolute rounded-circle opacity-25 d-none d-md-block" 
        style={{ 
          width: '500px', height: '500px', 
          background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', 
          top: '-10%', left: '-5%', filter: 'blur(50px)', zIndex: 0 
        }}
      ></div>

      {/* ===== HEADER SECTION ===== */}
      <div className="py-5 text-center position-relative" style={{ zIndex: 1 }}>
        <div className="container py-4 mt-3">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase tracking-wider mb-4 border border-primary border-opacity-25 shadow-sm">
            <i className="bi bi-headset fs-6"></i> Support
          </div>
          <h1 className="display-4 fw-bolder text-dark mb-3" style={{ letterSpacing: '-1px' }}>Let's Connect</h1>
          <p className="text-muted fs-5 mx-auto" style={{ maxWidth: "600px", lineHeight: 1.6 }}>
            Have questions about SchoolY? Whether you're a small academy or a large university, our team is here to help you scale.
          </p>
        </div>
      </div>

      {/* ===== CONTACT CARD SECTION ===== */}
      <section className="container mb-5 position-relative" style={{ zIndex: 2 }}>
        <div className="card border-0 shadow-lg rounded-5 overflow-hidden">
          <div className="row g-0">
            
            {/* Left Side: Dark Info Panel */}
            <div className="col-lg-5 p-5 text-white d-flex flex-column justify-content-between position-relative overflow-hidden" 
                 style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
              
              {/* Inner decorative blur */}
              <div className="position-absolute rounded-circle opacity-20" style={{ width: '250px', height: '250px', background: '#4f46e5', bottom: '-50px', right: '-50px', filter: 'blur(40px)' }}></div>

              <div className="position-relative z-1">
                <h3 className="fw-bolder mb-4 text-white">Contact Information</h3>
                <p className="text-white-50 mb-5" style={{ lineHeight: 1.6 }}>Fill out the form and our team will get back to you within 24 hours.</p>
                
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <i className="bi bi-telephone text-info fs-5"></i>
                  </div>
                  <div>
                    <p className="small text-uppercase text-white-50 tracking-wider fw-semibold mb-0" style={{ fontSize: '11px' }}>Call Us</p>
                    <p className="fw-bold mb-0 fs-5">+1 (555) 000-1234</p>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <i className="bi bi-envelope text-info fs-5"></i>
                  </div>
                  <div>
                    <p className="small text-uppercase text-white-50 tracking-wider fw-semibold mb-0" style={{ fontSize: '11px' }}>Email Us</p>
                    <p className="fw-bold mb-0 fs-5">myschooly@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 position-relative z-1">
                <p className="small text-white-50 text-uppercase tracking-wider fw-semibold mb-3" style={{ fontSize: '11px' }}>Follow Us</p>
                <div className="d-flex gap-3">
                  <div className="social-icon"><i className="bi bi-linkedin fs-5"></i></div>
                  <div className="social-icon"><i className="bi bi-twitter-x fs-5"></i></div>
                  <div className="social-icon"><i className="bi bi-facebook fs-5"></i></div>
                </div>
              </div>
            </div>

            {/* Right Side: Form Panel */}
            <div className="col-lg-7 p-4 p-md-5 bg-white">
              <form onSubmit={onSubmit}>
                <div className="row g-4">
                  
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary text-uppercase tracking-wider" style={{ fontSize: '11px' }}>First Name</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-0 text-muted pe-0"><i className="bi bi-person"></i></span>
                      <input
                        name="firstName"
                        value={form.firstName}
                        onChange={onChange}
                        type="text"
                        className="form-control border-0 bg-light py-3 px-3 shadow-none"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary text-uppercase tracking-wider" style={{ fontSize: '11px' }}>Last Name</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      type="text"
                      className="form-control form-control-lg border-0 bg-light py-3 px-4 shadow-none"
                      placeholder="Doe"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary text-uppercase tracking-wider" style={{ fontSize: '11px' }}>Email Address</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-0 text-muted pe-0"><i className="bi bi-envelope"></i></span>
                      <input
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        type="email"
                        className="form-control border-0 bg-light py-3 px-3 shadow-none"
                        placeholder="john@school.edu"
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary text-uppercase tracking-wider" style={{ fontSize: '11px' }}>Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={onChange}
                      className="form-control border-0 bg-light py-3 px-4 shadow-none"
                      rows="4"
                      placeholder="Tell us about your school..."
                    ></textarea>
                  </div>

                  {feedback && (
                    <div className="col-12">
                      <div className={`alert py-3 mb-0 rounded-4 d-flex align-items-center ${feedback.includes('success') ? 'alert-success' : 'alert-info'}`}>
                        <i className={`bi ${feedback.includes('success') ? 'bi-check-circle-fill text-success' : 'bi-info-circle-fill text-info'} me-2 fs-5`}></i>
                        <div>{feedback}</div>
                      </div>
                    </div>
                  )}

                  <div className="col-12 pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 fw-bold py-3 rounded-3 shadow-sm hover-lift"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...</>
                      ) : (
                        "Send Message"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>
                      
        <style>{`
        .tracking-wider { letter-spacing: 0.05em; }
        .social-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .social-icon:hover {
          background: white;
          color: #2563eb;
          transform: translateY(-3px);
        }
        .form-control:focus, .form-select:focus {
          background-color: #e2e8f0 !important;
        }
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 .5rem 1rem rgba(37,99,235,.15)!important;
        }
        .accordion-button:not(.collapsed) {
          background-color: white;
          color: #2563eb;
          box-shadow: none;
        }
        .accordion-button:focus {
          border-color: transparent;
          box-shadow: none;
        }
      `}</style>
      <Footer/>
    </div>
  );
}

export default ContactPage;