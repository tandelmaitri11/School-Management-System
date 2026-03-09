import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { toast } from "react-toastify";

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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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

  // View-only page: removed payment actions

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
        const month = (r?.month || "").toLowerCase();
        return name.includes(q) || email.includes(q) || month.includes(q);
      });
  }, [records, search, statusFilter]);

  const badgeForStatus = (status) => {
    const s = status || "Pending";
    if (s === "Paid") return "text-bg-success";
    if (s === "Processing") return "text-bg-primary";
    if (s === "Failed") return "text-bg-danger";
    return "text-bg-warning";
  };

  return (
    <div className="container-xxl py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
        <div>
          <h3 className="mb-1 fw-bold text-primary">Teacher Salary Payouts</h3>
          <div className="text-muted">Pay salaries via Razorpay (test) or mark paid manually.</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={loadRecords}
            disabled={loading}
            title="Refresh"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <span className="badge bg-light text-dark border px-3 py-2">Payout Desk</span>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Total Records</div>
              <div className="fs-4 fw-bold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Paid</div>
              <div className="fs-4 fw-bold text-success">{stats.paid}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Processing</div>
              <div className="fs-4 fw-bold text-primary">{stats.processing}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Pending</div>
              <div className="fs-4 fw-bold text-warning">{stats.pending}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center justify-content-between">
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ minWidth: 280 }}>
                <span className="input-group-text">🔎</span>
                <input
                  className="form-control"
                  placeholder="Search teacher / email / month..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 200 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </select>

              <select
                className="form-select"
                style={{ width: 200 }}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-muted small">
              Showing <b>{filteredRecords.length}</b> records
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border" role="status" />
            <div className="text-muted mt-2">Loading salary records...</div>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div className="fs-5 fw-semibold">No records found</div>
            <div className="text-muted">Try changing search or filters.</div>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredRecords.map((r) => (
            <div className="col-12 col-md-6 col-xl-4" key={r._id}>
              <div
                className="card border-0 shadow-sm h-100"
                role="button"
                onClick={() =>
                  navigate("/teacher-salary-record", {
                    state: { teacherId: r.teacher?._id || null },
                  })
                }
              >
                <div className="card-body">
                  {/* Top */}
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle bg-light border d-flex align-items-center justify-content-center"
                        style={{ width: 44, height: 44, fontSize: 18 }}
                        title={r.teacher?.teacherName || "Teacher"}
                      >
                        {(r.teacher?.teacherName || "T").slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <div className="fw-bold">{r.teacher?.teacherName || "Teacher"}</div>
                        <div className="text-muted small">{r.teacher?.email || "-"}</div>
                      </div>
                    </div>

                    <span className={`badge ${badgeForStatus(r.payoutStatus || "Pending")}`}>
                      {r.payoutStatus || "Pending"}
                    </span>
                  </div>

                  <hr className="my-2" />

                  {/* Details */}
                  <div className="row g-2 small">
                    <div className="col-6">
                      <div className="text-muted">Mobile</div>
                      <div className="fw-semibold">{r.teacher?.mobile || "-"}</div>
                    </div>

                    <div className="col-6">
                      <div className="text-muted">Month</div>
                      <div className="fw-semibold">{r.month || "-"}</div>
                    </div>

                    <div className="col-6">
                      <div className="text-muted">Amount</div>
                      <div className="fw-semibold">₹{r.paidAmount || 0}</div>
                    </div>

                    <div className="col-6">
                      <div className="text-muted">Mode</div>
                      <div className="fw-semibold">{r.payoutMode || "-"}</div>
                    </div>

                    <div className="col-12">
                      <div className="text-muted">Reference</div>
                      <div className="fw-semibold text-truncate" title={r.payoutReferenceId || "-"}>
                        {r.payoutReferenceId || "-"}
                      </div>
                    </div>
                  </div>

                  {/* View-only */}
                  {r.payoutStatus === "Processing" && (
                    <div className="alert alert-primary py-2 px-3 mt-3 mb-0 small">
                      Payout is processing.
                    </div>
                  )}
                  {r.payoutStatus === "Paid" && (
                    <div className="alert alert-success py-2 px-3 mt-3 mb-0 small">
                      Salary payout completed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
