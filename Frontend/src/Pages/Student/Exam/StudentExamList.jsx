import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const normalizeUpper = (value) => String(value || "").trim().toUpperCase();
const formatSectionLabel = (value) => (normalizeUpper(value) === "BOTH" ? "Both" : normalizeUpper(value));

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

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

  /* Utility Classes */
  .text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .btn-saas {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .btn-saas:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  }
  .btn-saas:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export default function StudentExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  // --- LOGIC (UNCHANGED) ---
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/student/exams");
        if (!res.data?.success) throw new Error(res.data?.message);
        setExams(res.data.exams || []);
      } catch (err) {
        setErrMsg(err.response?.data?.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(start.getTime() + Number(exam.duration || 0) * 60000);
    if (now < start) return "UPCOMING";
    if (now > end) return "ENDED";
    return "ONGOING";
  };

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
    [exams]
  );

  // --- UPDATED STATUS BADGE ---
  const StatusBadge = ({ status }) => {
    let bg, color, border, icon;
    
    if (status === "UPCOMING") {
      bg = colors.warningLight;
      color = colors.warning;
      border = "rgba(245,158,11,0.2)";
      icon = "bi-clock";
    } else if (status === "ONGOING") {
      bg = colors.successLight;
      color = colors.success;
      border = "rgba(16,185,129,0.2)";
      icon = null; // Spinner used instead
    } else { // ENDED
      bg = colors.bg;
      color = colors.textMuted;
      border = colors.border;
      icon = "bi-check2-circle";
    }

    return (
      <span 
        className="badge px-3 py-2 rounded-pill fw-semibold d-flex align-items-center flex-shrink-0" 
        style={{ backgroundColor: bg, color: color, border: `1px solid ${border}`, fontSize: '0.75rem', letterSpacing: '0.05em' }}
      >
        {status === "ONGOING" ? (
          <span className="spinner-grow spinner-grow-sm me-2" style={{ width: '.5rem', height: '.5rem' }}/>
        ) : (
          <i className={`bi ${icon} me-1`}></i>
        )}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border mb-3" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} role="status"></div>
        <p className="mt-2 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Loading Exams...</p>
      </div>
    );
  }

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* ---------- HEADER SECTION ---------- */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-file-earmark-text me-2"></i>Assessment Center
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>Examinations</h2>
            <p className="mb-0 small fw-medium" style={{ color: colors.textMuted }}>
              View your schedule, access live assessments, and check past results.
            </p>
          </div>
        </div>

        {/* ---------- ERROR STATE ---------- */}
        {errMsg && (
          <div className="alert d-flex align-items-center p-3 mb-4 rounded-4" style={{ backgroundColor: colors.dangerLight, border: `1px solid rgba(239,68,68,0.2)`, color: colors.danger }}>
            <i className="bi bi-exclamation-octagon-fill fs-5 me-3"></i>
            <span className="fw-semibold">{errMsg}</span>
          </div>
        )}

        {/* ---------- EXAMS GRID ---------- */}
        {sortedExams.length === 0 ? (
          <div className="text-center py-5 my-5 saas-card">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: colors.bg }}>
              <i className="bi bi-calendar-x fs-1" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
            </div>
            <h5 className="fw-bold mb-1" style={{ color: colors.textMain }}>No exams scheduled</h5>
            <p className="small" style={{ color: colors.textMuted }}>There are currently no upcoming or ongoing exams.</p>
          </div>
        ) : (
          <div className="row g-4">
            {sortedExams.map((e) => {
              const status = getStatus(e);
              const startObj = new Date(e.startTime);
              
              // Formatting
              const dateStr = startObj.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
              const timeStr = startObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

              return (
                <div className="col-12 col-md-6 col-xl-4 col-xxl-3" key={e._id}>
                  <div className="saas-card h-100 d-flex flex-column hover-lift">
                    
                    {/* Card Header */}
                    <div className="p-4 border-bottom d-flex justify-content-between align-items-start gap-3" style={{ borderColor: colors.border }}>
                      <div className="d-flex flex-column">
                        <span className="text-uppercase fw-bold mb-1" style={{ color: colors.textMuted, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                          {e.subjectName}
                        </span>
                        <h5 className="fw-bold mb-0 text-truncate-2" style={{ color: colors.textMain, fontSize: '1.1rem', lineHeight: '1.3' }} title={e.title}>
                          {e.title}
                        </h5>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-grow-1 d-flex flex-column gap-3">
                      
                      {/* Meta Info (Class/Section) */}
                      <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill small fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMuted, border: `1px solid ${colors.border}`, width: 'fit-content' }}>
                        Class {e.className || "-"}
                        {e.section ? ` • Sec ${formatSectionLabel(e.section)}` : ""}
                        {e.stream ? ` • ${e.stream}` : ""}
                      </div>

                      {/* Date & Time Box */}
                      <div className="d-flex align-items-center mt-2">
                         <div className="rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                           <i className="bi bi-calendar-event"></i>
                         </div>
                         <div>
                           <span className="d-block small fw-semibold text-uppercase" style={{ color: colors.textMuted, fontSize: '0.7rem', letterSpacing: '0.05em' }}>Date & Time</span>
                           <span className="fw-semibold" style={{ color: colors.textMain, fontSize: '0.95rem' }}>{dateStr} • {timeStr}</span>
                         </div>
                      </div>

                      {/* Duration Box */}
                      <div className="d-flex align-items-center">
                         <div className="rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', backgroundColor: colors.infoLight, color: colors.info }}>
                           <i className="bi bi-stopwatch"></i>
                         </div>
                         <div>
                           <span className="d-block small fw-semibold text-uppercase" style={{ color: colors.textMuted, fontSize: '0.7rem', letterSpacing: '0.05em' }}>Duration</span>
                           <span className="fw-semibold" style={{ color: colors.textMain, fontSize: '0.95rem' }}>{e.duration} Minutes</span>
                         </div>
                      </div>

                    </div>

                    {/* Card Footer / Actions */}
                    <div className="p-4 pt-0 mt-auto">
                      
                      {status === "ONGOING" && !e.submitted && (
                        <button onClick={() => navigate(`/student/start-exam/${e._id}`)} className="btn btn-saas w-100 rounded-pill fw-semibold py-2 d-flex justify-content-center align-items-center" style={{ backgroundColor: colors.primary, color: '#ffffff', border: 'none' }}>
                           {e.attempted ? "Resume Exam" : "Start Exam"} <i className="bi bi-arrow-right ms-2"></i>
                        </button>
                      )}

                      {status === "ENDED" && e.submitted && (
                        <button onClick={() => navigate(`/student/exam-result/${e._id}`)} className="btn w-100 rounded-pill fw-semibold py-2 transition-all hover-bg-light" style={{ backgroundColor: '#ffffff', color: colors.textMain, border: `1px solid ${colors.border}` }}>
                           <i className="bi bi-file-bar-graph me-2 text-primary"></i> View Result
                        </button>
                      )}

                      {status === "ENDED" && !e.submitted && (
                        <div className="text-center py-2 rounded-pill fw-semibold" style={{ backgroundColor: colors.dangerLight, color: colors.danger, border: `1px solid rgba(239,68,68,0.2)`, fontSize: '0.85rem' }}>
                          <i className="bi bi-x-octagon me-1"></i> Missed / Not Submitted
                        </div>
                      )}

                      {status === "UPCOMING" && (
                        <div className="text-center py-2 rounded-pill fw-semibold" style={{ backgroundColor: colors.bg, color: colors.textMuted, border: `1px solid ${colors.border}`, fontSize: '0.85rem' }}>
                          <i className="bi bi-lock-fill me-1 opacity-75"></i> Locked
                        </div>
                      )}
                      
                      {/* Optional Submission Tag for Ongoing exams that are somehow already submitted */}
                      {e.submitted && status !== "ENDED" && (
                        <div className="text-center mt-3 small fw-bold" style={{ color: colors.success }}>
                          <i className="bi bi-check-circle-fill me-1"></i> Submitted
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}