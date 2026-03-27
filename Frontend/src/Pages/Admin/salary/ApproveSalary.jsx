import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function SalaryApprove() {
  const [records, setRecords] = useState([]);
  const navigate = useNavigate();

  // UI-only states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Pending | Processing | Paid | Failed
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString("en-US", { month: "long" }) + " " + d.getFullYear();
  });
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  
  const monthOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [2025, currentYear];
    const uniqueYears = Array.from(new Set(years));
    return uniqueYears.flatMap((y) => months.map((m) => `${m} ${y}`));
  }, []);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/teacher-salary/all");
      setRecords(res.data);
    } catch (err) {
      console.error("Error loading salary records:", err);
      toast.error("Failed to load salary records.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI helpers ----------
  const stats = useMemo(() => {
    const total = records.length;
    const paid = records.filter((r) => r?.payoutStatus === "Paid").length;
    const processing = records.filter((r) => r?.payoutStatus === "Processing").length;
    const pending = records.filter((r) => !r?.payoutStatus || r?.payoutStatus === "Pending").length;
    return { total, paid, processing, pending };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (records || [])
      .filter((r) => (month ? r?.month === month : true))
      .filter((r) => {
        const ps = r?.payoutStatus || "Pending";
        if (statusFilter === "All") return true;
        return ps === statusFilter;
      })
      .filter((r) => {
        if (!q) return true;
        const name = (r?.teacher?.teacherName || "").toLowerCase();
        const email = (r?.teacher?.email || "").toLowerCase();
        const monthStr = (r?.month || "").toLowerCase();
        return name.includes(q) || email.includes(q) || monthStr.includes(q);
      });
  }, [records, search, statusFilter, month]);

  const getPayoutClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success bg-opacity-10 text-success border-success border-opacity-25";
      case "Processing":
        return "bg-info bg-opacity-10 text-info-emphasis border-info border-opacity-25";
      case "Failed":
        return "bg-danger bg-opacity-10 text-danger border-danger border-opacity-25";
      default:
        return "bg-warning bg-opacity-10 text-warning-emphasis border-warning border-opacity-50";
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-wallet2 me-1"></i> Payout Desk
            </span>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Salary Approvals</h2>
                <p className="text-white opacity-75 fw-medium mb-0">Pay salaries via Razorpay or mark records as paid manually.</p>
              </div>
              <button className="btn bg-white text-primary rounded-pill px-4 py-2 fw-bold shadow-sm transition-all" onClick={loadRecords} disabled={loading}>
                <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i> 
                {loading ? "Refreshing..." : "Refresh Records"}
              </button>
            </div>
          </div>
          
          {/* Glassmorphism Control Panel */}
          <div className="position-relative z-1 d-flex flex-column flex-lg-row gap-3 p-3 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            
            <div className="d-flex flex-grow-1 gap-2 flex-column flex-sm-row">
              <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3 py-1 flex-grow-1" style={{ minWidth: '200px' }}>
                <span className="small fw-bold text-white me-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Month:</span>
                <select
                  className="form-select input-premium py-2 bg-transparent text-white border-0 shadow-none fw-semibold"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="text-dark">All Months</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m} className="text-dark">{m}</option>
                  ))}
                </select>
              </div>

              <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3 py-1 flex-grow-1" style={{ minWidth: '180px' }}>
                <span className="small fw-bold text-white me-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Status:</span>
                <select
                  className="form-select input-premium py-2 bg-transparent text-white border-0 shadow-none fw-semibold"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All" className="text-dark">All Statuses</option>
                  <option value="Pending" className="text-dark">Pending</option>
                  <option value="Processing" className="text-dark">Processing</option>
                  <option value="Paid" className="text-dark">Paid</option>
                  <option value="Failed" className="text-dark">Failed</option>
                </select>
              </div>
            </div>

            <div className="position-relative" style={{ minWidth: "300px" }}>
              <i className="bi bi-search position-absolute text-white" style={{ top: '50%', transform: 'translateY(-50%)', left: '16px' }}></i>
              <input
                type="text"
                className="form-control input-premium w-100 bg-white bg-opacity-25 border-0 text-white placeholder-white"
                style={{ paddingLeft: '44px' }}
                placeholder="Search teacher, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="animate-fade-in">
          
          {/* KPI CARDS */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-secondary">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Records</div>
                    <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2rem' }}>{stats.total}</div>
                  </div>
                  <div className="rounded-circle bg-secondary bg-opacity-10 text-secondary d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    <i className="bi bi-folder2-open"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-md-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-success">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Paid</div>
                    <div className="fw-bolder text-success lh-1" style={{ fontSize: '2rem' }}>{stats.paid}</div>
                  </div>
                  <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-info">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Processing</div>
                    <div className="fw-bolder text-info-emphasis lh-1" style={{ fontSize: '2rem' }}>{stats.processing}</div>
                  </div>
                  <div className="rounded-circle bg-info bg-opacity-10 text-info-emphasis d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    <i className="bi bi-arrow-repeat"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-warning">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Pending</div>
                    <div className="fw-bolder text-warning-emphasis lh-1" style={{ fontSize: '2rem' }}>{stats.pending}</div>
                  </div>
                  <div className="rounded-circle bg-warning bg-opacity-10 text-warning-emphasis d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    <i className="bi bi-hourglass-split"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN RECORD CARDS */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-5 my-5 bg-white rounded-4 shadow-sm border border-dashed animate-fade-in">
              <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                <i className="bi bi-search text-muted opacity-50 display-6"></i>
              </div>
              <h4 className="fw-bolder text-dark mb-2">No Records Found</h4>
              <p className="text-muted fw-medium">Try adjusting your filters or search query.</p>
              <button 
                className="btn btn-outline-primary rounded-pill mt-2 fw-bold"
                onClick={() => { setSearch(""); setStatusFilter("All"); setMonth(""); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {filteredRecords.map((r) => (
                <div className="col-12 col-md-6 col-xl-4" key={r._id}>
                  <div
                    className="premium-card h-100 p-4 d-flex flex-column"
                    role="button"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate("/teacher-salary-record", {
                        state: { teacherId: r.teacher?._id || null },
                      })
                    }
                  >
                    {/* Header */}
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 text-primary fw-bolder shadow-sm border d-flex align-items-center justify-content-center"
                          style={{ width: 48, height: 48, fontSize: '1.2rem' }}
                        >
                          {(r.teacher?.teacherName || "T").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bolder text-dark text-truncate" style={{ maxWidth: '160px' }}>
                            {r.teacher?.teacherName || "Teacher"}
                          </div>
                          <div className="text-muted small fw-medium text-truncate" style={{ maxWidth: '160px' }}>
                            {r.teacher?.email || "No email"}
                          </div>
                        </div>
                      </div>
                      <span className={`badge border px-3 py-2 rounded-pill shadow-sm fw-bold ${getPayoutClass(r.payoutStatus || "Pending")}`}>
                        {r.payoutStatus || "Pending"}
                      </span>
                    </div>

                    {/* Data Grid */}
                    <div className="bg-light rounded-3 p-3 mb-3 flex-grow-1">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Month</div>
                          <div className="fw-semibold text-dark small">{r.month || "-"}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Amount</div>
                          <div className="fw-bolder text-success small">{formatMoney(r.paidAmount)}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Mobile</div>
                          <div className="fw-medium text-dark small">{r.teacher?.mobile || "-"}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Mode</div>
                          <div className="fw-medium text-dark small">{r.payoutMode || "-"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info / Alerts */}
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center border-top pt-3" style={{ borderColor: '#f1f5f9' }}>
                         <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Reference ID</div>
                         <div className="fw-medium text-dark font-monospace small text-truncate" style={{ maxWidth: '180px' }} title={r.payoutReferenceId || "-"}>
                            {r.payoutReferenceId || "Not Assigned"}
                         </div>
                      </div>

                      {r.payoutStatus === "Processing" && (
                        <div className="bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25 rounded-3 py-2 px-3 mt-3 small fw-bold text-center">
                          <i className="bi bi-arrow-repeat me-1 spin"></i> Payout is processing...
                        </div>
                      )}
                      {r.payoutStatus === "Paid" && (
                        <div className="bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-3 py-2 px-3 mt-3 small fw-bold text-center">
                          <i className="bi bi-check-circle me-1"></i> Salary payout completed
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Loading Overlay */}
        {loading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg border text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <h5 className="fw-bolder text-dark mb-1">Crunching Data...</h5>
              <p className="text-muted small fw-medium mb-0">Synchronizing salary records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}