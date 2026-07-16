import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import {
  Spinner,
  Row,
  Col,
  Toast,
  ToastContainer,
  Form
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
  }

  /* File Input Styling */
  .saas-file-input {
    font-size: 0.8rem;
    background-color: #f1f5f9 !important;
    border: 1px solid transparent !important;
    color: ${colors.textMuted};
    transition: all 0.2s ease;
  }
  .saas-file-input:focus {
    background-color: #ffffff !important;
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 3px ${colors.primaryLight} !important;
  }
  .saas-file-input::file-selector-button {
    background-color: #e2e8f0;
    color: ${colors.textMain};
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.75rem;
    margin-right: 0.75rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }
  .saas-file-input::file-selector-button:hover {
    background-color: #cbd5e1;
  }

  /* Utility Classes */
  .text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .text-truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
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

export default function SubmitAssignmentPage() {
  const studentId = localStorage.getItem("studentId");
  const studentClass = localStorage.getItem("studentClass");

  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", bg: "success" });
  const [timeLeft, setTimeLeft] = useState({});

  // --- LOGIC (UNCHANGED) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, subRes] = await Promise.all([
          api.get(`/api/studentDashboard/profile/${studentId}`),
          api.get(`/api/assignments/student/${studentId}`)
        ]);
        const profile = profileRes.data || {};
        const params = new URLSearchParams();
        if (profile.section) params.append("section", String(profile.section).toUpperCase());
        if (profile.stream) params.append("stream", profile.stream);
        if (profile.subjectChoice) params.append("subjectChoice", profile.subjectChoice);
        const qs = params.toString();
        const assignRes = await api.get(`/api/assignments/class/${studentClass}${qs ? `?${qs}` : ""}`);

        setAssignments(assignRes.data);
        setSubmissions(subRes.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentClass, studentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      const times = {};
      assignments.forEach((a) => {
        const diff = new Date(a.dueDate).getTime() - new Date().getTime();
        if (diff <= 0) {
          times[a._id] = "Expired";
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          times[a._id] = `${days}d ${hours}h ${minutes}m`;
        }
      });
      setTimeLeft(times);
    }, 1000);
    return () => clearInterval(timer);
  }, [assignments]);

  const handleSubmit = async (e, assignmentId) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return setToast({ show: true, message: "Select a file first", bg: "warning" });

    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("studentId", studentId);
    formData.append("file", file);

    try {
      const res = await api.post(`/api/assignments/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmissions([...submissions, res.data.submission]);
      setToast({ show: true, message: "Submitted successfully!", bg: "success" });
      e.target.reset();
    } catch (error) {
      setToast({ show: true, message: "Failed to submit.", bg: "danger" });
    }
  };

  const getSubmission = (id) => submissions.find(s => (s.assignmentId?._id || s.assignmentId) === id);

  // Calculate stats for the header
  const completedCount = submissions.length;
  const pendingCount = assignments.length - completedCount;

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <Spinner animation="border" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} />
        <p className="mt-3 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      <div className="container-fluid px-4 px-xl-5">
        
        {/* ---------- HEADER SECTION ---------- */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-mortarboard me-2"></i>Student Portal
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>My Assignments</h2>
            <p className="mb-0 small fw-medium" style={{ color: colors.textMuted }}>
              Manage your coursework, track deadlines, and submit your tasks.
            </p>
          </div>
          
          <div className="d-flex gap-3">
            <div className="saas-card px-4 py-3 text-center d-flex flex-column justify-content-center min-w-120">
              <span className="d-block small fw-bold text-uppercase" style={{ color: colors.textMuted, letterSpacing: '0.05em', fontSize: '0.7rem' }}>Pending</span>
              <span className="fs-3 fw-bolder mt-1" style={{ color: colors.warning, letterSpacing: '-1px' }}>{pendingCount}</span>
            </div>
            <div className="saas-card px-4 py-3 text-center d-flex flex-column justify-content-center min-w-120">
              <span className="d-block small fw-bold text-uppercase" style={{ color: colors.textMuted, letterSpacing: '0.05em', fontSize: '0.7rem' }}>Completed</span>
              <span className="fs-3 fw-bolder mt-1" style={{ color: colors.success, letterSpacing: '-1px' }}>{completedCount}</span>
            </div>
          </div>
        </div>

        {/* ---------- ASSIGNMENTS GRID ---------- */}
        {assignments.length === 0 ? (
          <div className="text-center py-5 my-5 saas-card">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: colors.bg }}>
              <i className="bi bi-journal-x fs-1" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
            </div>
            <h5 className="fw-bold mb-1" style={{ color: colors.textMain }}>No assignments pending</h5>
            <p className="small" style={{ color: colors.textMuted }}>You're all caught up! Enjoy your free time.</p>
          </div>
        ) : (
          <Row className="g-4">
            {assignments.map((a) => {
              const submission = getSubmission(a._id);
              const submitted = !!submission;
              const dueDate = new Date(a.dueDate);
              const isLate = new Date() > dueDate; 
              
              // Determine card border coloring based on status
              const borderStyle = submitted 
                ? `1px solid rgba(16, 185, 129, 0.4)` // Success border
                : isLate 
                  ? `1px solid rgba(239, 68, 68, 0.4)` // Danger border
                  : `1px solid ${colors.border}`; // Default border

              return (
                <Col xs={12} md={6} lg={4} xl={3} key={a._id}>
                  <div className="saas-card h-100 d-flex flex-column hover-lift" style={{ border: borderStyle, backgroundColor: colors.surface }}>
                    
                    {/* Card Header area (Subject & Timer) */}
                    <div className="p-4 pb-3 d-flex justify-content-between align-items-start gap-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                      <span className="badge px-3 py-2 rounded-pill text-truncate fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}`, maxWidth: '60%' }}>
                        <i className="bi bi-book me-2" style={{ color: colors.primary }}></i>
                        {a.subject}
                      </span>
                      
                      {!submitted ? (
                        <span 
                          className="badge px-2 py-1 rounded d-flex align-items-center fw-semibold"
                          style={{ 
                            backgroundColor: isLate ? colors.dangerLight : colors.warningLight, 
                            color: isLate ? colors.danger : colors.warning, 
                            border: `1px solid ${isLate ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` 
                          }}
                        >
                          <i className={`bi ${isLate ? "bi-x-circle" : "bi-stopwatch"} me-1`}></i>
                          {isLate ? "Expired" : timeLeft[a._id] || "..."}
                        </span>
                      ) : (
                        <span className="badge px-2 py-1 rounded d-flex align-items-center fw-semibold" style={{ backgroundColor: colors.successLight, color: colors.success, border: '1px solid rgba(16,185,129,0.2)' }}>
                          <i className="bi bi-check-all me-1"></i> Turned In
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-grow-1 d-flex flex-column">
                      {/* Title & Due Date */}
                      <div className="mb-3">
                        <h5 className="fw-semibold mb-2 text-truncate-2" style={{ color: colors.textMain, fontSize: '1.05rem', lineHeight: '1.4' }} title={a.title}>
                          {a.title}
                        </h5>
                        <div className="d-flex align-items-center small fw-medium" style={{ color: colors.textMuted }}>
                          <i className="bi bi-calendar-event me-2 opacity-75"></i>
                          Due: {dueDate.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="small mb-4 text-truncate-3" style={{ color: colors.textMuted, lineHeight: '1.6' }}>
                        {a.description || <span className="fst-italic opacity-75">No specific instructions provided.</span>}
                      </p>

                      {/* Spacer to push footer down */}
                      <div className="mt-auto"></div>

                      {/* Reference File Button */}
                      {a.file && (
                        <a 
                          href={`http://localhost:3000/${a.file}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn btn-sm w-100 text-start fw-medium mb-3 rounded-3 d-flex align-items-center transition-all"
                          style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}` }}
                        >
                          <div className="rounded p-1 me-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                            <i className="bi bi-file-earmark-arrow-down" style={{ color: colors.primary }}></i>
                          </div>
                          Reference Material
                        </a>
                      )}

                      {/* Footer Actions (Forms / Success State) */}
                      <div className="pt-3 mt-1 border-top" style={{ borderColor: colors.border }}>
                        {submitted ? (
                          <div className="p-3 rounded-3 text-center" style={{ backgroundColor: colors.successLight, border: `1px solid rgba(16,185,129,0.2)` }}>
                            <i className="bi bi-check-circle-fill fs-4 d-block mb-1" style={{ color: colors.success }}></i>
                            <span className="fw-bold small d-block mb-1" style={{ color: colors.success }}>Assignment Completed</span>
                            {submission.file && (
                              <a href={`http://localhost:3000/${submission.file}`} target="_blank" rel="noreferrer" 
                                className="badge text-decoration-none mt-2 px-3 py-2 rounded-pill btn-saas shadow-sm"
                                style={{ backgroundColor: colors.success, color: '#ffffff' }}>
                                <i className="bi bi-eye me-1"></i> View My Submission
                              </a>
                            )}
                          </div>
                        ) : isLate ? (
                          <div className="p-3 rounded-3 text-center" style={{ backgroundColor: colors.dangerLight, border: `1px solid rgba(239,68,68,0.2)` }}>
                            <i className="bi bi-lock-fill fs-4 d-block mb-1 opacity-75" style={{ color: colors.danger }}></i>
                            <span className="fw-bold small d-block" style={{ color: colors.danger }}>Submission Closed</span>
                            <small className="d-block mt-1 opacity-75" style={{ color: colors.danger }}>The deadline has passed.</small>
                          </div>
                        ) : (
                          <Form onSubmit={(e) => handleSubmit(e, a._id)}>
                            <Form.Group className="mb-3">
                              <Form.Control 
                                type="file" 
                                name="file" 
                                size="sm" 
                                disabled={isLate} 
                                required 
                                className="saas-file-input shadow-none rounded-3 p-1"
                              />
                            </Form.Group>
                            <button 
                              type="submit" 
                              disabled={isLate} 
                              className="btn btn-saas w-100 rounded-pill fw-semibold d-flex align-items-center justify-content-center py-2"
                              style={{ backgroundColor: colors.primary, color: '#ffffff', border: 'none', fontSize: '0.9rem' }}
                            >
                              <i className="bi bi-cloud-arrow-up-fill me-2"></i> Submit Work
                            </button>
                          </Form>
                        )}
                      </div>

                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}

        {/* ---------- TOAST NOTIFICATIONS ---------- */}
        <ToastContainer position="bottom-end" className="p-4" style={{ zIndex: 1060 }}>
          <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3500} autohide 
            className="border-0 shadow-lg rounded-4" 
            style={{ backgroundColor: colors[toast.bg], color: '#ffffff' }}>
            <Toast.Body className="fw-medium d-flex align-items-center p-3">
              <i className={`bi bi-${toast.bg === 'success' ? 'check-circle' : toast.bg === 'danger' ? 'x-octagon' : 'info-circle'} fs-5 me-3`}></i>
              {toast.message}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </div>
  );
}