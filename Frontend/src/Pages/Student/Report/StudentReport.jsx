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

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
  primaryGradient: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
  success: "#10b981", // Emerald
  successLight: "#ecfdf5",
  warning: "#f59e0b", // Amber
  warningLight: "#fffbeb",
  danger: "#ef4444", // Red
  dangerLight: "#fef2f2",
  info: "#3b82f6", // Blue
  infoLight: "#eff6ff",
  secondary: "#64748b",
  secondaryLight: "#f1f5f9",
  bg: "#f8fafc", // Slate 50
  surface: "#ffffff",
  textMain: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#e2e8f0" // Slate 200
};

// --- SAAS UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.5s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
    height: 100%;
  }

  /* Seamless Tables */
  .saas-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  .saas-table th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${colors.textMuted};
    padding: 1rem 1.25rem;
    border-bottom: 1px solid ${colors.border};
    background-color: #fcfcfd;
  }
  .saas-table td {
    padding: 1.25rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
    color: ${colors.textMain};
    font-size: 0.9rem;
  }
  .saas-table tr:last-child td { border-bottom: none; }
  .saas-table tbody tr { transition: background-color 0.2s ease; }
  .saas-table tbody tr:hover { background-color: #f8fafc; }

  /* Buttons & Controls */
  .btn-saas {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-weight: 600;
  }
  .btn-saas:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  }
  .saas-select {
    border: 1px solid ${colors.border};
    background-color: ${colors.bg};
    color: ${colors.textMain};
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .saas-select:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
    outline: none;
  }

  /* Print Specific */
  @media print {
    body { background-color: white !important; }
    .report-doc { box-shadow: none !important; border: none !important; max-width: 100% !important; padding: 0 !important; }
    .action-bar { display: none !important; }
  }
`;

const monthOptions = [
  { label: "Year To Date", value: "" },
  { label: "January", value: "2026-01" },
  { label: "February", value: "2026-02" },
  { label: "March", value: "2026-03" },
];

// Refined Bento Stat Card for SaaS
const StatCard = ({ icon, label, value, tone = "primary" }) => {
  const bgLight = colors[`${tone}Light`] || `var(--bs-${tone}-bg-subtle)`;
  const textColor = colors[tone] || `var(--bs-${tone})`;

  return (
    <div className="p-3 rounded-4 d-flex align-items-center gap-3" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, height: '100%' }}>
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
        style={{ width: "42px", height: "42px", fontSize: "1.1rem", backgroundColor: bgLight, color: textColor }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div style={{ fontSize: "0.7rem", color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: colors.textMain, lineHeight: "1.2", letterSpacing: '-0.5px' }}>{value}</div>
      </div>
    </div>
  );
};

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
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border mb-3" style={{ color: colors.primary, width: "3rem", height: "3rem", borderWidth: '0.2em' }} />
        <h6 className="fw-semibold text-uppercase tracking-wider" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Generating Profile...</h6>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="saas-card p-5 text-center">
          <i className="bi bi-file-earmark-x fs-1 mb-3 d-block" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
          <h5 className="fw-semibold" style={{ color: colors.textMain }}>No report data available.</h5>
        </div>
      </div>
    );
  }

  const score = Number(report?.overallResult?.score || 0);
  const radialData = [
    { name: "Background", uv: 100, fill: colors.bg },
    { name: "Score", uv: score, fill: colors.primary }, 
  ];
  
  const aiRiskTone =
    report?.aiInsights?.riskLevel === "High" ? "danger"
      : report?.aiInsights?.riskLevel === "Medium" ? "warning"
      : "success";

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: "100vh" }}>
      <style>{styles}</style>
      
      {/* FLOATING CONTROL BAR */}
      <div className="container-fluid px-4 px-xl-5 mb-4 action-bar">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3 rounded-4 shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          
          <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
            <div className="rounded-3 d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{ width: "42px", height: "42px", fontSize: "1.2rem", background: colors.primaryGradient }}>
              {(report.studentName || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <h6 className="fw-bolder m-0" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>Student Dossier</h6>
              <small className="fw-medium d-none d-sm-block" style={{ color: colors.textMuted }}>Comprehensive Academic Review</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <select
              className="form-select form-select-sm saas-select px-3 py-2 rounded-pill"
              style={{ width: "160px" }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button onClick={downloadPDF} className="btn btn-saas rounded-pill d-flex align-items-center gap-2 px-4 py-2" style={{ backgroundColor: colors.textMain, color: '#ffffff', border: 'none' }}>
              <i className="bi bi-printer"></i>
              <span className="d-none d-sm-block">Export PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* DOCUMENT CONTAINER */}
      <div className="container-fluid px-4 px-xl-5 d-flex justify-content-center">
        <div ref={reportRef} className="report-doc" style={{ maxWidth: "1140px", width: "100%", backgroundColor: colors.surface, borderRadius: "24px", padding: "40px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" }}>
          
          {/* Header */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end pb-4 mb-4" style={{ borderBottom: `2px solid ${colors.bg}` }}>
            <div className="d-flex align-items-center gap-3 mb-3 mb-sm-0">
              <div className="rounded-3 d-flex align-items-center justify-content-center text-white" style={{ width: "48px", height: "48px", backgroundColor: colors.textMain }}>
                <i className="bi bi-mortarboard-fill fs-4"></i>
              </div>
              <div>
                <h3 className="fw-bolder m-0" style={{ color: colors.textMain, letterSpacing: "-1px" }}>SchoolY</h3>
                <div className="fw-semibold" style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Official Academic Record</div>
              </div>
            </div>
            <div className="text-sm-end">
              <div className="fw-bold text-uppercase" style={{ color: colors.textMuted, fontSize: "0.65rem", letterSpacing: "1px" }}>Date Generated</div>
              <div className="fw-bold fs-6" style={{ color: colors.textMain }}>{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric'})}</div>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="rounded-4 p-4 p-md-5 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center" style={{ background: colors.primaryGradient, color: '#ffffff' }}>
            <div>
              <span className="badge mb-3 px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', letterSpacing: "0.5px" }}>
                Student Profile
              </span>
              <h1 className="fw-bolder mb-2 display-6" style={{ letterSpacing: "-1px" }}>{report.studentName}</h1>
              <div className="d-flex flex-wrap gap-4 mt-3 fw-medium" style={{ opacity: 0.9 }}>
                <span><i className="bi bi-hash me-1"></i> {report.studentId || "N/A"}</span>
                <span><i className="bi bi-building me-1"></i> Class {report.className} {report.studentDetails?.section ? `(${report.studentDetails.section})` : ""}</span>
                <span><i className="bi bi-book me-1"></i> {report.studentDetails?.stream || "General"}</span>
              </div>
            </div>
            
            <div className="text-md-end mt-4 mt-md-0 d-none d-sm-block">
              <div className="fw-bold text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "1px", opacity: 0.8 }}>
                 {report?.overallResult?.label || "Overall Score"}
              </div>
              <div className="display-3 fw-bolder" style={{ lineHeight: "1", letterSpacing: '-2px' }}>{score}</div>
            </div>
          </div>

          {/* BENTO GRID LAYOUT */}
          <div className="row g-4">
            
            {/* Attendance (Col-8) */}
            <div className="col-lg-8">
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-4" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-calendar2-check fs-5" style={{ color: colors.primary }}></i> Attendance Overview
                </div>
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
                          <stop offset="0%" stopColor={colors.primary} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: colors.textMuted, fontWeight: 500 }} dy={10} />
                      <Tooltip cursor={{ stroke: colors.textMuted, strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Area type="monotone" dataKey="Present" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#attendanceFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Radial Score (Col-4) */}
            <div className="col-lg-4">
              <div className="saas-card p-4 d-flex flex-column align-items-center justify-content-center text-center">
                <div className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold text-uppercase" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-bullseye fs-5" style={{ color: colors.primary }}></i> Performance Index
                </div>
                <div style={{ height: "220px", width: "100%", position: "relative" }} className="mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="75%" outerRadius="100%" barSize={16} data={radialData} startAngle={90} endAngle={-270}>
                      <RadialBar background dataKey="uv" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="position-absolute top-50 start-50 translate-middle w-100 mt-2">
                    <div className="display-4 fw-bolder" style={{ color: colors.textMain, letterSpacing: "-1.5px" }}>{score}</div>
                    <div className="fw-bold text-uppercase mt-1" style={{ color: colors.textMuted, fontSize: "0.65rem", letterSpacing: "1px" }}>Total Score</div>
                  </div>
                </div>
                <span className="badge px-4 py-2 mt-3 fs-6 rounded-pill fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}` }}>
                  {report?.overallResult?.label || "Evaluated"}
                </span>
              </div>
            </div>

            {/* Academic Perf (Col-8) */}
            <div className="col-lg-8">
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-4" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-bar-chart-fill fs-5" style={{ color: colors.warning }}></i> Academic Analytics
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-md-4"><StatCard icon="bi-journal-bookmark" label="Total Exams" value={report.academicPerformance?.totalExams || 0} tone="secondary" /></div>
                  <div className="col-md-4"><StatCard icon="bi-graph-up" label="Average %" value={`${report.academicPerformance?.averagePercentage || 0}%`} tone="warning" /></div>
                  <div className="col-md-4"><StatCard icon="bi-award" label="Passed Exams" value={report.academicPerformance?.passCount || 0} tone="success" /></div>
                </div>
                <div style={{ height: "180px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.academicPerformance?.chart || []} barSize={24} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                      <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colors.textMuted, fontWeight: 500 }} dy={10} />
                      <Tooltip cursor={{ fill: colors.bg }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="percentage" fill={colors.warning} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Assignments (Col-4) */}
            <div className="col-lg-4">
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-4" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-file-earmark-check fs-5" style={{ color: colors.success }}></i> Coursework
                </div>
                <div className="d-flex flex-column gap-3 h-100 justify-content-center">
                  <StatCard icon="bi-cloud-arrow-up" label="Submitted" value={report.assignments?.totalSubmitted || 0} tone="success" />
                  <StatCard icon="bi-check2-all" label="Graded" value={report.assignments?.graded || 0} tone="info" />
                  <StatCard icon="bi-star" label="Avg Grade" value={report.assignments?.avgGrade || 0} tone="primary" />
                </div>
              </div>
            </div>

            {/* LMS (Col-6) */}
            <div className="col-lg-6">
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-4" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-laptop fs-5" style={{ color: colors.info }}></i> Digital Learning Progress
                </div>
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
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-4" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-wallet2 fs-5" style={{ color: colors.danger }}></i> Financial Status
                </div>
                <div className="row g-3">
                  <div className="col-6"><StatCard icon="bi-cash" label="Total Fees" value={`₹${report.feeStatus?.totalFees || 0}`} tone="secondary" /></div>
                  <div className="col-6"><StatCard label="Paid" icon="bi-check-circle" value={`₹${report.feeStatus?.paidAmount || 0}`} tone="success" /></div>
                  <div className="col-6"><StatCard label="Due" icon="bi-exclamation-circle" value={`₹${report.feeStatus?.totalDue || 0}`} tone="danger" /></div>
                  <div className="col-6">
                    <div className="p-3 rounded-4 d-flex align-items-center gap-3 h-100" style={{ backgroundColor: colors[`${report.feeStatus?.status === 'Paid' ? 'success' : 'danger'}Light`] }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: colors[report.feeStatus?.status === 'Paid' ? 'success' : 'danger'], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: colors[report.feeStatus?.status === 'Paid' ? 'success' : 'danger'], lineHeight: "1.2", letterSpacing: '-0.5px' }}>{report.feeStatus?.status || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI, Strengths, Improvements (3 Columns) */}
            <div className="col-lg-4">
              <div className="saas-card p-4" style={{ borderTop: `4px solid ${colors[aiRiskTone]}` }}>
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-3" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className={`bi bi-robot fs-5`} style={{ color: colors[aiRiskTone] }}></i> AI Insight
                </div>
                <span className="badge rounded-pill px-3 py-2 mb-3 fw-bold" style={{ backgroundColor: colors[`${aiRiskTone}Light`], color: colors[aiRiskTone], border: `1px solid rgba(${aiRiskTone === 'danger' ? '239,68,68' : aiRiskTone === 'warning' ? '245,158,11' : '16,185,129'},0.2)` }}>
                  Risk Level: {report.aiInsights?.riskLevel || "Low"}
                </span>
                <p className="small fw-medium mt-2 mb-0" style={{ color: colors.textMuted, lineHeight: '1.6' }}>
                  {report.aiInsights?.summary || "No automated insight available."}
                </p>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-3" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-lightning-charge fs-5" style={{ color: colors.success }}></i> Strengths
                </div>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  {(report.strengthsAndImprovements?.strengths || ["No distinct strengths listed yet."]).map((item, index) => (
                    <li key={`strength-${index}`} className="d-flex align-items-start gap-2 small fw-medium" style={{ color: colors.textMain }}>
                      <i className="bi bi-check2-circle fs-6 mt-1" style={{ color: colors.success }}></i> <span style={{ lineHeight: '1.5' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="saas-card p-4">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase mb-3" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px" }}>
                  <i className="bi bi-arrow-up-right-square fs-5" style={{ color: colors.danger }}></i> Areas to Improve
                </div>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  {(report.strengthsAndImprovements?.improvements || ["No distinct improvements listed yet."]).map((item, index) => (
                    <li key={`improvement-${index}`} className="d-flex align-items-start gap-2 small fw-medium" style={{ color: colors.textMain }}>
                      <i className="bi bi-dash-circle fs-6 mt-1" style={{ color: colors.danger }}></i> <span style={{ lineHeight: '1.5' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Table */}
            <div className="col-12 mt-2">
              <div className="saas-card p-0 overflow-hidden">
                <div className="d-flex align-items-center gap-2 fw-bold text-uppercase p-4 border-bottom" style={{ fontSize: "0.85rem", color: colors.textMuted, letterSpacing: "1px", borderColor: colors.border }}>
                  <i className="bi bi-table fs-5" style={{ color: colors.textMain }}></i> Assignment Ledger
                </div>
                <div className="table-responsive">
                  <table className="saas-table m-0">
                    <thead>
                      <tr>
                        <th className="ps-4">Assignment Title</th>
                        <th>Due Date</th>
                        <th className="text-center">Grade</th>
                        <th className="text-end pe-4">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.assignments?.details || []).length ? (
                        report.assignments.details.map((item, index) => (
                          <tr key={`assignment-detail-${index}`}>
                            <td className="ps-4 fw-semibold" style={{ color: colors.textMain }}>{item.title || "-"}</td>
                            <td className="small fw-medium" style={{ color: colors.textMuted }}>
                              {item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                            </td>
                            <td className="text-center">
                              {item.grade ? (
                                <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: colors.successLight, color: colors.success, border: '1px solid rgba(16,185,129,0.2)' }}>
                                  {item.grade}
                                </span>
                              ) : (
                                <span style={{ color: colors.textMuted }}>-</span>
                              )}
                            </td>
                            <td className="text-end pe-4 small fw-medium" style={{ color: colors.textMuted }}>
                              {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: colors.bg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>Pending</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-5">
                            <i className="bi bi-inbox fs-2 d-block mb-2" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
                            <span style={{ color: colors.textMuted }}>No assignment records found for this period.</span>
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
          <div className="text-center mt-5 pt-4 fw-medium" style={{ borderTop: `1px solid ${colors.bg}`, color: colors.textMuted, fontSize: '0.8rem' }}>
            <p className="mb-1">This document is system generated and does not require a physical signature.</p>
            <p className="fw-bolder" style={{ color: colors.textMain }}>© {new Date().getFullYear()} SchoolY Education Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}