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
  
  const [studentReport, setStudentReport] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");

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
      "Class", "Students", "Total Fees", "Paid Amount", "Collected In Range",
      "Base Pending", "Late Fee Outstanding", "Total Due", "Transactions",
      "Cash Collected", "Online Collected",
    ];
    const rows = classReport.map((r) => [
      r.className, r.studentsCount, r.totalFees, r.paidAmount, r.collectedInRange,
      r.basePendingAmount, r.lateFeeOutstanding, r.totalDue, r.transactionsCount,
      r.cashCollected, r.onlineCollected,
    ]);
    if (classSummary) {
      rows.push([
        "TOTAL", classSummary.studentsCount || 0, classSummary.totalFees || 0,
        classSummary.paidAmount || 0, classSummary.collectedInRange || 0,
        classSummary.basePendingAmount || 0, classSummary.lateFeeOutstanding || 0,
        classSummary.totalDue || 0, classSummary.transactionsCount || 0,
        classSummary.cashCollected || 0, classSummary.onlineCollected || 0,
      ]);
    }
    downloadCsv(filename, headers, rows);
  };

  const exportMonthWiseCsv = () => {
    if (!monthReport.length) return showToast("error", "No month-wise records to export");
    const filename = `fees_month_wise_${year || new Date().getFullYear()}.csv`;
    const headers = ["Month", "Collected Amount", "Transactions", "Cash Collected", "Online Collected"];
    const rows = monthReport.map((r) => [
      r.month, r.collectedAmount, r.transactionsCount, r.cashCollected, r.onlineCollected,
    ]);
    if (monthSummary) {
      rows.push([
        "TOTAL", monthSummary.collectedAmount || 0, monthSummary.transactionsCount || 0,
        monthSummary.cashCollected || 0, monthSummary.onlineCollected || 0,
      ]);
    }
    downloadCsv(filename, headers, rows);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentReport;
    const lowerQuery = searchQuery.toLowerCase();
    return studentReport.filter((student) => 
      (student.studentName || "").toLowerCase().includes(lowerQuery)
    );
  }, [studentReport, searchQuery]);

  const exportStudentWiseCsv = () => {
    if (!filteredStudents.length) return showToast("error", "No student records to export");
    const suffix = hasClassFilter ? `class-${className}` : "all-classes";
    const filename = `fees_student_wise_${suffix}.csv`;
    const headers = ["Student Name", "Class", "Total Fees", "Paid Amount", "Pending Due", "Status"];
    const rows = filteredStudents.map((r) => [
      r.studentName,
      r.className,
      r.totalFees,
      r.paidAmount,
      r.totalDue,
      r.totalDue > 0 ? "Pending" : "Fully Paid"
    ]);
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

      const [classRes, monthRes, studentRes] = await Promise.all([
        api.get("/api/fees/reports/class-wise", { params: classParams }),
        api.get("/api/fees/reports/month-wise", { params: monthParams }),
        api.get("/api/fees/reports/student-wise", { params: classParams }),
      ]);

      const rawClassWise = classRes.data.classWise || [];
      const rawClassSummary = classRes.data.summary || {
        studentsCount: 0, totalFees: 0, paidAmount: 0, collectedInRange: 0,
        basePendingAmount: 0, lateFeeOutstanding: 0, totalDue: 0,
        transactionsCount: 0, cashCollected: 0, onlineCollected: 0
      };
      
      const allStudents = studentRes.data.studentWise || [];

      // ==========================================
      // FIX: OVERRIDE CLASS-WISE WITH TRUE DATA
      // ==========================================
      
      // 1. Calculate true stats per class using the full student list
      const classStats = {};
      allStudents.forEach(s => {
        if (!classStats[s.className]) {
          classStats[s.className] = { count: 0, totalFees: 0, paid: 0, due: 0 };
        }
        classStats[s.className].count += 1;
        classStats[s.className].totalFees += (s.totalFees || 0);
        classStats[s.className].paid += (s.paidAmount || 0);
        classStats[s.className].due += (s.totalDue || 0);
      });

      // 2. Map existing backend data and inject the accurate student counts & totals
      const existingClassNames = new Set();
      const patchedClassWise = rawClassWise.map(cls => {
        existingClassNames.add(String(cls.className));
        const stats = classStats[cls.className];
        return {
          ...cls,
          studentsCount: stats ? stats.count : cls.studentsCount,
          totalFees: stats ? stats.totalFees : cls.totalFees,
          paidAmount: stats ? stats.paid : cls.paidAmount,
          totalDue: stats ? stats.due : cls.totalDue,
          basePendingAmount: stats ? stats.due - (cls.lateFeeOutstanding || 0) : cls.basePendingAmount
        };
      });

      // 3. Add any classes that were completely missing because nobody paid yet
      Object.keys(classStats).forEach(cName => {
        if (!existingClassNames.has(String(cName))) {
          const stats = classStats[cName];
          patchedClassWise.push({
            className: Number(cName),
            studentsCount: stats.count,
            totalFees: stats.totalFees,
            paidAmount: stats.paid,
            totalDue: stats.due,
            basePendingAmount: stats.due, 
            lateFeeOutstanding: 0,
            collectedInRange: 0,
            transactionsCount: 0,
            cashCollected: 0,
            onlineCollected: 0
          });
        }
      });

      // 4. Sort table cleanly by Class Name
      patchedClassWise.sort((a, b) => Number(a.className) - Number(b.className));

      // 5. Override the top KPI summary with true global counts
      const patchedSummary = {
        ...rawClassSummary,
        studentsCount: allStudents.length,
        totalFees: Object.values(classStats).reduce((sum, st) => sum + st.totalFees, 0),
        paidAmount: Object.values(classStats).reduce((sum, st) => sum + st.paid, 0),
        totalDue: Object.values(classStats).reduce((sum, st) => sum + st.due, 0),
      };

      // Set the patched data to the UI
      setClassReport(patchedClassWise);
      setClassSummary(patchedSummary);
      setMonthReport(monthRes.data.monthWise || []);
      setMonthSummary(monthRes.data.summary || null);
      setStudentReport(allStudents);

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
          <div className="text-muted small">Class-wise, month-wise, and student-wise fee collections and dues.</div>
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

      {/* FILTERS */}
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
                  <option key={c} value={c}>Class {c}</option>
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

      {/* KPI CARDS */}
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

      <div className="row g-4 mb-4">
        {/* CLASS-WISE REPORT */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Class-wise Report</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={exportClassWiseCsv}
                disabled={!classReport.length}
              >
                <i className="bi bi-download me-1"></i> Export CSV
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
                        <td className="text-end fw-bold">{r.studentsCount}</td>
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

        {/* MONTH-WISE REPORT */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Month-wise Collection</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={exportMonthWiseCsv}
                disabled={!monthReport.length}
              >
                <i className="bi bi-download me-1"></i> Export CSV
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

      {/* STUDENT-WISE REPORT WITH SEARCH */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <h5 className="mb-0 fw-bold">Student-wise Payment Status</h5>
              <div className="d-flex gap-2 align-items-center">
                <div className="input-group input-group-sm" style={{ maxWidth: "250px" }}>
                  <span className="input-group-text bg-white text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-nowrap"
                  onClick={exportStudentWiseCsv}
                  disabled={!filteredStudents.length}
                >
                  <i className="bi bi-download me-1"></i> Export CSV
                </button>
              </div>
            </div>
            
            <div className="table-responsive" style={{ maxHeight: "400px" }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                  <tr>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th className="text-end">Total Fees</th>
                    <th className="text-end">Paid Amount</th>
                    <th className="text-end">Pending Due</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length ? (
                    filteredStudents.map((r, index) => (
                      <tr key={r.studentId || index}>
                        <td className="fw-semibold">{r.studentName}</td>
                        <td>Class {r.className}</td>
                        <td className="text-end">{formatMoney(r.totalFees)}</td>
                        <td className="text-end text-success fw-semibold">{formatMoney(r.paidAmount)}</td>
                        <td className="text-end text-danger fw-bold">{formatMoney(r.totalDue)}</td>
                        <td className="text-center">
                          {r.totalDue > 0 ? (
                            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">Pending</span>
                          ) : (
                            <span className="badge bg-success px-3 py-2 rounded-pill">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        {searchQuery 
                          ? `No student found matching "${searchQuery}"` 
                          : "No student records found for the selected filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}