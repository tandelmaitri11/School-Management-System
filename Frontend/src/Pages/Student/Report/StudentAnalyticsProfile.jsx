import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

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
    transition: all 0.25s ease;
  }
  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
    border-color: #cbd5e1;
  }

  /* Buttons */
  .btn-saas {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-weight: 600;
  }
  .btn-saas:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export default function StudentAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    setLoading(true);
    api.get(`/api/analytics/student/${studentId}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching student analytics:", err);
        setLoading(false);
      });
  }, [studentId]);

  const downloadReport = async (format) => {
    if (!studentId) return;
    try {
      const res = await api.get(`/api/analytics/student/${studentId}/report`, {
        params: { format },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student_analytics_${studentId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  // Chart Logic
  const attendanceChartData = useMemo(() => {
    if (!data) return null;
    return {
      datasets: [{
        data: [data.attendancePercentage, 100 - data.attendancePercentage],
        backgroundColor: [colors.primary, colors.border],
        borderWidth: 0,
        cutout: "80%",
      }],
    };
  }, [data]);

  const performanceChartData = useMemo(() => {
    if (!data) return null;
    return {
      datasets: [{
        data: [data.performanceScore, 100 - data.performanceScore],
        backgroundColor: [colors.success, colors.border],
        borderWidth: 0,
        cutout: "80%",
      }],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border mb-3" style={{ color: colors.primary, width: "3rem", height: "3rem", borderWidth: '0.2em' }} role="status"></div>
        <p className="fw-semibold text-uppercase tracking-wider" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Generating AI Insights...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="saas-card p-5 text-center">
          <i className="bi bi-graph-down fs-1 mb-3 d-block" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
          <h5 className="fw-semibold" style={{ color: colors.textMain }}>No analytics data available.</h5>
        </div>
      </div>
    );
  }

  const isFail = data.prediction === 'Fail';

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: "100vh" }}>
      <style>{styles}</style>

      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">

        {/* --- HERO HEADER --- */}
        <div className="saas-card border-0 p-4 p-md-5 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: colors.primaryGradient, color: '#ffffff' }}>
          <div className="row align-items-center position-relative z-index-1">
            <div className="col-lg-8">
              <span className="badge mb-3 px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: "rgba(255,255,255,0.2)", border: '1px solid rgba(255,255,255,0.3)', letterSpacing: "0.5px" }}>
                <i className="bi bi-stars me-2 text-warning"></i> AI Powered Feedback
              </span>
              <h1 className="display-5 fw-bolder mb-2" style={{ letterSpacing: '-1px' }}>Hello, Student!</h1>
              <p className="fs-5 mb-0" style={{ opacity: 0.9, fontWeight: 500 }}>Here is your current academic standing and AI-driven predictions for the semester.</p>
            </div>
            
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <div className={`px-4 py-2 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center mb-3`} style={{ backgroundColor: isFail ? colors.danger : colors.success, color: '#ffffff', letterSpacing: '0.5px' }}>
                <i className={`bi ${isFail ? 'bi-exclamation-octagon' : 'bi-check-circle'} me-2 fs-5`}></i>
                Predicted Outcome: {data.prediction?.toUpperCase()}
              </div>
              <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                <button className="btn btn-saas rounded-pill px-4 d-flex align-items-center" style={{ backgroundColor: '#ffffff', color: colors.primary, border: 'none' }} onClick={() => downloadReport("pdf")}>
                  <i className="bi bi-file-earmark-pdf-fill me-2 fs-5"></i> Export PDF
                </button>
                <button className="btn btn-saas rounded-pill px-4 d-flex align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)' }} onClick={() => downloadReport("csv")}>
                  <i className="bi bi-filetype-csv me-2 fs-5"></i> Export CSV
                </button>
              </div>
            </div>
          </div>
          {/* Decorative Circles */}
          <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '300px', height: '300px', bottom: '-100px', right: '-50px' }}></div>
          <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '150px', height: '150px', top: '-50px', left: '40%' }}></div>
        </div>

        <div className="row g-4 mb-4">

          {/* --- KPI GAUGES --- */}
          <div className="col-md-6 col-xl-3">
            <div className="saas-card p-4 text-center h-100 hover-lift">
              <h6 className="fw-bold text-uppercase mb-4" style={{ color: colors.textMuted, fontSize: '0.85rem', letterSpacing: '1px' }}>Attendance</h6>
              <div className="position-relative mx-auto mb-3" style={{ width: "130px", height: "130px" }}>
                <Doughnut data={attendanceChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                <div className="position-absolute top-50 start-50 translate-middle fw-bolder fs-3" style={{ color: colors.textMain }}>
                  {data.attendancePercentage.toFixed(0)}<span className="fs-5 text-muted">%</span>
                </div>
              </div>
              <p className="small mb-0 fw-medium" style={{ color: colors.textMuted }}>Target: 75%</p>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="saas-card p-4 text-center h-100 hover-lift">
              <h6 className="fw-bold text-uppercase mb-4" style={{ color: colors.textMuted, fontSize: '0.85rem', letterSpacing: '1px' }}>Avg Performance</h6>
              <div className="position-relative mx-auto mb-3" style={{ width: "130px", height: "130px" }}>
                <Doughnut data={performanceChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                <div className="position-absolute top-50 start-50 translate-middle fw-bolder fs-3" style={{ color: colors.textMain }}>
                  {data.performanceScore.toFixed(0)}<span className="fs-5 text-muted">%</span>
                </div>
              </div>
              <p className="small mb-0 fw-medium" style={{ color: colors.textMuted }}>Aggregated Scores</p>
            </div>
          </div>

          {/* --- WEAK SUBJECTS --- */}
          <div className="col-md-12 col-xl-6">
            <div className="saas-card p-4 h-100 hover-lift d-flex flex-column">
              <h6 className="fw-bold text-uppercase mb-3 d-flex align-items-center gap-2" style={{ color: colors.textMuted, fontSize: '0.85rem', letterSpacing: '1px' }}>
                <i className="bi bi-lightning-charge-fill fs-5" style={{ color: colors.warning }}></i> Areas for Improvement
              </h6>
              <p className="small fw-medium mb-4" style={{ color: colors.textMuted, lineHeight: '1.6' }}>
                Our AI identified these subjects as your current weak spots based on recent assessments and assignments.
              </p>
              
              <div className="mt-auto">
                {data.weakSubjects.length === 0 ? (
                  <div className="p-3 rounded-4 fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: colors.successLight, color: colors.success, border: `1px solid rgba(16,185,129,0.2)` }}>
                    🚀 You are excelling in all subjects!
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {data.weakSubjects.map((w, i) => (
                      <span key={i} className="badge px-3 py-2 rounded-pill fw-medium d-flex align-items-center shadow-sm" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}`, fontSize: '0.85rem' }}>
                        <i className="bi bi-book-half me-2" style={{ color: colors.primary }}></i>
                        {w.subject} <span className="ms-2 opacity-50">|</span> <span className="ms-2 fw-bold" style={{ color: colors.danger }}>{w.avg.toFixed(0)}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- ALERTS SECTION --- */}
        <div className="row g-4">
          <div className="col-12">
            <div className="saas-card overflow-hidden">
              <div className="px-4 py-3 d-flex align-items-center gap-2 border-bottom" style={{ backgroundColor: '#fcfcfd', borderColor: colors.border }}>
                <i className="bi bi-bell-fill fs-5" style={{ color: colors.danger }}></i>
                <h6 className="mb-0 fw-bold text-uppercase" style={{ color: colors.textMain, letterSpacing: '0.05em', fontSize: '0.85rem' }}>Critical System Alerts</h6>
              </div>
              <div className="p-4">
                {data.alerts.length === 0 ? (
                  <p className="small fst-italic mb-0" style={{ color: colors.textMuted }}>No active alerts at this time.</p>
                ) : (
                  <div className="row g-3">
                    {data.alerts.map((a, i) => (
                      <div key={i} className="col-md-6 col-xl-4">
                        <div className="d-flex align-items-start gap-3 p-3 rounded-4 h-100" style={{ backgroundColor: colors.dangerLight, border: `1px solid rgba(239,68,68,0.2)` }}>
                          <i className="bi bi-exclamation-triangle-fill mt-1" style={{ color: colors.danger, fontSize: '1.2rem' }}></i>
                          <div className="fw-medium small" style={{ color: colors.danger, lineHeight: '1.5' }}>{a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- SMART ADVICE CARD --- */}
          <div className="col-12">
            <div className="saas-card border-0 p-4 p-md-5 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4" style={{ backgroundColor: colors.textMain, color: '#ffffff' }}>
              <div className="d-flex align-items-center gap-4">
                <div className="rounded-circle d-flex align-items-center justify-content-center fs-2 shadow-sm flex-shrink-0" style={{ width: '64px', height: '64px', backgroundColor: colors.primary }}>
                  🤖
                </div>
                <div>
                  <h4 className="fw-bolder mb-2 text-white">AI Learning Tip</h4>
                  <p className="mb-0 fw-medium" style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem', maxWidth: '600px' }}>
                    {data.attendancePercentage < 75
                      ? "Your attendance is dropping. Regular presence increases your chances of passing by 40%."
                      : "Consistency is key! Maintain your current pace to secure an A grade."}
                  </p>
                </div>
              </div>
              <button className="btn btn-saas rounded-pill px-4 py-2 flex-shrink-0" style={{ backgroundColor: '#ffffff', color: colors.textMain, border: 'none' }}>
                Get Study Plan
              </button>
            </div>
          </div>

          {/* --- AI STUDY RECOMMENDATION --- */}
          <div className="col-12">
            <div className="saas-card p-4 p-md-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-lightbulb-fill fs-4" style={{ color: colors.warning }}></i>
                <h5 className="mb-0 fw-bolder" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>AI Study Recommendation</h5>
              </div>
              <p className="fw-medium mb-0" style={{ color: colors.textMuted, fontSize: '1.05rem', lineHeight: '1.6' }}>
                {data.suggestion || "Keep a steady study schedule and focus on weak areas for improvement."}
              </p>
              
              {Array.isArray(data.aiStudyPlan) && data.aiStudyPlan.length > 0 && (
                <div className="mt-4 pt-4 border-top" style={{ borderColor: colors.border }}>
                  <h6 className="fw-bold text-uppercase mb-3" style={{ color: colors.textMuted, fontSize: '0.8rem', letterSpacing: '1px' }}>Actionable Steps</h6>
                  <div className="d-flex flex-column gap-3">
                    {data.aiStudyPlan.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-3 p-3 rounded-4" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold" style={{ width: '28px', height: '28px', backgroundColor: colors.primaryLight, color: colors.primary, fontSize: '0.85rem' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="fw-bold mb-1" style={{ color: colors.textMain, fontSize: '0.95rem' }}>{item.title}</div>
                          <div className="small fw-medium" style={{ color: colors.textMuted, lineHeight: '1.5' }}>{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}