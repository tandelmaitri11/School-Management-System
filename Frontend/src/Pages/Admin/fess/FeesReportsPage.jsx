import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

export default function FeesReportsPage() {
  const [className, setClassName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [classes, setClasses] = useState([]);

  const [classReport, setClassReport] = useState([]);
  const [classSummary, setClassSummary] = useState(null);
  const [monthReport, setMonthReport] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  };

  const escapeCsv = (v) => {
    const str = String(v ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadCsv = (filename, headers, rows) => {
    const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportClassWiseCsv = () => {
    if (!classReport.length) return showToast("error", "No class-wise records to export");
    const suffix = hasClassFilter ? `class-${className}` : "all-classes";
    const filename = `fees_class_wise_${suffix}.csv`;
    const headers = [
      "Class",
      "Students",
      "Total Fees",
      "Paid Amount",
      "Collected In Range",
      "Base Pending",
      "Late Fee Outstanding",
      "Total Due",
      "Transactions",
      "Cash Collected",
      "Online Collected",
    ];
    const rows = classReport.map((r) => [
      r.className,
      r.studentsCount,
      r.totalFees,
      r.paidAmount,
      r.collectedInRange,
      r.basePendingAmount,
      r.lateFeeOutstanding,
      r.totalDue,
      r.transactionsCount,
      r.cashCollected,
      r.onlineCollected,
    ]);
    if (classSummary) {
      rows.push([
        "TOTAL",
        classSummary.studentsCount || 0,
        classSummary.totalFees || 0,
        classSummary.paidAmount || 0,
        classSummary.collectedInRange || 0,
        classSummary.basePendingAmount || 0,
        classSummary.lateFeeOutstanding || 0,
        classSummary.totalDue || 0,
        classSummary.transactionsCount || 0,
        classSummary.cashCollected || 0,
        classSummary.onlineCollected || 0,
      ]);
    }
    downloadCsv(filename, headers, rows);
  };

  const exportMonthWiseCsv = () => {
    if (!monthReport.length) return showToast("error", "No month-wise records to export");
    const filename = `fees_month_wise_${year || new Date().getFullYear()}.csv`;
    const headers = ["Month", "Collected Amount", "Transactions", "Cash Collected", "Online Collected"];
    const rows = monthReport.map((r) => [
      r.month,
      r.collectedAmount,
      r.transactionsCount,
      r.cashCollected,
      r.onlineCollected,
    ]);
    if (monthSummary) {
      rows.push([
        "TOTAL",
        monthSummary.collectedAmount || 0,
        monthSummary.transactionsCount || 0,
        monthSummary.cashCollected || 0,
        monthSummary.onlineCollected || 0,
      ]);
    }
    downloadCsv(filename, headers, rows);
  };

  const hasClassFilter = useMemo(() => String(className || "").trim() !== "", [className]);

  const loadClasses = async () => {
    try {
      const res = await api.get("/api/fees/class-fee");
      const classValues = Array.from(
        new Set((res.data.classFees || []).map((r) => Number(r.className)).filter(Boolean))
      ).sort((a, b) => a - b);
      setClasses(classValues);
    } catch (_err) {
      setClasses([]);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);

      const classParams = {};
      if (fromDate) classParams.from = fromDate;
      if (toDate) classParams.to = toDate;
      if (hasClassFilter) classParams.className = Number(className);

      const monthParams = { year: Number(year || new Date().getFullYear()) };
      if (hasClassFilter) monthParams.className = Number(className);

      const [classRes, monthRes] = await Promise.all([
        api.get("/api/fees/reports/class-wise", { params: classParams }),
        api.get("/api/fees/reports/month-wise", { params: monthParams }),
      ]);

      setClassReport(classRes.data.classWise || []);
      setClassSummary(classRes.data.summary || null);
      setMonthReport(monthRes.data.monthWise || []);
      setMonthSummary(monthRes.data.summary || null);
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Error loading fee reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-3 px-md-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-bar-chart-line me-2 text-primary"></i>
            Fees Reports
          </h2>
          <div className="text-muted small">Class-wise and month-wise fee collections and dues.</div>
        </div>
      </div>

      {message.text && (
        <div
          className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow text-white ${
            message.type === "error" ? "bg-danger" : "bg-success"
          }`}
          style={{ zIndex: 1050 }}
        >
          {message.text}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted">Class</label>
              <select
                className="form-select"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small text-muted">From</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small text-muted">To</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small text-muted">Year</label>
              <input
                type="number"
                className="form-control"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <button className="btn btn-primary w-100" onClick={loadReports} disabled={loading}>
                {loading ? "Loading..." : "Apply Filters"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <div className="small text-muted">Students</div>
              <div className="fw-bold fs-4">{Number(classSummary?.studentsCount || 0)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <div className="small text-muted">Collected (Range)</div>
              <div className="fw-bold fs-4 text-success">
                {formatMoney(classSummary?.collectedInRange || 0)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <div className="small text-muted">Total Due</div>
              <div className="fw-bold fs-4 text-danger">{formatMoney(classSummary?.totalDue || 0)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body">
              <div className="small text-muted">Late Fee Outstanding</div>
              <div className="fw-bold fs-4">{formatMoney(classSummary?.lateFeeOutstanding || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Class-wise Report</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={exportClassWiseCsv}
                disabled={!classReport.length}
              >
                <i className="bi bi-download me-1"></i>
                Export CSV
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Class</th>
                    <th className="text-end">Students</th>
                    <th className="text-end">Collected</th>
                    <th className="text-end">Base Pending</th>
                    <th className="text-end">Late Fee</th>
                    <th className="text-end">Total Due</th>
                  </tr>
                </thead>
                <tbody>
                  {classReport.length ? (
                    classReport.map((r) => (
                      <tr key={r.className}>
                        <td className="fw-semibold">Class {r.className}</td>
                        <td className="text-end">{r.studentsCount}</td>
                        <td className="text-end text-success">{formatMoney(r.collectedInRange)}</td>
                        <td className="text-end">{formatMoney(r.basePendingAmount)}</td>
                        <td className="text-end">{formatMoney(r.lateFeeOutstanding)}</td>
                        <td className="text-end fw-bold text-danger">{formatMoney(r.totalDue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No class-wise records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Month-wise Collection</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={exportMonthWiseCsv}
                disabled={!monthReport.length}
              >
                <i className="bi bi-download me-1"></i>
                Export CSV
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Collected</th>
                    <th className="text-end">Txn</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReport.length ? (
                    monthReport.map((r) => (
                      <tr key={r.month}>
                        <td className="fw-semibold">{r.month}</td>
                        <td className="text-end text-success">{formatMoney(r.collectedAmount)}</td>
                        <td className="text-end">{r.transactionsCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
                        No month-wise records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card-footer bg-white">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Yearly Collected</span>
                <span className="fw-bold text-success">
                  {formatMoney(monthSummary?.collectedAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
