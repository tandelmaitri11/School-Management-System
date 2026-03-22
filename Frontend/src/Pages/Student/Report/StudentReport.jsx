import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../../../api/api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- MODERN "BENTO BOX" STYLES ---
const styles = {
  page: { 
    backgroundColor: "#f1f5f9", 
    minHeight: "100vh", 
    padding: "2rem 1rem",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  actionBar: {
    maxWidth: "1140px",
    margin: "0 auto 2rem auto",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "16px 24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    position: "sticky",
    top: "20px",
    zIndex: 1000,
  },
  document: {
    maxWidth: "1140px",
    margin: "0 auto",
    padding: "40px",
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
  },
  docHeader: {
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "1.5rem",
    marginBottom: "2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  banner: {
    backgroundColor: "#0f172a", // Simple solid dark background
    borderRadius: "16px",
    padding: "32px",
    color: "white",
    marginBottom: "2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    height: "100%",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "1.5rem"
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: "1.2"
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  bentoStat: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    height: "100%"
  }
};

const monthOptions = [
  { label: "Year To Date", value: "" },
  { label: "January", value: "2026-01" },
  { label: "February", value: "2026-02" },
  { label: "March", value: "2026-03" },
];

// Refined Bento Stat Card
const StatCard = ({ icon, label, value, tone = "primary" }) => (
  <div style={styles.bentoStat}>
    <div 
      className={`text-${tone} bg-${tone} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} 
      style={{ width: "46px", height: "46px", fontSize: "1.2rem" }}
    >
      <i className={`bi ${icon}`}></i>
    </div>
    <div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  </div>
);

export default function StudentReportPage() {
  const { studentId: routeStudentId } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const reportRef = useRef(null);
  const autoDownloadTriggeredRef = useRef(false);

  // --- API LOGIC ---
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const studentId = routeStudentId || localStorage.getItem("studentId");
        const res = await api.get(`/api/reports/student/${studentId}`, { params: { month } });
        setReport(res.data);
      } catch (error) {
        console.error("Error loading report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month, routeStudentId]);

  // --- UPDATED PDF LOGIC (FIT TO 1 PAGE) ---
  const downloadPDF = async () => {
    if (!reportRef.current || !report) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate ratio to scale down the canvas so it perfectly fits inside 1 page
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    
    const finalWidth = canvas.width * ratio;
    const finalHeight = canvas.height * ratio;
    
    // Center it horizontally just in case it scales heavily by height
    const xOffset = (pdfWidth - finalWidth) / 2;

    pdf.addImage(imgData, "PNG", xOffset, 0, finalWidth, finalHeight);

    pdf.save(`Report_${report.studentName || "Student"}.pdf`);
  };

  useEffect(() => {
    const shouldAutoDownload = new URLSearchParams(location.search).get("pdf") === "1";
    if (!shouldAutoDownload || loading || !report || autoDownloadTriggeredRef.current) return;

    autoDownloadTriggeredRef.current = true;
    downloadPDF();
  }, [location.search, loading, report]);

  useEffect(() => {
    autoDownloadTriggeredRef.current = false;
  }, [routeStudentId, month, location.search]);
  // --- END API LOGIC ---

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} />
        <h6 className="text-muted fw-bold text-uppercase tracking-wider">Generating Profile...</h6>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center text-muted">
          <i className="bi bi-file-earmark-x fs-1 mb-2 d-block opacity-50"></i>
          <h5>No report data available.</h5>
        </div>
      </div>
    );
  }

  const score = Number(report?.overallResult?.score || 0);
  const radialData = [
    { name: "Background", uv: 100, fill: "#f1f5f9" },
    { name: "Score", uv: score, fill: "#3b82f6" }, 
  ];
  
  const aiRiskTone =
    report?.aiInsights?.riskLevel === "High" ? "danger"
      : report?.aiInsights?.riskLevel === "Medium" ? "warning"
      : "success";

  return (
    <div style={styles.page}>
      
      {/* FLOATING CONTROL BAR */}
      <div style={styles.actionBar} className="shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: "42px", height: "42px", fontSize: "1.2rem" }}>
            {(report.studentName || "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <h6 className="fw-bold text-dark m-0">Student Dossier</h6>
            <small className="text-muted fw-medium d-none d-sm-block">Comprehensive Academic Review</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <select
            className="form-select form-select-sm border-0 bg-light fw-bold text-secondary"
            style={{ width: "160px", padding: "8px 16px", borderRadius: "8px" }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button onClick={downloadPDF} className="btn btn-dark btn-sm fw-bold d-flex align-items-center gap-2 px-3 py-2" style={{ borderRadius: "8px" }}>
            <i className="bi bi-printer"></i>
            <span className="d-none d-sm-block">Export PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT CONTAINER */}
      <div ref={reportRef} style={styles.document} className="report-doc">
        
        {/* Header */}
        <div style={styles.docHeader}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-dark text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
              <i className="bi bi-mortarboard-fill fs-4"></i>
            </div>
            <div>
              <h3 className="fw-bolder text-dark m-0" style={{ letterSpacing: "-0.5px" }}>SchoolY</h3>
              <div className="text-muted fw-semibold" style={{ fontSize: "0.85rem" }}>Official Academic Record</div>
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>Date Generated</div>
            <div className="fw-bold text-dark fs-6">{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric'})}</div>
          </div>
        </div>

        {/* Hero Banner - SIMPLIFIED */}
        <div style={styles.banner}>
          <div>
            <span className="badge bg-white bg-opacity-25 text-white mb-3 px-3 py-2 rounded-pill fw-semibold border border-white border-opacity-25" style={{ letterSpacing: "0.5px" }}>
              Student Profile
            </span>
            <h1 className="fw-bolder mb-2 display-6" style={{ letterSpacing: "-1px" }}>{report.studentName}</h1>
            <div className="d-flex flex-wrap gap-4 mt-3 opacity-75 fw-medium">
              <span><i className="bi bi-hash me-1"></i> {report.studentId || "N/A"}</span>
              <span><i className="bi bi-building me-1"></i> Class {report.className} {report.studentDetails?.section ? `(${report.studentDetails.section})` : ""}</span>
              <span><i className="bi bi-book me-1"></i> {report.studentDetails?.stream || "General"}</span>
            </div>
          </div>
          
          <div className="text-end d-none d-md-block">
            <div className="text-white opacity-75 fw-bold text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
               {report?.overallResult?.label || "Overall Score"}
            </div>
            <div className="display-3 fw-bolder text-white" style={{ lineHeight: "1" }}>{score}</div>
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="row g-4">
          
          {/* Attendance (Col-8) */}
          <div className="col-lg-8">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-calendar2-check text-primary fs-5"></i> Attendance Overview</div>
              <div className="row g-3 mb-4">
                <div className="col-md-3 col-6"><StatCard icon="bi-check-circle" label="Present" value={report.attendance?.presentDays || 0} tone="success" /></div>
                <div className="col-md-3 col-6"><StatCard icon="bi-x-circle" label="Absent" value={report.attendance?.absentDays || 0} tone="danger" /></div>
                <div className="col-md-3 col-6"><StatCard icon="bi-calendar-day" label="Total Days" value={report.attendance?.totalDays || 0} tone="secondary" /></div>
                <div className="col-md-3 col-6"><StatCard icon="bi-percent" label="Rate" value={`${report.attendance?.percentage || 0}%`} tone="primary" /></div>
              </div>
              <div style={{ height: "180px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.attendance?.chart || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={10} />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="Present" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#attendanceFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Radial Score (Col-4) */}
          <div className="col-lg-4">
            <div style={styles.card} className="d-flex flex-column align-items-center justify-content-center text-center">
              <div style={styles.sectionTitle} className="w-100 justify-content-center"><i className="bi bi-bullseye text-primary fs-5"></i> Performance Index</div>
              <div style={{ height: "220px", width: "100%", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="75%" outerRadius="100%" barSize={16} data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="uv" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="position-absolute top-50 start-50 translate-middle w-100">
                  <div className="display-4 fw-bolder text-dark" style={{ letterSpacing: "-1.5px" }}>{score}</div>
                  <div className="text-muted fw-bold text-uppercase mt-1" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>Total Score</div>
                </div>
              </div>
              <span className="badge bg-light text-dark border px-4 py-2 mt-3 fs-6 rounded-pill fw-medium">
                {report?.overallResult?.label || "Evaluated"}
              </span>
            </div>
          </div>

          {/* Academic Perf (Col-8) */}
          <div className="col-lg-8">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-bar-chart-fill text-warning fs-5"></i> Academic Analytics</div>
              <div className="row g-3 mb-4">
                <div className="col-md-4"><StatCard icon="bi-journal-bookmark" label="Total Exams" value={report.academicPerformance?.totalExams || 0} tone="secondary" /></div>
                <div className="col-md-4"><StatCard icon="bi-graph-up" label="Average %" value={`${report.academicPerformance?.averagePercentage || 0}%`} tone="warning" /></div>
                <div className="col-md-4"><StatCard icon="bi-award" label="Passed Exams" value={report.academicPerformance?.passCount || 0} tone="success" /></div>
              </div>
              <div style={{ height: "180px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.academicPerformance?.chart || []} barSize={24} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} dy={10} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Assignments (Col-4) */}
          <div className="col-lg-4">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-file-earmark-check text-success fs-5"></i> Coursework</div>
              <div className="d-flex flex-column gap-3 h-100 justify-content-center">
                <StatCard icon="bi-cloud-arrow-up" label="Submitted" value={report.assignments?.totalSubmitted || 0} tone="success" />
                <StatCard icon="bi-check2-all" label="Graded" value={report.assignments?.graded || 0} tone="info" />
                <StatCard icon="bi-star" label="Avg Grade" value={report.assignments?.avgGrade || 0} tone="primary" />
              </div>
            </div>
          </div>

          {/* LMS (Col-6) */}
          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-laptop text-info fs-5"></i> Digital Learning Progress</div>
              <div className="row g-3">
                <div className="col-6"><StatCard icon="bi-play-circle" label="Materials Done" value={report.lms?.completedMaterials || 0} tone="info" /></div>
                <div className="col-6"><StatCard icon="bi-clock-history" label="Watch Time" value={`${Math.round((report.lms?.totalWatchSeconds || 0) / 60)}m`} tone="secondary" /></div>
                <div className="col-6"><StatCard icon="bi-pie-chart" label="Completion" value={`${report.lms?.completionRate || 0}%`} tone="primary" /></div>
                <div className="col-6"><StatCard icon="bi-bar-chart-steps" label="Avg Progress" value={`${report.lms?.averageProgress || 0}%`} tone="success" /></div>
              </div>
            </div>
          </div>

          {/* Fees (Col-6) */}
          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-wallet2 text-danger fs-5"></i> Financial Status</div>
              <div className="row g-3">
                <div className="col-6"><StatCard icon="bi-cash" label="Total Fees" value={`₹${report.feeStatus?.totalFees || 0}`} tone="secondary" /></div>
                <div className="col-6"><StatCard label="Paid" icon="bi-check-circle" value={`₹${report.feeStatus?.paidAmount || 0}`} tone="success" /></div>
                <div className="col-6"><StatCard label="Due" icon="bi-exclamation-circle" value={`₹${report.feeStatus?.totalDue || 0}`} tone="danger" /></div>
                <div className="col-6">
                   <div style={styles.bentoStat} className={`bg-${report.feeStatus?.status === 'Paid' ? 'success' : 'danger'}-subtle border-0`}>
                      <div>
                         <div style={styles.statLabel} className={`text-${report.feeStatus?.status === 'Paid' ? 'success' : 'danger'}`}>Status</div>
                         <div style={styles.statValue} className={`text-${report.feeStatus?.status === 'Paid' ? 'success' : 'danger'} fs-5`}>{report.feeStatus?.status || "N/A"}</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI, Strengths, Improvements (3 Columns) */}
          <div className="col-lg-4">
            <div style={{...styles.card, borderTop: `4px solid var(--bs-${aiRiskTone})`}}>
              <div style={styles.sectionTitle}><i className={`bi bi-robot text-${aiRiskTone} fs-5`}></i> AI Insight</div>
              <span className={`badge bg-${aiRiskTone} bg-opacity-10 text-${aiRiskTone} border border-${aiRiskTone} border-opacity-25 rounded-pill px-3 py-2 mb-3 fw-bold`}>
                Risk Level: {report.aiInsights?.riskLevel || "Low"}
              </span>
              <p className="text-secondary small fw-medium mt-2" style={{ lineHeight: '1.6' }}>
                {report.aiInsights?.summary || "No automated insight available."}
              </p>
            </div>
          </div>

          <div className="col-lg-4">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-lightning-charge text-success fs-5"></i> Strengths</div>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {(report.strengthsAndImprovements?.strengths || ["No distinct strengths listed yet."]).map((item, index) => (
                  <li key={`strength-${index}`} className="d-flex align-items-start gap-2 small text-dark fw-medium">
                    <i className="bi bi-check2-circle text-success fs-6"></i> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-4">
            <div style={styles.card}>
              <div style={styles.sectionTitle}><i className="bi bi-arrow-up-right-square text-danger fs-5"></i> Areas to Improve</div>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {(report.strengthsAndImprovements?.improvements || ["No distinct improvements listed yet."]).map((item, index) => (
                  <li key={`improvement-${index}`} className="d-flex align-items-start gap-2 small text-dark fw-medium">
                    <i className="bi bi-dash-circle text-danger fs-6"></i> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Table */}
          <div className="col-12 mt-2">
            <div style={{...styles.card, padding: 0}} className="overflow-hidden">
              <div style={{...styles.sectionTitle, padding: "24px 24px 0 24px", marginBottom: "16px"}}><i className="bi bi-table text-dark fs-5"></i> Assignment Ledger</div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 custom-table">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 ps-4 text-muted small fw-bold text-uppercase" style={{letterSpacing: '0.5px'}}>Assignment Title</th>
                      <th className="py-3 text-muted small fw-bold text-uppercase" style={{letterSpacing: '0.5px'}}>Due Date</th>
                      <th className="py-3 text-muted small fw-bold text-uppercase text-center" style={{letterSpacing: '0.5px'}}>Grade</th>
                      <th className="py-3 text-muted small fw-bold text-uppercase text-end pe-4" style={{letterSpacing: '0.5px'}}>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.assignments?.details || []).length ? (
                      report.assignments.details.map((item, index) => (
                        <tr key={`assignment-detail-${index}`} className="border-bottom border-light-subtle">
                          <td className="ps-4 py-3 fw-bold text-dark">{item.title || "-"}</td>
                          <td className="text-secondary small fw-medium">
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="text-center">
                            {item.grade ? <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill">{item.grade}</span> : <span className="text-muted">-</span>}
                          </td>
                          <td className="text-end pe-4 text-secondary small fw-medium">
                            {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : <span className="badge bg-light text-muted border px-2 py-1">Pending</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-5">
                          <i className="bi bi-inbox fs-3 d-block mb-2 opacity-50"></i>
                          No assignment records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-5 pt-4 border-top text-muted small fw-medium">
          <p className="mb-1">This document is system generated and does not require a physical signature.</p>
          <p className="fw-bolder">© {new Date().getFullYear()} SchoolY Education Portal</p>
        </div>
      </div>

      {/* --- CUSTOM CSS FOR PRINTING & HOVERS --- */}
      <style>{`
        .custom-table tbody tr { transition: background-color 0.2s ease; }
        .custom-table tbody tr:hover { background-color: #f8fafc; }
        
        /* Ensure clean PDF export */
        @media print {
          body { background-color: white !important; }
          .report-doc { box-shadow: none !important; border: none !important; max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}