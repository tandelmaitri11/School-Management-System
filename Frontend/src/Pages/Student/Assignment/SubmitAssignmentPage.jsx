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
} from "react-bootstrap";

export default function SubmitAssignmentPage() {
  const studentId = localStorage.getItem("studentId");
  const studentClass = localStorage.getItem("studentClass");

  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", bg: "success" });
  const [timeLeft, setTimeLeft] = useState({}); // countdown timers

  // ✅ Fetch assignments & submissions
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/api/assignments/class/${studentClass}`);
        setAssignments(res.data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    const fetchSubmissions = async () => {
      try {
        const res = await api.get(`/api/assignments/student/${studentId}`);
        setSubmissions(res.data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    Promise.all([fetchAssignments(), fetchSubmissions()]).then(() =>
      setLoading(false)
    );
  }, [studentClass, studentId]);

  // ✅ Update countdown timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      const updatedTimes = {};
      assignments.forEach((a) => {
        const due = new Date(a.dueDate).getTime();
        const now = new Date().getTime();
        const diff = due - now;

        if (diff <= 0) {
          updatedTimes[a._id] = "⏰ Submission Closed";
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          updatedTimes[a._id] = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
        }
      });
      setTimeLeft(updatedTimes);
    }, 1000);

    return () => clearInterval(timer);
  }, [assignments]);

  const getSubmission = (assignmentId) =>
    submissions.find(
      (s) => s.assignmentId?._id === assignmentId || s.assignmentId === assignmentId
    );

  // ✅ Handle file submission
  const handleSubmit = async (e, assignmentId) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) {
      setToast({
        show: true,
        message: "⚠️ Please select a file before submitting.",
        bg: "warning",
      });
      return;
    }

    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("studentId", studentId);
    formData.append("file", file);

    try {
      const res = await api.post(`/api/assignments/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedSubmission = res.data.submission;

      setSubmissions((prev) => [...prev, updatedSubmission]);

      setToast({
        show: true,
        message: res.data.message || "✅ Assignment submitted successfully!",
        bg: "success",
      });

      e.target.reset();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      setToast({
        show: true,
        message: error.response?.data?.message || "❌ Submission failed. Try again.",
        bg: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4 text-center">📚 Submit Assignments</h3>

      {assignments.length === 0 ? (
        <p className="text-center text-muted">No assignments for your class.</p>
      ) : (
        <Row>
          {assignments.map((a) => {
            const submission = getSubmission(a._id);
            const submitted = !!submission;
            const dueDate = new Date(a.dueDate);
            const isLate = new Date() > dueDate;

            return (
              <Col md={6} className="mb-4" key={a._id}>
                <Card className="shadow-sm h-100 border-0">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      {/* Assignment Info */}
                      <div>
                        <Card.Title>{a.title}</Card.Title>
                        <Card.Text>{a.description}</Card.Text>
                        <p>
                          <strong>Subject:</strong> {a.subject}
                        </p>
                        <small className="text-muted">
                          Due: {dueDate.toLocaleString()}
                        </small>
                        <br />
                        {a.file && (
                          <a
                            href={`http://localhost:3000/${a.file}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📎 Download Assignment File
                          </a>
                        )}

                        <div
                          className={`mt-2 fw-bold ${
                            isLate ? "text-danger" : "text-primary"
                          }`}
                        >
                          {timeLeft[a._id] || ""}
                        </div>
                      </div>

                      {/* Submission Section */}
                      <div className="text-end">
                        {submitted ? (
                          <div>
                            <Button variant="success" disabled>
                              ✅ Submitted
                            </Button>
                            <Badge bg="info" className="ms-2">
                              Uploaded
                            </Badge>
                            <br />
                            <small className="text-muted">
                              Submitted on{" "}
                              {new Date(
                                submission.submittedAt || submission.createdAt
                              ).toLocaleString()}
                            </small>
                            {submission.file && (
                              <div className="mt-2">
                                <a
                                  href={`http://localhost:3000/${submission.file}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  📥 View Your File
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <form
                            onSubmit={(e) => handleSubmit(e, a._id)}
                            className="d-flex flex-column align-items-end"
                          >
                            <input
                              type="file"
                              name="file"
                              accept=".pdf,.docx,.png,.jpg,.jpeg"
                              required
                              className="form-control mb-2"
                              style={{ width: "250px" }}
                              disabled={isLate}
                            />
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={isLate}
                            >
                              {isLate ? "Closed" : "Submit"}
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ✅ Toast Notification */}
      <ToastContainer className="p-3" position="top-end">
        <Toast
          bg={toast.bg}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
