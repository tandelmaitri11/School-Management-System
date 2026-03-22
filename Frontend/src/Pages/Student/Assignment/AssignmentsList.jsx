import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import {
  Table,
  Spinner,
  Form,
  InputGroup,
  Button,
  Badge,
  Row,
  Col,
  Card
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function StudentAssignments({ studentClasses }) {
  const studentId = localStorage.getItem("studentId");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [lastViewed] = useState(localStorage.getItem("lastAssignmentViewTime"));

  // --- FETCH DATA (UNCHANGED) ---
  useEffect(() => {
    const fetchAssignments = async () => {
      let classes = studentClasses;
      if (!classes || classes.length === 0) {
        const storedClass = localStorage.getItem("studentClass");
        classes = storedClass ? [storedClass] : [];
      }

      if (classes.length === 0) {
        setError("No class found.");
        setLoading(false);
        return;
      }

      try {
        const [assignRes, submissionRes] = await Promise.all([
          api.get(`/api/assignments/classes`, {
            params: { classes: classes.join(","), studentId },
          }),
          api.get(`/api/assignments/student/${studentId}`),
        ]);

        const data = assignRes.data || [];
        // Sort: Newest first
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setAssignments(data);
        setSubmissions(submissionRes.data || []);
        setFilteredAssignments(data);
        setSubjects([...new Set(data.map((a) => a.subject))]);
      } catch (err) {
        setError("Failed to load assignments.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [studentClasses, studentId]);

  // --- UPDATE VIEW TIME (UNCHANGED) ---
  useEffect(() => {
    localStorage.setItem("lastAssignmentViewTime", new Date().toISOString());
  }, []);

  // --- FILTERS (UNCHANGED) ---
  useEffect(() => {
    let filtered = assignments;
    if (selectedSubject) {
      filtered = filtered.filter(
        (a) => a.subject && a.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(lower) ||
          (a.subject && a.subject.toLowerCase().includes(lower))
      );
    }
    setFilteredAssignments(filtered);
  }, [assignments, selectedSubject, searchTerm]);

  // --- HELPERS (UNCHANGED) ---
  const getStatus = (dueDate) => {
    if (!dueDate) return { label: "No Date", bg: "secondary", text: "white" };
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due < today) return { label: "Overdue", bg: "danger", text: "danger" };
    if (due.getTime() === today.getTime()) return { label: "Due Today", bg: "warning", text: "warning-dark" };
    return { label: "Upcoming", bg: "primary", text: "primary" };
  };

  const isNew = (date) => lastViewed && new Date(date) > new Date(lastViewed);
  const getSubmission = (assignmentId) =>
    submissions.find((s) => String(s.assignmentId?._id || s.assignmentId) === String(assignmentId));

  // --- DERIVED STATS FOR DASHBOARD UI ---
  const totalCount = filteredAssignments.length;
  const submittedCount = filteredAssignments.filter(a => getSubmission(a._id)).length;
  const pendingCount = totalCount - submittedCount;

  if (loading) return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
      <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      <p className="mt-3 fw-semibold text-muted tracking-wide">Loading Coursework...</p>
    </div>
  );

  if (error) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light text-danger fw-bold">
      <i className="bi bi-exclamation-triangle me-2"></i> {error}
    </div>
  );

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <div className="container-fluid px-3 px-md-5">
        
        {/* ---------- PAGE HEADER & STATS ---------- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3 border-bottom border-light-subtle pb-4">
          <div>
            <Badge bg="primary" className="bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill border border-primary border-opacity-25">
              <i className="bi bi-backpack me-2"></i>Study Hub
            </Badge>
            <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
              Course Materials
            </h2>
            <p className="text-secondary mb-0 small">
              Access your resources, check upcoming deadlines, and track your progress.
            </p>
          </div>

          <div className="d-flex gap-3">
            <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center">
              <span className="d-block text-muted small fw-bold text-uppercase tracking-wider">Pending</span>
              <span className="fs-4 fw-bolder text-warning">{pendingCount}</span>
            </div>
            <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center">
              <span className="d-block text-muted small fw-bold text-uppercase tracking-wider">Completed</span>
              <span className="fs-4 fw-bolder text-success">{submittedCount}</span>
            </div>
          </div>
        </div>

        {/* ---------- MAIN CARD ---------- */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          
          {/* Toolbar */}
          <div className="bg-white p-3 p-md-4 border-bottom border-light-subtle">
            <Row className="g-3 align-items-center">
              <Col xs={12} md={6} lg={4}>
                <InputGroup className="shadow-sm rounded-pill overflow-hidden border">
                  <InputGroup.Text className="bg-white border-0 text-muted ps-3">
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by title or subject..."
                    className="border-0 shadow-none bg-white py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col xs={12} md={4} lg={3}>
                <Form.Select 
                  className="shadow-sm rounded-pill border py-2 text-secondary fw-medium" 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Col>
            </Row>
          </div>

          {/* Table */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-5 my-4">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3">
                <i className="bi bi-folder2-open fs-1 text-secondary opacity-50"></i>
              </div>
              <h5 className="fw-bold text-dark mb-1">No materials found</h5>
              <p className="text-muted small">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ minHeight: "400px" }}>
              <Table hover className="align-middle mb-0 custom-hover-table">
                <thead className="bg-light border-bottom border-light">
                  <tr>
                    <th className="py-3 ps-4 text-uppercase small fw-bold text-secondary tracking-wide">Resource Info</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary tracking-wide">Subject</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary tracking-wide text-center">Status</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary tracking-wide text-center">Timeline</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary tracking-wide text-center">Progress</th>
                    <th className="py-3 text-end pe-4 text-uppercase small fw-bold text-secondary tracking-wide">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => {
                    const status = getStatus(a.dueDate);
                    const isNewItem = isNew(a.createdAt);
                    const submission = getSubmission(a._id);
                    const grade = submission?.grade || "";

                    return (
                      <tr key={a._id} className="border-bottom border-light">
                        
                        {/* 1. Title & Description */}
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-start">
                            <div className="me-3 mt-1 bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <i className="bi bi-journal-richtext fs-5"></i>
                            </div>
                            <div>
                              <div className="fw-bolder text-dark mb-1 d-flex align-items-center flex-wrap gap-2 text-truncate-2" style={{ fontSize: "0.95rem" }}>
                                {a.title}
                                {isNewItem && (
                                  <Badge bg="danger" className="rounded-pill animate-pulse" style={{ fontSize: "0.6rem", letterSpacing: "0.5px" }}>
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <div className="text-secondary small text-truncate-2" style={{ maxWidth: "350px", lineHeight: '1.4' }}>
                                {a.description || "No additional instructions provided."}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Subject */}
                        <td>
                          <Badge bg="light" text="dark" className="border shadow-sm px-3 py-2 rounded-pill fw-medium">
                            {a.subject}
                          </Badge>
                        </td>

                        {/* 3. Timeline / Due Status */}
                        <td className="text-center">
                          <Badge 
                            bg={status.bg} 
                            className={`bg-opacity-10 text-${status.text} border border-${status.bg} border-opacity-50 px-3 py-2 rounded-pill fw-semibold`}
                          >
                            {status.label}
                          </Badge>
                        </td>

                        {/* 4. Due Date */}
                        <td className="text-center text-muted small fw-medium">
                          {a.dueDate ? (
                             <div className="d-flex align-items-center justify-content-center gap-1">
                               <i className={`bi bi-calendar2-event ${status.label === 'Overdue' ? 'text-danger' : 'opacity-75'}`}></i>
                               {new Date(a.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric'})}
                             </div>
                          ) : "No Date"}
                        </td>

                        {/* 5. Submission / Grade Status */}
                        <td className="text-center">
                          {submission ? (
                            grade ? (
                              <Badge bg="success" className="rounded-pill px-3 py-2 shadow-sm fs-6">
                                Grade: {grade}
                              </Badge>
                            ) : (
                              <div className="d-inline-flex align-items-center text-success bg-success bg-opacity-10 px-3 py-1 rounded-pill border border-success border-opacity-25 small fw-bold">
                                <i className="bi bi-check2-circle me-1 fs-6"></i> Submitted
                              </div>
                            )
                          ) : (
                            <span className="text-muted small opacity-75 fw-medium"><i className="bi bi-dash"></i> Pending</span>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="text-end pe-4">
                          {a.file ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-3 py-1 fw-bold btn-hover-lift"
                              href={`http://localhost:3000/${a.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="bi bi-cloud-arrow-down-fill me-1"></i> Get File
                            </Button>
                          ) : (
                            <span className="text-muted small fst-italic me-3 opacity-50">No Attached File</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* ---------- CUSTOM STYLES ---------- */}
      <style>{`
        .custom-hover-table tbody tr {
          transition: background-color 0.2s ease;
        }
        .custom-hover-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .tracking-wide {
          letter-spacing: 0.5px;
        }
        .tracking-wider {
          letter-spacing: 1px;
        }
        .btn-hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(13, 110, 253, 0.15);
        }
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(220, 53, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
        /* Fix for Bootstrap warning text color contrast */
        .text-warning-dark {
          color: #b07d00 !important;
        }
      `}</style>
    </div>
  );
}