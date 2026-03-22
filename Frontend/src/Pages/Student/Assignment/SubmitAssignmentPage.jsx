import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import {
  Badge,
  Button,
  Card,
  Spinner,
  Row,
  Col,
  Toast,
  ToastContainer,
  Form
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fw-semibold text-muted">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <div className="container-fluid px-3 px-md-5">
        
        {/* ---------- HEADER SECTION ---------- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pb-3 border-bottom border-light-subtle gap-3">
          <div>
            <Badge bg="primary" className="bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill border border-primary border-opacity-25">
              <i className="bi bi-mortarboard me-2"></i>Student Portal
            </Badge>
            <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>My Assignments</h2>
            <p className="text-secondary mb-0">Manage your coursework, track deadlines, and submit your tasks.</p>
          </div>
          
          <div className="d-flex gap-3">
            <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center">
              <span className="d-block text-muted small fw-bold text-uppercase tracking-wider">Pending</span>
              <span className="fs-4 fw-bolder text-warning">{pendingCount}</span>
            </div>
            <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center">
              <span className="d-block text-muted small fw-bold text-uppercase tracking-wider">Completed</span>
              <span className="fs-4 fw-bolder text-success">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* ---------- ASSIGNMENTS GRID ---------- */}
        {assignments.length === 0 ? (
          <div className="text-center py-5 my-5 bg-white border shadow-sm rounded-4">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3">
              <i className="bi bi-journal-x fs-1 text-secondary opacity-50"></i>
            </div>
            <h5 className="fw-bold text-dark mb-1">No assignments pending</h5>
            <p className="text-muted">You're all caught up! Enjoy your free time.</p>
          </div>
        ) : (
          <Row className="g-4">
            {assignments.map((a) => {
              const submission = getSubmission(a._id);
              const submitted = !!submission;
              const dueDate = new Date(a.dueDate);
              const isLate = new Date() > dueDate; 
              
              // Determine card styling based on status
              const cardStatusClass = submitted 
                ? "border-success border-opacity-25" 
                : isLate 
                  ? "border-danger border-opacity-25" 
                  : "border-primary border-opacity-10";

              return (
                <Col xs={12} md={6} lg={4} xl={3} key={a._id}>
                  <Card className={`border shadow-sm rounded-4 h-100 hover-lift ${cardStatusClass}`}>
                    
                    {/* Card Header area (Subject & Timer) */}
                    <div className="p-4 pb-0 d-flex justify-content-between align-items-start gap-2">
                      <Badge bg="light" text="dark" className="border shadow-sm px-3 py-2 rounded-pill text-truncate" style={{ maxWidth: '60%' }}>
                        <i className="bi bi-book text-primary me-2"></i>
                        {a.subject}
                      </Badge>
                      
                      {!submitted ? (
                        <Badge 
                          bg={isLate ? "danger" : "warning"} 
                          className={`bg-opacity-10 text-${isLate ? "danger" : "warning-dark"} border border-${isLate ? "danger" : "warning"} border-opacity-50 px-2 py-1 rounded d-flex align-items-center`}
                        >
                          <i className={`bi ${isLate ? "bi-x-circle" : "bi-stopwatch"} me-1`}></i>
                          {isLate ? "Expired" : timeLeft[a._id] || "..."}
                        </Badge>
                      ) : (
                        <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-50 px-2 py-1 rounded d-flex align-items-center">
                          <i className="bi bi-check-all me-1"></i> Turned In
                        </Badge>
                      )}
                    </div>

                    <Card.Body className="p-4 d-flex flex-column">
                      {/* Title & Due Date */}
                      <div className="mb-3">
                        <h5 className="fw-bolder text-dark mb-2 text-truncate-2" title={a.title}>
                          {a.title}
                        </h5>
                        <div className="d-flex align-items-center text-muted small fw-medium">
                          <i className="bi bi-calendar-event me-2 opacity-75"></i>
                          Due: {dueDate.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-secondary small mb-4 text-truncate-3" style={{ lineHeight: '1.6' }}>
                        {a.description || "No specific instructions provided."}
                      </p>

                      {/* Spacer to push footer down */}
                      <div className="mt-auto"></div>

                      {/* Reference File Button */}
                      {a.file && (
                        <a 
                          href={`http://localhost:3000/${a.file}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn btn-light border bg-gradient w-100 text-start text-dark fw-medium mb-3 rounded-3 d-flex align-items-center transition-hover group"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <div className="bg-white border rounded p-1 me-2 shadow-sm">
                            <i className="bi bi-file-earmark-arrow-down text-primary"></i>
                          </div>
                          Reference Material
                        </a>
                      )}

                      {/* Footer Actions (Forms / Success State) */}
                      <div className="pt-3 border-top border-light-subtle">
                        {submitted ? (
                          <div className="bg-success bg-opacity-10 text-success p-3 rounded-3 border border-success border-opacity-25 text-center">
                            <i className="bi bi-check-circle-fill fs-3 d-block mb-1"></i>
                            <span className="fw-bold small d-block mb-1">Assignment Completed</span>
                            {submission.file && (
                              <a href={`http://localhost:3000/${submission.file}`} target="_blank" rel="noreferrer" 
                                className="badge bg-success text-white text-decoration-none mt-2 px-3 py-2 rounded-pill shadow-sm">
                                <i className="bi bi-eye me-1"></i> View My Submission
                              </a>
                            )}
                          </div>
                        ) : isLate ? (
                          <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-3 border border-danger border-opacity-25 text-center">
                            <i className="bi bi-lock-fill fs-3 d-block mb-1 opacity-75"></i>
                            <span className="fw-bold small">Submission Closed</span>
                            <small className="d-block mt-1 opacity-75">The deadline has passed.</small>
                          </div>
                        ) : (
                          <Form onSubmit={(e) => handleSubmit(e, a._id)}>
                            <Form.Group className="mb-2">
                              <Form.Control 
                                type="file" 
                                name="file" 
                                size="sm" 
                                disabled={isLate} 
                                required 
                                className="bg-light border-0 shadow-none text-muted rounded-3"
                                style={{ fontSize: '0.8rem' }}
                              />
                            </Form.Group>
                            <Button 
                              type="submit" 
                              variant="primary" 
                              disabled={isLate} 
                              size="sm"
                              className="w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center py-2"
                            >
                              <i className="bi bi-cloud-arrow-up-fill me-2"></i> Submit Work
                            </Button>
                          </Form>
                        )}
                      </div>

                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* ---------- TOAST NOTIFICATIONS ---------- */}
        <ToastContainer position="bottom-end" className="p-4" style={{ zIndex: 1060 }}>
          <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3500} autohide bg={toast.bg} className="border-0 text-white shadow-lg rounded-3">
            <Toast.Body className="fw-medium d-flex align-items-center">
              <i className={`bi bi-${toast.bg === 'success' ? 'check-circle' : toast.bg === 'danger' ? 'x-octagon' : 'info-circle'} fs-5 me-2`}></i>
              {toast.message}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>

      {/* ---------- CUSTOM CSS ---------- */}
      <style>{`
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
        }
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
        .tracking-wider {
          letter-spacing: 1px;
        }
        .transition-hover {
          transition: all 0.2s ease;
        }
        .transition-hover:hover {
          background-color: #f8f9fa !important;
          border-color: #dee2e6 !important;
        }
        /* Custom darker warning color for text contrast */
        .text-warning-dark {
          color: #b07d00 !important;
        }
      `}</style>
    </div>
  );
}