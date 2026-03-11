import React from "react";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import api from "../api/api";

function ContactPage() {
  const brandColor = "#d17b27";
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
    <div style={{ backgroundColor: "#f8f9fa", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <HomeNavbar />
      
      {/* ===== HEADER SECTION ===== */}
      <div className="py-5 text-center" style={{ background: "linear-gradient(135deg, #fff 0%, #fdf5eb 100%)" }}>
        <div className="container py-4">
          <h1 className="display-4 fw-bold">Let's Connect</h1>
          <p className="text-muted fs-5 mx-auto" style={{ maxWidth: "600px" }}>
            Have questions about SchoolY? Whether you're a small academy or a large university, our team is here to help you scale.
          </p>
        </div>
      </div>

      {/* ===== CONTACT CARD SECTION ===== */}
      <section className="container mt-n5" style={{ marginTop: "-50px" }}>
        <div className="card border-0 shadow-lg rounded-5 overflow-hidden">
          <div className="row g-0">
            
            {/* Left Side: Dark Info Panel */}
            <div className="col-lg-5 p-5 text-white d-flex flex-column justify-content-between" 
                 style={{ backgroundColor: "#1a1a1a" }}>
              <div>
                <h3 className="fw-bold mb-4 text-warning">Contact Information</h3>
                <p className="opacity-75 mb-5">Fill out the form and our team will get back to you within 24 hours.</p>
                
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle bg-dark-subtle p-3 me-3 border border-secondary">
                    <i className="bi bi-telephone text-warning fs-4"></i>
                  </div>
                  <div>
                    <p className="small text-uppercase opacity-50 mb-0">Call Us</p>
                    <p className="fw-bold mb-0">+1 (555) 000-1234</p>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle bg-dark-subtle p-3 me-3 border border-secondary">
                    <i className="bi bi-envelope text-warning fs-4"></i>
                  </div>
                  <div>
                    <p className="small text-uppercase opacity-50 mb-0">Email Us</p>
                    <p className="fw-bold mb-0">myschooly@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="small opacity-50 mb-3">FOLLOW US</p>
                <div className="d-flex gap-3">
                  <i className="bi bi-linkedin fs-4 cursor-pointer"></i>
                  <i className="bi bi-twitter-x fs-4 cursor-pointer"></i>
                  <i className="bi bi-facebook fs-4 cursor-pointer"></i>
                </div>
              </div>
            </div>

            {/* Right Side: Form Panel */}
            <div className="col-lg-7 p-5 bg-white">
              <form onSubmit={onSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">FIRST NAME</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={onChange}
                      type="text"
                      className="form-control border-0 bg-light py-3 px-4"
                      placeholder="John"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">LAST NAME</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      type="text"
                      className="form-control border-0 bg-light py-3 px-4"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">EMAIL ADDRESS</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      type="email"
                      className="form-control border-0 bg-light py-3 px-4"
                      placeholder="john@school.edu"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">MESSAGE</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={onChange}
                      className="form-control border-0 bg-light py-3 px-4"
                      rows="4"
                      placeholder="Tell us about your school..."
                    ></textarea>
                  </div>
                  {feedback ? (
                    <div className="col-12">
                      <div className="alert alert-info py-2 mb-0">{feedback}</div>
                    </div>
                  ) : null}
                  <div className="col-12 pt-3">
                    <button
                      type="submit"
                      className="btn btn-lg w-100 text-white fw-bold py-3 shadow-lg"
                      style={{ backgroundColor: brandColor }}
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="container py-5 mt-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Common Questions</h2>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="accordion accordion-flush bg-white rounded-4 shadow-sm" id="faqAccordion">
              <div className="accordion-item rounded-4 border-0 mb-2">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed fw-bold py-4" type="button" data-bs-toggle="collapse" data-bs-target="#f1">
                    How long does setup take?
                  </button>
                </h2>
                <div id="f1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body text-muted">
                    Most schools are fully migrated and live within 48 to 72 hours with our bulk import tools.
                  </div>
                </div>
              </div>
              <div className="accordion-item rounded-4 border-0 mb-2">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed fw-bold py-4" type="button" data-bs-toggle="collapse" data-bs-target="#f2">
                    Is there a free trial?
                  </button>
                </h2>
                <div id="f2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body text-muted">
                    Yes! We offer a 14-day full-access trial for all new institutions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .cursor-pointer { cursor: pointer; transition: 0.2s; }
        .cursor-pointer:hover { color: ${brandColor}; }
        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 0.25rem rgba(209, 123, 39, 0.1);
          background-color: #f1f1f1 !important;
        }
      `}</style>

    </div>
  );
}

export default ContactPage;
