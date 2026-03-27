import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Month dropdown options
const generateMonthOptions = (yearsBack = 1, yearsForward = 1) => {
  const options = [];
  const now = new Date();

  for (let y = now.getFullYear() - yearsBack; y <= now.getFullYear() + yearsForward; y++) {
    for (let m = 0; m < 12; m++) {
      const date = new Date(y, m, 1);
      options.push(
        date.toLocaleString("en-US", { month: "long", year: "numeric" })
      );
    }
  }
  return options;
};

export default function SalaryHistory() {
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString("en-US", { month: "long" }) + " " + d.getFullYear();
  });

  // UI only
  const [search, setSearch] = useState("");
  const [payoutFilter, setPayoutFilter] = useState("All"); // All | Paid | Processing | Failed

  const monthOptions = useMemo(() => generateMonthOptions(1, 1), []);

  const fetchSalaryHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/teacher-salary/all");
      setSalaryHistory(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load salary history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryHistory();
  }, []);

  const getPayoutClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
      case "Processing":
        return "bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25";
      case "Failed":
        return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
      default:
        return "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50";
    }
  };

  // Filtering
  const filteredHistory = useMemo(() => {
    const q = search.toLowerCase();

    return salaryHistory
      .filter((r) => (month ? r.month === month : true))
      .filter((r) =>
        payoutFilter === "All"
          ? true
          : (r.payoutStatus || "Pending") === payoutFilter
      )
      .filter((r) => {
        if (!q) return true;
        return (
          r.teacher?.teacherName?.toLowerCase().includes(q) ||
          r.teacher?.email?.toLowerCase().includes(q) ||
          r.payoutReferenceId?.toLowerCase().includes(q)
        );
      });
  }, [salaryHistory, month, payoutFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const paid = filteredHistory.filter((r) => r.payoutStatus === "Paid").length;
    const pending = filteredHistory.filter(
      (r) => !r?.payoutStatus || r?.payoutStatus === "Pending" || r?.payoutStatus === "Processing"
    ).length;
    return { total, paid, pending };
  }, [filteredHistory]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .search-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px 10px 40px; font-weight: 500; color: #0f172a; transition: all 0.2s; width: 100%; }
        .search-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
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
              <i className="bi bi-clock-history me-1"></i> Financial Administration
            </span>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Salary Ledger</h2>
                <p className="text-white opacity-75 fw-medium mb-0">Historical overview of all processed faculty payments.</p>
              </div>
              <button className="btn bg-white text-primary rounded-pill px-4 py-2 fw-bold shadow-sm transition-all" onClick={fetchSalaryHistory} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-2"></i> Sync Data
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
                  style={{ colorScheme: 'dark' }} // Attempt to style options dropdown arrow
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
                  value={payoutFilter}
                  onChange={(e) => setPayoutFilter(e.target.value)}
                >
                  <option value="All" className="text-dark">All Statuses</option>
                  <option value="Paid" className="text-dark">Paid</option>
                  <option value="Pending" className="text-dark">Pending</option>
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
                placeholder="Search name, email, or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="animate-fade-in">
          
          {/* KPI CARDS */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-4">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-primary">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Records</div>
                    <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.5rem' }}>{stats.total}</div>
                  </div>
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                </div>
                <div className="text-muted small mt-3 fw-medium">Filtered query results</div>
              </div>
            </div>
            
            <div className="col-12 col-md-4">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-success">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Settled Payments</div>
                    <div className="fw-bolder text-success lh-1" style={{ fontSize: '2.5rem' }}>{stats.paid}</div>
                  </div>
                  <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                </div>
                <div className="text-muted small mt-3 fw-medium">Successfully processed</div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-warning">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Pending Payouts</div>
                    <div className="fw-bolder text-warning-emphasis lh-1" style={{ fontSize: '2.5rem' }}>{stats.pending}</div>
                  </div>
                  <div className="rounded-circle bg-warning bg-opacity-10 text-warning-emphasis d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                    <i className="bi bi-hourglass-split"></i>
                  </div>
                </div>
                <div className="text-muted small mt-3 fw-medium">Awaiting processing</div>
              </div>
            </div>
          </div>

          {/* MAIN DATA TABLE */}
          <div className="premium-card overflow-hidden">
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                <i className="bi bi-table text-primary me-2"></i> Payout Roster
              </h5>
            </div>
            
            <div className="table-responsive flex-grow-1 custom-scroll" style={{ maxHeight: "600px" }}>
              <table className="table table-premium align-middle mb-0 w-100">
                <thead className="sticky-top z-1 shadow-sm">
                  <tr>
                    <th className="ps-4">Teacher Information</th>
                    <th>Salary Month</th>
                    <th className="text-end">Base Amount</th>
                    <th className="text-center">Payout Status</th>
                    <th className="text-center">Method</th>
                    <th>Reference / UTR</th>
                    <th className="pe-4 text-end">Record Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                          <i className="bi bi-clipboard-x text-muted opacity-50 display-6"></i>
                        </div>
                        <h5 className="fw-bolder text-dark mb-2">No Records Found</h5>
                        <p className="text-muted fw-medium">Adjust your filters or search query to view history.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((r) => (
                      <tr key={r._id} className="animate-fade-in">
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary fw-bolder shadow-sm border" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                              {(r.teacher?.teacherName || "T").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bolder text-dark lh-sm mb-1">{r.teacher?.teacherName || "Unknown"}</div>
                              <div className="small text-muted fw-medium" style={{ fontSize: '0.75rem' }}>{r.teacher?.email || "No Email"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-bold text-dark">{r.month}</span>
                        </td>
                        <td className="text-end">
                          <div className="fw-bolder fs-5 text-dark lh-1">
                            {formatMoney(r.paidAmount)}
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`badge rounded-pill px-3 py-2 fw-bold shadow-sm ${getPayoutClass(r.payoutStatus || "Pending")}`}>
                            {r.payoutStatus || "Pending"}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-secondary border px-2 py-1 fw-semibold">
                            {r.payoutMode || "—"}
                          </span>
                        </td>
                        <td>
                          {r.payoutReferenceId ? (
                            <div className="fw-medium text-dark font-monospace small text-truncate" style={{ maxWidth: '180px' }} title={r.payoutReferenceId}>
                              {r.payoutReferenceId}
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">—</span>
                          )}
                        </td>
                        <td className="pe-4 text-end">
                          <div className="fw-semibold text-secondary">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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