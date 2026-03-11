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

// --- CUSTOM STYLES ---
const styles = {
  page: { backgroundColor: "#f3f4f6", minHeight: "100vh", paddingBottom: "3rem" },
  card: { 
    border: "1px solid #e5e7eb", 
    borderRadius: "12px", 
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)", 
    height: "100%",
    backgroundColor: "#fff",
    transition: "all 0.2s ease-in-out",
    position: "relative",
    overflow: "hidden"
  },
  subjectPill: {
    position: "absolute",
    top: "12px",
    right: "12px",
    fontSize: "0.7rem",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #e5e7eb",
    padding: "4px 10px",
    borderRadius: "20px"
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#111827",
    paddingRight: "60px", // space for badge
    marginBottom: "0.5rem"
  },
  timerText: {
    fontSize: "0.8rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  footer: {
    backgroundColor: "#fff",
    padding: "1rem",
    borderTop: "1px solid #f3f4f6"
  },
  successBox: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "0.85rem",
    textAlign: "center",
    fontWeight: "600",
    border: "1px dashed #6ee7b7"
  }
};

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
      setToast({ show: true, message: "Submitted!", bg: "success" });
      e.target.reset();
    } catch (error) {
      setToast({ show: true, message: "Failed to submit.", bg: "danger" });
    }
  };

  const getSubmission = (id) => submissions.find(s => (s.assignmentId?._id || s.assignmentId) === id);

  if (loading) return <div className="text-center pt-5"><Spinner animation="border" variant="primary"/></div>;

  return (
    <div style={styles.page}>
      <div className="container-fluid px-4 pt-4">
        
        <div className="mb-4">
          <h3 className="fw-bold text-dark mb-1">Assignment Tasks</h3>
          <p className="text-muted small">Manage your submissions and deadlines.</p>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-5 text-muted">No assignments found.</div>
        ) : (
          <Row className="g-4">
            {assignments.map((a) => {
              const submission = getSubmission(a._id);
              const submitted = !!submission;
              const dueDate = new Date(a.dueDate);
              const isLate = new Date() > dueDate; 

              return (
                // CHANGED: xl={3} ensures 4 cards per row on large screens
                <Col xs={12} md={6} lg={4} xl={3} key={a._id}>
                  <Card style={styles.card} className="h-100">
                    
                    {/* Floating Subject Badge */}
                    <div style={styles.subjectPill}>
                      {a.subject}
                    </div>

                    <div className="p-3 pt-4 flex-grow-1">
                      {/* Title */}
                      <div style={styles.cardTitle} className="text-truncate">
                        {a.title}
                      </div>

                      {/* Timer & Due Date */}
                      <div className="mb-3">
                        {!submitted && (
                          <div style={styles.timerText} className={`mb-1 ${isLate ? 'text-danger' : 'text-primary'}`}>
                             <i className="bi bi-stopwatch"></i>
                             {isLate ? "Closed" : timeLeft[a._id] || "..."}
                          </div>
                        )}
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>
                           Due: {dueDate.toLocaleDateString()}
                        </small>
                      </div>

                      {/* Description */}
                      <p className="text-muted small mb-3 text-truncate">
                         {a.description || "No description."}
                      </p>

                      {/* Reference File Button */}
                      {a.file && (
                         <a href={`http://localhost:3000/${a.file}`} target="_blank" rel="noreferrer" 
                            className="btn btn-sm btn-light border w-100 text-start text-truncate text-muted"
                            style={{fontSize: '0.75rem'}}>
                            <i className="bi bi-paperclip me-2"></i>Download Reference
                         </a>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div style={styles.footer}>
                      {submitted ? (
                        <div style={styles.successBox}>
                           <i className="bi bi-check-circle-fill me-2"></i> Submitted
                           {submission.file && (
                             <a href={`http://localhost:3000/${submission.file}`} target="_blank" rel="noreferrer" 
                                className="d-block mt-1 text-decoration-none text-success small" style={{textDecoration: 'underline'}}>
                                (View File)
                             </a>
                           )}
                        </div>
                      ) : (
                        <Form onSubmit={(e) => handleSubmit(e, a._id)}>
                          <div className="d-flex gap-2">
                             <Form.Control 
                               type="file" 
                               name="file" 
                               size="sm" 
                               disabled={isLate} 
                               required 
                               className="shadow-none"
                               style={{fontSize: '0.75rem'}}
                             />
                             <Button 
                               type="submit" 
                               variant={isLate ? "secondary" : "dark"} 
                               disabled={isLate} 
                               size="sm"
                               className="px-3 fw-bold"
                             >
                               {isLate ? <i className="bi bi-lock-fill"></i> : <i className="bi bi-upload"></i>}
                             </Button>
                          </div>
                        </Form>
                      )}
                    </div>

                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        <ToastContainer position="bottom-end" className="p-3">
          <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3000} autohide bg={toast.bg}>
            <Toast.Body className="text-white">{toast.message}</Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </div>
  );
}
