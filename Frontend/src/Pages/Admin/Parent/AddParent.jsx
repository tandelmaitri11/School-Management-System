import React, { useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  status: "Active",
};

export default function AddParent() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdParent, setCreatedParent] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const res = await api.post("/api/parent/admin/create", form);
      setCreatedParent(res.data?.parent || null);
      setMessage(res.data?.message || "Parent created successfully");
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create parent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1200px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-people-fill me-1"></i> User Management
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Create Parent Account</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Generate guardian credentials before linking them to enrolled students.</p>
            </div>
            <button onClick={() => window.history.back()} className="btn bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center transition-all" style={{ width: 48, height: 48 }}>
              <i className="bi bi-arrow-left fs-5" style={{ color: '#4f46e5' }}></i>
            </button>
          </div>
        </div>

        <div className="row g-4">
          
          {/* Form Column */}
          <div className="col-12 col-lg-8">
            <div className="premium-card p-4 p-md-5 h-100">
              <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                  <i className="bi bi-person-plus-fill"></i>
                </div>
                Account Details
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Full Name</label>
                    <input
                      className="form-control input-premium"
                      name="name"
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Email Address</label>
                    <input
                      type="email"
                      className="form-control input-premium"
                      name="email"
                      placeholder="parent@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Initial Password</label>
                    <input
                      type="password"
                      className="form-control input-premium"
                      name="password"
                      placeholder="Enter strong password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Phone Number</label>
                    <input
                      className="form-control input-premium"
                      name="phone"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Status</label>
                    <select className="form-select input-premium" name="status" value={form.status} onChange={handleChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {message && (
                  <div className="alert bg-success bg-opacity-10 border border-success border-opacity-25 text-success fw-semibold mt-4 mb-0 d-flex align-items-center rounded-3 animate-fade-in">
                    <i className="bi bi-check-circle-fill me-2 fs-5"></i> {message}
                  </div>
                )}
                
                {error && (
                  <div className="alert bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger fw-semibold mt-4 mb-0 d-flex align-items-center rounded-3 animate-fade-in">
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i> {error}
                  </div>
                )}

                <div className="d-flex justify-content-end mt-5 pt-3 border-top" style={{ borderColor: '#e2e8f0' }}>
                  <button type="submit" className="btn btn-brand btn-lg rounded-pill px-5 fw-bold shadow-sm" disabled={saving}>
                    {saving ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                    ) : (
                      "Create Parent Account"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Results/Summary Column */}
          <div className="col-12 col-lg-4">
            <div className="premium-card p-4 p-md-5 h-100 bg-light">
              <h6 className="fw-bolder mb-4 text-uppercase text-muted d-flex align-items-center" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-clock-history me-2 fs-6"></i> Recently Added
              </h6>
              
              {createdParent ? (
                <div className="bg-white rounded-4 p-4 shadow-sm border animate-fade-in position-relative overflow-hidden">
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, transparent 100%)', pointerEvents: 'none' }}></div>
                  
                  <div className="position-relative z-1">
                    <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold text-white shadow-sm" style={{ width: 48, height: 48, background: '#4f46e5', fontSize: '1.2rem' }}>
                        {createdParent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-bolder fs-5 text-dark text-truncate lh-1 mb-1">{createdParent.name}</div>
                        <div className={`badge ${createdParent.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-secondary bg-opacity-10 text-secondary border border-secondary'} border-opacity-25 rounded-pill`}>
                          {createdParent.status}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-column gap-2 mb-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small fw-semibold"><i className="bi bi-hash me-1"></i> ID</span>
                        <span className="fw-bold text-dark font-monospace">{createdParent.parentId}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small fw-semibold"><i className="bi bi-envelope me-1"></i> Email</span>
                        <span className="fw-medium text-dark text-truncate ms-2" style={{ maxWidth: '150px' }}>{createdParent.email}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small fw-semibold"><i className="bi bi-telephone me-1"></i> Phone</span>
                        <span className="fw-medium text-dark">{createdParent.phone || "Not Provided"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="rounded-circle bg-white shadow-sm d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <i className="bi bi-person-fill text-muted opacity-50 fs-2"></i>
                  </div>
                  <p className="text-muted small fw-medium mb-0 px-3">No parent accounts have been created in this session yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}