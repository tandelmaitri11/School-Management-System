import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import HomeNavbar from "../Pages/Home/HomeNavbar";
import api from "../api/api";
import Footer from "./Footer";

function ContactPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) {
      setFeedback("error: Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");
      const res = await api.post("/api/contact", form);
      if (res.data?.success) {
        setFeedback("success: Message sent! We'll be in touch soon.");
        setForm({ firstName: "", lastName: "", email: "", message: "" });
      } else {
        setFeedback(`error: ${res.data?.message || "Something went wrong."}`);
      }
    } catch (err) {
      setFeedback("error: Failed to connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <HomeNavbar />

      {/* Hero Header */}
      <section className="pt-5 pb-4 bg-light position-relative overflow-hidden">
        <div className="container pt-5 text-center position-relative" style={{ zIndex: 1 }}>
          <h1 className="display-4 fw-black text-dark mb-3">Talk to an <span className="text-primary">Expert</span></h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "700px" }}>
            Experience the future of school management. Our team typically responds within 4 working hours.
          </p>
        </div>
        {/* Background Decorative Blobs */}
        <div className="position-absolute translate-middle opacity-10" style={{ top: '20%', left: '10%', width: '300px', height: '300px', background: '#2563eb', filter: 'blur(80px)', borderRadius: '50%' }}></div>
      </section>

      <main className="container py-5">
        <div className="row g-5 justify-content-center">

          {/* Quick Contact Sidebar */}
          <div className="col-lg-3">
            <div className="d-flex flex-column gap-4 sticky-top" style={{ top: '100px' }}>
              <div className="p-4 rounded-4 bg-white shadow-sm border border-light transition-hover">
                <div className="d-flex align-items-center gap-3 mb-3 text-primary">
                  {/* Fixed: changed 'bi-Email' (which doesn't exist) to 'bi-envelope-fill' */}
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                    <i className="bi bi-envelope-fill fs-5"></i>
                  </div>
                  <h6 className="mb-0 fw-bold">Email Us</h6>
                </div>
                <p className="small text-muted mb-0">schooly309@gmail.com</p>
              </div>
              <div className="p-4 rounded-4 bg-white shadow-sm border border-light transition-hover">
                <div className="d-flex align-items-center gap-3 mb-3 text-success">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3"><i className="bi bi-whatsapp fs-5"></i></div>
                  <h6 className="mb-0 fw-bold">WhatsApp</h6>
                </div>
                <p className="small text-muted mb-0">+1 (000) 0000 0000</p>
              </div>


            </div>
          </div>

          {/* Contact Form Panel */}
          <div className="col-lg-8">
            <div className="p-4 p-md-5 rounded-5 bg-white shadow-xl border border-light">
              <form onSubmit={onSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="form-floating custom-form-group">
                      <input type="text" className="form-control" id="firstName" name="firstName" placeholder="John" value={form.firstName} onChange={onChange} />
                      <label htmlFor="firstName">First Name</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-floating custom-form-group">
                      <input type="text" className="form-control" id="lastName" name="lastName" placeholder="Doe" value={form.lastName} onChange={onChange} />
                      <label htmlFor="lastName">Last Name</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating custom-form-group">
                      <input type="email" className="form-control" id="email" name="email" placeholder="name@school.com" value={form.email} onChange={onChange} />
                      <label htmlFor="email">Work Email</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating custom-form-group">
                      <textarea className="form-control" placeholder="Leave a comment here" id="message" name="message" style={{ height: "150px" }} value={form.message} onChange={onChange}></textarea>
                      <label htmlFor="message">How can we help your institution?</label>
                    </div>
                  </div>

                  {feedback && (
                    <div className="col-12">
                      <div className={`alert rounded-4 border-0 d-flex align-items-center ${feedback.startsWith('success') ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        <i className={`bi ${feedback.startsWith('success') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-3`}></i>
                        <span className="small fw-medium">{feedback.split(': ')[1]}</span>
                      </div>
                    </div>
                  )}

                  <div className="col-12 text-end">
                    <button disabled={submitting} type="submit" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg transition-all d-inline-flex align-items-center gap-2">
                      {submitting ? <><span className="spinner-border spinner-border-sm"></span> Sending...</> : <>Send Message <i className="bi bi-arrow-right"></i></>}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Trust Logos Strip */}
            <div className="mt-5 text-center px-4">
              <p className="small text-uppercase text-muted fw-bold mb-4 tracking-widest">Trusted by leading institutions</p>
              <div className="d-flex flex-wrap justify-content-center gap-4 opacity-50 grayscale-filter">
                <i className="bi bi-mortarboard fs-2 mx-3"></i>
                <i className="bi bi-bank fs-2 mx-3"></i>
                <i className="bi bi-briefcase fs-2 mx-3"></i>
                <i className="bi bi-award fs-2 mx-3"></i>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />

      <style>{`
        .fw-black { font-weight: 900; }
        .shadow-xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); }
        .grayscale-filter { filter: grayscale(1); }
        .transition-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; transition: all 0.3s ease; }
        
        .custom-form-group .form-control {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding-top: 1.625rem;
          padding-bottom: 0.625rem;
          background-color: #f8fafc;
        }

        .custom-form-group .form-control:focus {
          background-color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .custom-form-group label {
          color: #64748b;
          font-weight: 500;
          padding-left: 1.25rem;
        }

        .transition-all { transition: all 0.2s ease-in-out; }
        .btn-primary:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}

export default ContactPage;