import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap-icons/font/bootstrap-icons.css"; // Ensure icons are loaded

export default function ClassFeesPage() {
  const [className, setClassName] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [feesList, setFeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load all class fees
  const loadClassFees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/fees/class-fee");
      // Optional: Sort fees by class number for better display
      const sortedFees = (res.data.classFees || []).sort((a, b) => a.className - b.className);
      setFeesList(sortedFees);
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error fetching fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassFees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!className || !totalFees) {
      return showToast("error", "Please enter both class and fee amount");
    }

    try {
      const res = await api.post("/api/fees/class-fee", {
        className: Number(className),
        totalFees: Number(totalFees),
      });

      showToast("success", res.data.message || "Class fee configuration saved");
      setClassName("");
      setTotalFees("");
      loadClassFees();
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error saving class fee");
    }
  };

  // Fill form to edit
  const handleEdit = (fee) => {
    setClassName(fee.className);
    setTotalFees(fee.totalFees);
    // Scroll to top for better UX on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper for UI Feedback
  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Helper for Currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-3 px-md-5">
      
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          <i className="bi bi-gear-wide-connected text-primary me-2"></i> Fee Structure
        </h2>
        <p className="text-muted small">Configure annual tuition fees for each standard/class.</p>
      </div>

      {/* TOAST NOTIFICATION */}
      {message.text && (
        <div className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow text-white fade show ${message.type === 'error' ? 'bg-danger' : 'bg-success'}`} style={{ zIndex: 1050 }}>
          <div className="d-flex align-items-center">
            <i className={`bi ${message.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2 fs-5`}></i>
            <div>{message.text}</div>
          </div>
        </div>
      )}

      <div className="row g-4">
        
        {/* LEFT COLUMN: INPUT FORM */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
               <h5 className="fw-bold mb-0 text-primary">
                  <i className="bi bi-pencil-square me-2"></i> 
                  {className ? "Edit Fee Structure" : "Set New Fee"}
               </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold text-uppercase">Standard / Class</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-mortarboard text-muted"></i></span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="form-control border-start-0 ps-0 bg-light"
                      placeholder="e.g. 10"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </div>
                  <div className="form-text small">Enter class number (1-12)</div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold text-uppercase">Total Annual Fee</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-cash-stack text-muted"></i></span>
                    <input
                      type="number"
                      className="form-control border-start-0 ps-0 bg-light"
                      placeholder="e.g. 25000"
                      value={totalFees}
                      onChange={(e) => setTotalFees(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-grid mt-5">
                  <button type="submit" className="btn btn-primary btn-lg rounded-3 shadow-sm">
                    <i className="bi bi-save2 me-2"></i> Save Configuration
                  </button>
                  {className && (
                    <button 
                        type="button" 
                        className="btn btn-link text-muted mt-2 text-decoration-none"
                        onClick={() => { setClassName(""); setTotalFees(""); }}
                    >
                        Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIST VIEW */}
        <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-dark">Current Fee Structure</h5>
                    <span className="badge bg-light text-secondary rounded-pill">{feesList.length} Classes Configured</span>
                </div>
                
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted small">Loading records...</p>
                        </div>
                    ) : feesList.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-clipboard-x display-4 opacity-25 mb-3 d-block"></i>
                            No fee structures found. Add one to get started.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-secondary small text-uppercase">
                                    <tr>
                                        <th className="ps-4 py-3" style={{width: '20%'}}>Class</th>
                                        <th className="py-3">Annual Fee</th>
                                        <th className="text-end pe-4 py-3" style={{width: '20%'}}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feesList.map((f) => (
                                        <tr key={f._id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '35px', height: '35px'}}>
                                                        <span className="fw-bold small">{f.className}</span>
                                                    </div>
                                                    <span className="fw-semibold text-dark">Class {f.className}</span>
                                                </div>
                                            </td>
                                            <td className="fw-bold text-dark fs-5">
                                                {formatMoney(f.totalFees)}
                                            </td>
                                            <td className="text-end pe-4">
                                                <button 
                                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                                    onClick={() => handleEdit(f)}
                                                    title="Edit this record"
                                                >
                                                    <i className="bi bi-pencil me-1"></i> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
