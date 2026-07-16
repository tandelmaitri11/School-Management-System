import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import {
  Spinner,
  Form,
  InputGroup,
  Row,
  Col
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
    color: #334155;
    font-size: 0.9rem;
  }
  .saas-table tr:last-child td { border-bottom: none; }
  .saas-table tbody tr { transition: background-color 0.2s ease; }
  .saas-table tbody tr:hover { background-color: #f8fafc; }

  /* Form Controls */
  .saas-input {
    border: 1px solid ${colors.border};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    font-size: 0.9rem;
    color: ${colors.textMain};
  }
  .saas-input:focus {
    border-color: #cbd5e1;
    box-shadow: 0 0 0 3px ${colors.infoLight};
  }

  /* Custom Utilities */
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
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  .btn-hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .btn-hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
  }
`;

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

  // --- FETCH DATA (UNCHANGED LOGIC) ---
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

  // --- UPDATE VIEW TIME (UNCHANGED LOGIC) ---
  useEffect(() => {
    localStorage.setItem("lastAssignmentViewTime", new Date().toISOString());
  }, []);

  // --- FILTERS (UNCHANGED LOGIC) ---
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

  // --- HELPERS (UPDATED TO SAAS COLORS) ---
  const getStatus = (dueDate) => {
    if (!dueDate) return { label: "No Date", bg: colors.bg, text: colors.textMuted, border: colors.border };
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due < today) return { label: "Overdue", bg: colors.dangerLight, text: colors.danger, border: "rgba(239,68,68,0.2)" };
    if (due.getTime() === today.getTime()) return { label: "Due Today", bg: colors.warningLight, text: colors.warning, border: "rgba(245,158,11,0.2)" };
    return { label: "Upcoming", bg: colors.primaryLight, text: colors.primary, border: "rgba(79,70,229,0.2)" };
  };

  const isNew = (date) => lastViewed && new Date(date) > new Date(lastViewed);
  const getSubmission = (assignmentId) =>
    submissions.find((s) => String(s.assignmentId?._id || s.assignmentId) === String(assignmentId));

  // --- DERIVED STATS ---
  const totalCount = filteredAssignments.length;
  const submittedCount = filteredAssignments.filter(a => getSubmission(a._id)).length;
  const pendingCount = totalCount - submittedCount;

  if (loading) return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
      <Spinner animation="border" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} />
      <p className="mt-3 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Loading Coursework...</p>
    </div>
  );

  if (error) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
       <div className="saas-card p-4 text-center">
          <i className="bi bi-exclamation-triangle fs-1 text-danger mb-3 d-block"></i>
          <span className="fw-semibold" style={{ color: colors.textMain }}>{error}</span>
       </div>
    </div>
  );

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* ---------- PAGE HEADER & STATS ---------- */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)`, letterSpacing: "0.5px" }}>
              <i className="bi bi-journal-bookmark me-2"></i>Study Hub
            </div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
              Course Materials
            </h2>
            <p className="mb-0 small fw-medium" style={{ color: colors.textMuted }}>
              Access your resources, check upcoming deadlines, and track your progress.
            </p>
          </div>

          <div className="d-flex gap-3">
            <div className="saas-card px-4 py-3 text-center d-flex flex-column justify-content-center min-w-120">
              <span className="d-block small fw-bold text-uppercase" style={{ color: colors.textMuted, letterSpacing: '0.05em', fontSize: '0.7rem' }}>Pending</span>
              <span className="fs-3 fw-bolder mt-1" style={{ color: colors.warning, letterSpacing: '-1px' }}>{pendingCount}</span>
            </div>
            <div className="saas-card px-4 py-3 text-center d-flex flex-column justify-content-center min-w-120">
              <span className="d-block small fw-bold text-uppercase" style={{ color: colors.textMuted, letterSpacing: '0.05em', fontSize: '0.7rem' }}>Completed</span>
              <span className="fs-3 fw-bolder mt-1" style={{ color: colors.success, letterSpacing: '-1px' }}>{submittedCount}</span>
            </div>
          </div>
        </div>

        {/* ---------- MAIN CARD ---------- */}
        <div className="saas-card overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-3 p-md-4" style={{ backgroundColor: '#ffffff', borderBottom: `1px solid ${colors.border}` }}>
            <Row className="g-3 align-items-center">
              <Col xs={12} md={6} lg={4}>
                <InputGroup className="saas-input rounded-pill overflow-hidden bg-white">
                  <InputGroup.Text className="bg-transparent border-0 text-muted ps-3 pe-2">
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by title or subject..."
                    className="border-0 shadow-none bg-transparent py-2 px-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ fontSize: '0.9rem' }}
                  />
                </InputGroup>
              </Col>
              <Col xs={12} md={4} lg={3}>
                <Form.Select 
                  className="saas-input rounded-pill py-2 fw-medium" 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{ color: colors.textMain }}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Col>
            </Row>
          </div>

          {/* Table Area */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-5 my-4">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ backgroundColor: colors.bg }}>
                <i className="bi bi-folder2-open fs-1" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
              </div>
              <h5 className="fw-bold mb-1" style={{ color: colors.textMain }}>No materials found</h5>
              <p className="small" style={{ color: colors.textMuted }}>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ minHeight: "400px" }}>
              <table className="saas-table">
                <thead>
                  <tr>
                    <th className="ps-4">Resource Info</th>
                    <th>Subject</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Timeline</th>
                    <th className="text-center">Progress</th>
                    <th className="text-end pe-4">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => {
                    const status = getStatus(a.dueDate);
                    const isNewItem = isNew(a.createdAt);
                    const submission = getSubmission(a._id);
                    const grade = submission?.grade || "";

                    return (
                      <tr key={a._id}>
                        
                        {/* 1. Title & Description */}
                        <td className="ps-4">
                          <div className="d-flex align-items-start">
                            <div className="me-3 mt-1 rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                              <i className="bi bi-journal-richtext fs-5"></i>
                            </div>
                            <div>
                              <div className="fw-semibold mb-1 d-flex align-items-center flex-wrap gap-2 text-truncate-2" style={{ color: colors.textMain, fontSize: "0.95rem" }}>
                                {a.title}
                                {isNewItem && (
                                  <span className="badge rounded-pill animate-pulse" style={{ backgroundColor: colors.danger, fontSize: "0.6rem", letterSpacing: "0.05em", padding: "0.25em 0.6em" }}>
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="small text-truncate-2" style={{ color: colors.textMuted, maxWidth: "350px", lineHeight: '1.5' }}>
                                {a.description || <span className="fst-italic opacity-75">No additional instructions provided.</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Subject */}
                        <td>
                          <span className="badge px-3 py-2 rounded-pill fw-medium" style={{ backgroundColor: colors.bg, color: colors.textMain, border: `1px solid ${colors.border}` }}>
                            {a.subject}
                          </span>
                        </td>

                        {/* 3. Timeline / Due Status */}
                        <td className="text-center">
                          <span 
                            className="badge px-3 py-2 rounded-pill fw-semibold"
                            style={{ backgroundColor: status.bg, color: status.text, border: `1px solid ${status.border}` }}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* 4. Due Date */}
                        <td className="text-center small fw-medium">
                          {a.dueDate ? (
                             <div className="d-flex align-items-center justify-content-center gap-2" style={{ color: status.label === 'Overdue' ? colors.danger : colors.textMuted }}>
                               <i className={`bi bi-calendar2-event ${status.label !== 'Overdue' && 'opacity-75'}`}></i>
                               {new Date(a.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric'})}
                             </div>
                          ) : (
                             <span style={{ color: colors.textMuted }}>No Date</span>
                          )}
                        </td>

                        {/* 5. Submission / Grade Status */}
                        <td className="text-center">
                          {submission ? (
                            grade ? (
                              <span className="badge rounded-pill px-3 py-2 shadow-sm" style={{ backgroundColor: colors.success, fontSize: '0.8rem' }}>
                                Grade: {grade}
                              </span>
                            ) : (
                              <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill small fw-bold" style={{ backgroundColor: colors.successLight, color: colors.success, border: `1px solid rgba(16,185,129,0.2)` }}>
                                <i className="bi bi-check2-circle me-1 fs-6"></i> Submitted
                              </div>
                            )
                          ) : (
                            <span className="small fw-medium" style={{ color: colors.textMuted, opacity: 0.8 }}><i className="bi bi-dash"></i> Pending</span>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="text-end pe-4">
                          {a.file ? (
                            <a
                              className="btn btn-sm rounded-pill px-3 py-1 fw-semibold btn-hover-lift"
                              style={{ backgroundColor: '#ffffff', color: colors.primary, border: `1px solid ${colors.primary}`, fontSize: '0.8rem' }}
                              href={`http://localhost:3000/${a.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="bi bi-cloud-arrow-down-fill me-1"></i> Get File
                            </a>
                          ) : (
                            <span className="small fst-italic me-3" style={{ color: colors.textMuted, opacity: 0.6 }}>No File</span>
                          )}
                        </td>
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}