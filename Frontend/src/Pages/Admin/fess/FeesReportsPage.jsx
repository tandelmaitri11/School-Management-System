import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 600; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .search-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 16px 8px 40px; font-weight: 500; color: #0f172a; transition: all 0.2s; width: 100%; }
        .search-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        
        .btn-brand { background: #ffffff; color: #4f46e5; border: none; transition: all 0.2s; font-weight: 700; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
        .btn-brand:disabled { opacity: 0.8; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .premium-toast { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); color: white; border-radius: 50rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: opacity 0.3s, transform 0.3s; }
        .premium-toast.bg-danger { background: rgba(225, 29, 72, 0.9) !important; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-graph-up me-1"></i> Financial Reporting
            </span>
            <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Fees Dashboard</h2>
            <p className="text-white opacity-75 fw-medium mb-0">Class-wise, month-wise, and student-wise fee collections and dues.</p>
          </div>
          
          {/* Glassmorphism Control Panel */}
          <div className="position-relative z-1 d-flex flex-column flex-lg-row gap-3 p-3 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            
            <div className="d-flex flex-grow-1 gap-2">
              <select
                className="form-select input-premium py-2 border-0"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>

              <div className="d-flex align-items-center bg-white rounded-3 px-2 flex-grow-1" style={{ maxWidth: '350px' }}>
                <input
                  type="date"
                  className="form-control border-0 shadow-none bg-transparent fw-medium px-1"
                  style={{ fontSize: '0.9rem' }}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <span className="text-muted small fw-bold px-1 d-none d-md-inline">TO</span>
                <input
                  type="date"
                  className="form-control border-0 shadow-none bg-transparent fw-medium px-1"
                  style={{ fontSize: '0.9rem' }}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <input
                type="number"
                className="form-control input-premium py-2 border-0 text-center"
                min="2000" max="2100"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ width: '100px' }}
              />
            </div>

            <button className="btn btn-brand rounded-3 px-4 py-2 text-nowrap shadow-sm" onClick={loadReports} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-funnel-fill me-2"></i>}
              Analyze Data
            </button>
          </div>
        </div>

        <div className="animate-fade-in">
          
          {/* KPI CARDS */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-primary">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Students</div>
                <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.5rem' }}>{Number(classSummary?.studentsCount || 0)}</div>
                <div className="text-muted small mt-2 fw-medium">Analyzed in view</div>
              </div>
            </div>
            
            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-success">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Collected (Range)</div>
                <div className="fw-bolder text-success lh-1" style={{ fontSize: '2.2rem' }}>{formatMoney(classSummary?.collectedInRange || 0)}</div>
                <div className="text-muted small mt-2 fw-medium">Realized revenue</div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-danger">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Due</div>
                <div className="fw-bolder text-danger lh-1" style={{ fontSize: '2.2rem' }}>{formatMoney(classSummary?.totalDue || 0)}</div>
                <div className="text-muted small mt-2 fw-medium">Outstanding balance</div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-warning">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Late Fees Owed</div>
                <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.2rem' }}>{formatMoney(classSummary?.lateFeeOutstanding || 0)}</div>
                <div className="text-muted small mt-2 fw-medium">Penalties pending</div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* CLASS-WISE REPORT */}
            <div className="col-12 col-xl-7">
              <div className="premium-card h-100 d-flex flex-column overflow-hidden">
                <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                    <i className="bi bi-buildings-fill text-primary me-2"></i> Class-wise Report
                  </h5>
                  <button
                    className="btn btn-sm bg-light border text-primary fw-bold rounded-pill px-3 shadow-sm transition-all"
                    onClick={exportClassWiseCsv}
                    disabled={!classReport.length}
                  >
                    <i className="bi bi-download me-1"></i> Export CSV
                  </button>
                </div>
                
                <div className="table-responsive flex-grow-1 custom-scroll">
                  <table className="table table-premium align-middle mb-0">
                    <thead className="sticky-top">
                      <tr>
                        <th className="ps-4">Class</th>
                        <th className="text-center">Students</th>
                        <th className="text-end">Collected</th>
                        <th className="text-end">Base Pending</th>
                        <th className="text-end pe-4">Total Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classReport.length ? (
                        classReport.map((r) => (
                          <tr key={r.className}>
                            <td className="ps-4">
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill fw-bold">
                                Class {r.className}
                              </span>
                            </td>
                            <td className="text-center fw-bold text-muted">{r.studentsCount}</td>
                            <td className="text-end text-success fw-bold">{formatMoney(r.collectedInRange)}</td>
                            <td className="text-end text-dark fw-medium">{formatMoney(r.basePendingAmount)}</td>
                            <td className="text-end pe-4 fw-bolder text-danger">{formatMoney(r.totalDue)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <div className="text-muted fw-medium">No class-wise records found.</div>
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
              <div className="premium-card h-100 d-flex flex-column overflow-hidden">
                <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                    <i className="bi bi-calendar-month-fill text-primary me-2"></i> Monthly Collection
                  </h5>
                  <button
                    className="btn btn-sm bg-light border text-primary fw-bold rounded-pill px-3 shadow-sm transition-all"
                    onClick={exportMonthWiseCsv}
                    disabled={!monthReport.length}
                  >
                    <i className="bi bi-download me-1"></i> Export CSV
                  </button>
                </div>
                
                <div className="table-responsive flex-grow-1 custom-scroll">
                  <table className="table table-premium align-middle mb-0">
                    <thead className="sticky-top">
                      <tr>
                        <th className="ps-4">Month</th>
                        <th className="text-end">Collected</th>
                        <th className="text-center pe-4">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthReport.length ? (
                        monthReport.map((r) => (
                          <tr key={r.month}>
                            <td className="ps-4 fw-bold text-dark">{r.month}</td>
                            <td className="text-end text-success fw-bolder">{formatMoney(r.collectedAmount)}</td>
                            <td className="text-center pe-4 text-muted fw-bold">{r.transactionsCount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-5">
                            <div className="text-muted fw-medium">No month-wise records found.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-light p-3 border-top d-flex justify-content-between align-items-center">
                  <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Yearly Total</span>
                  <span className="fw-bolder fs-5 text-success">
                    {formatMoney(monthSummary?.collectedAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STUDENT-WISE REPORT WITH SEARCH */}
          <div className="premium-card overflow-hidden">
            <div className="p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                  <i className="bi bi-person-lines-fill text-primary me-2"></i> Student Payment Status
                </h5>
                <div className="d-flex gap-2 align-items-center">
                  <div className="position-relative">
                    <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '12px', fontSize: '0.85rem' }}></i>
                    <input
                      type="text"
                      className="search-premium"
                      style={{ width: '250px' }}
                      placeholder="Search student name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn bg-light border text-primary fw-bold rounded-3 px-3 shadow-sm transition-all text-nowrap"
                    onClick={exportStudentWiseCsv}
                    disabled={!filteredStudents.length}
                    style={{ height: '38px' }}
                  >
                    <i className="bi bi-download me-1"></i> Export
                  </button>
                </div>
              </div>
            </div>
            
            <div className="table-responsive custom-scroll" style={{ maxHeight: "400px" }}>
              <table className="table table-premium align-middle mb-0">
                <thead className="sticky-top">
                  <tr>
                    <th className="ps-4">Student Name</th>
                    <th>Class</th>
                    <th className="text-end">Total Fees</th>
                    <th className="text-end">Paid Amount</th>
                    <th className="text-end">Pending Due</th>
                    <th className="text-center pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length ? (
                    filteredStudents.map((r, index) => (
                      <tr key={r.studentId || index}>
                        <td className="ps-4 fw-bolder text-dark">{r.studentName}</td>
                        <td>
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill fw-semibold">
                            Class {r.className}
                          </span>
                        </td>
                        <td className="text-end text-muted fw-bold">{formatMoney(r.totalFees)}</td>
                        <td className="text-end text-success fw-bolder">{formatMoney(r.paidAmount)}</td>
                        <td className="text-end text-danger fw-bolder">{formatMoney(r.totalDue)}</td>
                        <td className="text-center pe-4">
                          {r.totalDue > 0 ? (
                            <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50 px-3 py-2 rounded-pill fw-bold">Pending</span>
                          ) : (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="text-muted fw-medium">
                          {searchQuery 
                            ? `No student found matching "${searchQuery}"` 
                            : "No student records found for the selected filters."}
                        </div>
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