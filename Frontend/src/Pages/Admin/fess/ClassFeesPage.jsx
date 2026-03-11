import React, { useEffect, useState } from "react";
import api from "../../../api/api";
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
                    <select
                      className="form-select border-start-0 ps-0 bg-light"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id || c.className} value={c.className}>
                          Class {c.className}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-text small">Enter class number (1-12)</div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold text-uppercase">Stream (Optional)</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-diagram-3 text-muted"></i></span>
                    <select
                      className="form-select border-start-0 ps-0 bg-light"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      disabled={!className}
                    >
                      <option value="">General / No Stream</option>
                      {streamOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-text small">
                    Set different fees by stream for same class (mainly Class 11-12).
                  </div>
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

                <div className="row g-3 mb-2">
                  <div className="col-6">
                    <label className="form-label text-muted small fw-bold text-uppercase">Due Day (1-31)</label>
                    <input
                      type="number"
                      className="form-control bg-light"
                      min="1"
                      max="31"
                      placeholder="e.g. 10"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-muted small fw-bold text-uppercase">Grace Days</label>
                    <input
                      type="number"
                      className="form-control bg-light"
                      min="0"
                      value={graceDays}
                      onChange={(e) => setGraceDays(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-2">
                  <div className="col-12">
                    <label className="form-label text-muted small fw-bold text-uppercase">Late Fee Type</label>
                    <select
                      className="form-select bg-light"
                      value={lateFeeType}
                      onChange={(e) => setLateFeeType(e.target.value)}
                    >
                      <option value="flat">Flat</option>
                      <option value="daily">Daily</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label text-muted small fw-bold text-uppercase">
                      Late Fee Value {lateFeeType === "percent" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      type="number"
                      className="form-control bg-light"
                      min="0"
                      value={lateFeeValue}
                      onChange={(e) => setLateFeeValue(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-muted small fw-bold text-uppercase">Late Fee Cap (₹)</label>
                    <input
                      type="number"
                      className="form-control bg-light"
                      min="0"
                      value={lateFeeCap}
                      onChange={(e) => setLateFeeCap(e.target.value)}
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
        </div>

        {/* RIGHT COLUMN: LIST VIEW */}
        <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-dark">Current Fee Structure</h5>
                    <span className="badge bg-light text-secondary rounded-pill">{feesList.length} Records</span>
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
                                        <th className="py-3" style={{width: '25%'}}>Stream</th>
                                        <th className="py-3">Annual Fee</th>
                                        <th className="py-3">Due / Grace</th>
                                        <th className="py-3">Late Fee Rule</th>
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
                                            <td>
                                                {f.stream ? (
                                                  <span className="badge bg-info-subtle text-info-emphasis">{f.stream}</span>
                                                ) : (
                                                  <span className="text-muted">General</span>
                                                )}
                                            </td>
                                            <td className="fw-bold text-dark fs-5">
                                                {formatMoney(f.totalFees)}
                                            </td>
                                            <td className="small">
                                                Day {f.dueDay || "-"} / {Number(f.graceDays || 0)} days
                                            </td>
                                            <td className="small">{formatLateRule(f)}</td>
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
