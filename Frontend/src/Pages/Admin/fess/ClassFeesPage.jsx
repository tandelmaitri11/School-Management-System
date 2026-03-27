import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // Ensure icons are loaded

export default function ClassFeesPage() {
  const [className, setClassName] = useState("");
  const [stream, setStream] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [graceDays, setGraceDays] = useState("0");
  const [lateFeeType, setLateFeeType] = useState("flat");
  const [lateFeeValue, setLateFeeValue] = useState("0");
  const [lateFeeCap, setLateFeeCap] = useState("0");
  const [feesList, setFeesList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streamOptions, setStreamOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load all class fees
  const loadClassFees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/fees/class-fee");
      // Sort by class then stream for stable display
      const sortedFees = (res.data.classFees || []).sort((a, b) => {
        const byClass = Number(a.className) - Number(b.className);
        if (byClass !== 0) return byClass;
        return String(a.stream || "").localeCompare(String(b.stream || ""));
      });
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

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        const sorted = (res.data || []).sort((a, b) => Number(a.className) - Number(b.className));
        setClasses(sorted);
      } catch (err) {
        setClasses([]);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!className) {
      setStreamOptions([]);
      setStream("");
      return;
    }

    const selected = classes.find((c) => String(c.className) === String(className));
    const options = (selected?.streams || [])
      .filter((s) => s?.isActive !== false && s?.name)
      .map((s) => String(s.name).trim())
      .filter(Boolean);
    setStreamOptions(options);

    if (!options.length) {
      setStream("");
    } else if (stream && !options.includes(stream)) {
      setStream("");
    }
  }, [className, classes, stream]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!className || !totalFees) {
      return showToast("error", "Please enter both class and fee amount");
    }

    try {
      const res = await api.post("/api/fees/class-fee", {
        className: Number(className),
        stream: stream || "",
        totalFees: Number(totalFees),
        dueDay: dueDay ? Number(dueDay) : null,
        graceDays: Number(graceDays || 0),
        lateFeeType,
        lateFeeValue: Number(lateFeeValue || 0),
        lateFeeCap: Number(lateFeeCap || 0),
      });

      showToast("success", res.data.message || "Class fee configuration saved");
      setClassName("");
      setStream("");
      setTotalFees("");
      setDueDay("");
      setGraceDays("0");
      setLateFeeType("flat");
      setLateFeeValue("0");
      setLateFeeCap("0");
      loadClassFees();
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error saving class fee");
    }
  };

  // Fill form to edit
  const handleEdit = (fee) => {
    setClassName(fee.className);
    setStream(fee.stream || "");
    setTotalFees(fee.totalFees);
    setDueDay(fee.dueDay ?? "");
    setGraceDays(String(fee.graceDays ?? 0));
    setLateFeeType(fee.lateFeeType || "flat");
    setLateFeeValue(String(fee.lateFeeValue ?? 0));
    setLateFeeCap(String(fee.lateFeeCap ?? 0));
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

  const formatLateRule = (f) => {
    const type = String(f?.lateFeeType || "flat");
    const value = Number(f?.lateFeeValue || 0);
    const cap = Number(f?.lateFeeCap || 0);
    if (value <= 0) return "No late fee";
    const typeText = type === "daily" ? `${formatMoney(value)}/day` : type === "percent" ? `${value}%` : formatMoney(value);
    return cap > 0 ? `${typeText} (cap ${formatMoney(cap)})` : typeText;
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        
        .input-group-premium .input-group-text { background: #f8fafc; border: 1px solid #e2e8f0; border-right: none; border-radius: 10px 0 0 10px; color: #64748b; }
        .input-group-premium .form-control { border-left: none; border-radius: 0 10px 10px 0; }
        .input-group-premium .form-control:focus { border-left: none; }
        .input-group-premium:focus-within .input-group-text { border-color: #4f46e5; background: #ffffff; color: #4f46e5; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .premium-toast { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); color: white; border-radius: 50rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: opacity 0.3s, transform 0.3s; }
        .premium-toast.bg-danger { background: rgba(225, 29, 72, 0.9) !important; }
      `}</style>

      {/* Floating Toast Notification */}
      <div className="toast-container position-fixed top-0 end-0 p-4 mt-2" style={{ zIndex: 1200 }}>
        <div className={`toast premium-toast border-0 ${message.text ? 'show' : 'hide'} ${message.type === 'error' ? 'bg-danger' : ''}`} role="alert">
          <div className="d-flex align-items-center px-4 py-3">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-white'} fs-5 me-3`}></i>
            <div className="fw-medium me-4">{message.text}</div>
            <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setMessage({ type: "", text: "" })}></button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-wallet2 me-1"></i> Financial Administration
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Fee Structure</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Configure annual tuition fees and late payment rules for each class.</p>
            </div>
          </div>
        </div>

        <div className="row g-4">
          
          {/* LEFT COLUMN: INPUT FORM */}
          <div className="col-12 col-xl-4">
            <div className="premium-card p-4 p-md-5 h-100 position-sticky" style={{ top: '20px' }}>
              <h5 className="fw-bolder mb-4 d-flex align-items-center pb-3 border-bottom" style={{ color: '#0f172a' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                  <i className="bi bi-pencil-square"></i>
                </div>
                {className ? "Edit Structure" : "New Structure"}
              </h5>
              
              <form onSubmit={handleSubmit} className="animate-fade-in">
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Standard / Class</label>
                  <div className="input-group input-group-premium">
                    <span className="input-group-text"><i className="bi bi-mortarboard-fill"></i></span>
                    <select
                      className="form-select input-premium py-2"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    >
                      <option value="">Select Class...</option>
                      {classes.map((c) => (
                        <option key={c._id || c.className} value={c.className}>Class {c.className}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Stream Filter (Optional)</label>
                  <div className="input-group input-group-premium">
                    <span className="input-group-text"><i className="bi bi-diagram-3-fill"></i></span>
                    <select
                      className="form-select input-premium py-2"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      disabled={!className || streamOptions.length === 0}
                    >
                      <option value="">Core / No Stream</option>
                      {streamOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {className && streamOptions.length === 0 && (
                    <div className="form-text small fw-medium mt-1"><i className="bi bi-info-circle me-1"></i>No streams defined for this class.</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Annual Fee</label>
                  <div className="input-group input-group-premium">
                    <span className="input-group-text"><i className="bi bi-currency-rupee text-dark fw-bold"></i></span>
                    <input
                      type="number"
                      className="form-control input-premium py-2 fw-bolder fs-5 text-primary"
                      placeholder="0"
                      value={totalFees}
                      onChange={(e) => setTotalFees(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Due Day (1-31)</label>
                    <input
                      type="number"
                      className="form-control input-premium py-2 text-center fw-bold"
                      min="1" max="31"
                      placeholder="e.g. 10"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Grace Days</label>
                    <input
                      type="number"
                      className="form-control input-premium py-2 text-center fw-bold"
                      min="0"
                      value={graceDays}
                      onChange={(e) => setGraceDays(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-3 bg-light rounded-4 border mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-exclamation-circle-fill text-warning me-2"></i>
                    <h6 className="fw-bolder m-0 text-dark" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Late Fee Rules</h6>
                  </div>
                  
                  <div className="mb-3">
                    <select
                      className="form-select input-premium py-2 bg-white"
                      value={lateFeeType}
                      onChange={(e) => setLateFeeType(e.target.value)}
                    >
                      <option value="flat">Flat Amount</option>
                      <option value="daily">Daily Accumulation</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Penalty Value</label>
                      <input
                        type="number"
                        className="form-control input-premium py-2 bg-white"
                        min="0"
                        value={lateFeeValue}
                        onChange={(e) => setLateFeeValue(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Maximum Cap (₹)</label>
                      <input
                        type="number"
                        className="form-control input-premium py-2 bg-white"
                        min="0"
                        value={lateFeeCap}
                        onChange={(e) => setLateFeeCap(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-brand btn-lg rounded-pill shadow-sm">
                    <i className="bi bi-shield-check me-2"></i> Save Configuration
                  </button>
                  {className && (
                    <button 
                        type="button" 
                        className="btn bg-light border text-muted fw-bold rounded-pill py-2 mt-2"
                        onClick={() => {
                          setClassName("");
                          setStream("");
                          setTotalFees("");
                          setDueDay("");
                          setGraceDays("0");
                          setLateFeeType("flat");
                          setLateFeeValue("0");
                          setLateFeeCap("0");
                        }}
                    >
                        Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: LIST VIEW */}
          <div className="col-12 col-xl-8">
            <div className="premium-card h-100 d-flex flex-column overflow-hidden">
              <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                  <i className="bi bi-table text-primary me-2"></i> Current Structures
                </h5>
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold shadow-sm">
                  {feesList.length} Active Records
                </span>
              </div>
              
              <div className="flex-grow-1 p-0 m-0">
                {loading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
                    <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
                    <p className="mt-3 text-muted fw-medium">Loading Financial Data...</p>
                  </div>
                ) : feesList.length === 0 ? (
                  <div className="text-center py-5 my-5 animate-fade-in">
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                      <i className="bi bi-clipboard-x text-muted opacity-50 display-6"></i>
                    </div>
                    <h5 className="fw-bolder text-dark mb-2">No Fee Structures Found</h5>
                    <p className="text-muted fw-medium">Use the configuration panel to define class fees.</p>
                  </div>
                ) : (
                  <div className="table-responsive border-0">
                    <table className="table table-premium align-middle mb-0 w-100">
                      <thead>
                        <tr>
                          <th className="ps-4" style={{ width: '20%' }}>Class</th>
                          <th style={{ width: '20%' }}>Stream</th>
                          <th>Annual Fee</th>
                          <th>Due / Grace</th>
                          <th>Late Fee Rule</th>
                          <th className="text-end pe-4" style={{ width: '15%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feesList.map((f) => (
                          <tr key={f._id} className="animate-fade-in">
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary fw-bolder shadow-sm border me-3" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                                  {f.className}
                                </div>
                                <span className="fw-bolder text-dark">Class {f.className}</span>
                              </div>
                            </td>
                            <td>
                              {f.stream ? (
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill fw-semibold">{f.stream}</span>
                              ) : (
                                <span className="text-muted small fw-medium fst-italic">Core / General</span>
                              )}
                            </td>
                            <td>
                              <div className="fw-bolder fs-5 text-dark lh-1">
                                {formatMoney(f.totalFees)}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <span className="small fw-bolder text-dark d-flex align-items-center"><i className="bi bi-calendar-check text-muted me-2"></i> Day {f.dueDay || "-"}</span>
                                <span className="small fw-medium text-muted d-flex align-items-center"><i className="bi bi-hourglass-split text-muted me-2"></i> {Number(f.graceDays || 0)} Days</span>
                              </div>
                            </td>
                            <td>
                              <div className="small fw-bold text-danger bg-danger bg-opacity-10 px-2 py-1 rounded d-inline-block">
                                {formatLateRule(f)}
                              </div>
                            </td>
                            <td className="text-end pe-4">
                              <button 
                                className="btn btn-sm bg-light border text-primary fw-bold rounded-pill px-3 shadow-sm transition-all"
                                onClick={() => handleEdit(f)}
                                title="Edit Configuration"
                              >
                                <i className="bi bi-pencil-square me-1"></i> Edit
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
    </div>
  );
}