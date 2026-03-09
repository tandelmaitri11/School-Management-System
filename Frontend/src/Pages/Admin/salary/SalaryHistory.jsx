import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { toast } from "react-toastify";

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

  // Badge helpers
  const getStatusClass = (status) =>
    status === "Paid"
      ? "badge text-bg-success"
      : "badge text-bg-danger";

  const getPayoutClass = (status) => {
    switch (status) {
      case "Paid":
        return "badge text-bg-success";
      case "Processing":
        return "badge text-bg-info";
      case "Failed":
        return "badge text-bg-danger";
      default:
        return "badge text-bg-secondary";
    }
  };

  // Filtering (no Pending / Approved)
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

  // Stats (clean)
  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const paid = filteredHistory.filter((r) => r.status === "Paid").length;
    const pending = filteredHistory.filter(
      (r) => !r?.payoutStatus || r?.payoutStatus === "Pending"
    ).length;
    return { total, paid, pending };
  }, [filteredHistory]);

  return (
    <div className="container-xxl py-4">
      {/* Header */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between">
          <div>
            <h3 className="fw-bold text-primary">Salary History</h3>
            <div className="text-muted">Final salary records (read only)</div>
          </div>
          <button className="btn btn-outline-secondary" onClick={fetchSalaryHistory}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body row g-3 align-items-end">
          <div className="col-md-4">
            <label className="fw-semibold">Month</label>
            <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All Months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="fw-semibold">Search</label>
            <input
              className="form-control"
              placeholder="Teacher / email / reference"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label className="fw-semibold">Payout Status</label>
            <select
              className="form-select"
              value={payoutFilter}
              onChange={(e) => setPayoutFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted">Total Records</div>
              <div className="fs-4 fw-bold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted">Paid</div>
              <div className="fs-4 fw-bold text-success">{stats.paid}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted">Pending</div>
              <div className="fs-4 fw-bold text-warning">{stats.pending}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Teacher</th>
                <th>Month</th>
                <th className="text-end">Amount</th>
                <th>Status</th>
                <th>Payout</th>
                <th>Mode</th>
                <th>Reference</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td>{r.teacher?.teacherName}</td>
                  <td>{r.month}</td>
                  <td className="text-end">₹{r.paidAmount}</td>
                  <td><span className={getStatusClass(r.status)}>{r.status}</span></td>
                  <td><span className={getPayoutClass(r.payoutStatus)}>{r.payoutStatus || "Pending"}</span></td>
                  <td>{r.payoutMode || "-"}</td>
                  <td className="text-truncate" style={{ maxWidth: 150 }}>
                    {r.payoutReferenceId || "-"}
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>-</td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center text-muted py-4">
                    No salary records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
