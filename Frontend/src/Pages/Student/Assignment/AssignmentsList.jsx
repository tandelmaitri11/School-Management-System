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
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// --- STYLES ---
const styles = {
  container: { backgroundColor: "#f8fafc", minHeight: "100vh", padding: "2rem" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    border: "none",
    overflow: "hidden", // Ensures table header rounded corners work
  },
  tableHead: {
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  title: { fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" },
  description: { color: "#64748b", fontSize: "0.8rem", maxWidth: "300px" },
};

export default function StudentAssignments({ studentClasses }) {
  const studentId = localStorage.getItem("studentId");
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [lastViewed] = useState(localStorage.getItem("lastAssignmentViewTime"));

  // --- FETCH DATA ---
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
        const res = await api.get(`/api/assignments/classes`, {
          params: { classes: classes.join(","), studentId },
        });

        const data = res.data || [];
        // Sort: Newest first
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setAssignments(data);
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

  // --- UPDATE VIEW TIME ---
  useEffect(() => {
    localStorage.setItem("lastAssignmentViewTime", new Date().toISOString());
  }, []);

  // --- FILTERS ---
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

  // --- HELPERS ---
  const getStatus = (dueDate) => {
    if (!dueDate) return { label: "No Date", bg: "secondary" };
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due < today) return { label: "Overdue", bg: "danger", text: "white" };
    if (due.getTime() === today.getTime()) return { label: "Due Today", bg: "warning", text: "dark" };
    return { label: "Upcoming", bg: "success", text: "white" };
  };

  const isNew = (date) => lastViewed && new Date(date) > new Date(lastViewed);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <div style={styles.container}>
      <div className="container-xl">
        
        {/* --- PAGE HEADER --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Assignments</h3>
            <p className="text-muted mb-0 small">
              Manage your coursework, check due dates, and download materials.
            </p>
          </div>
        </div>

        {/* --- TABLE CARD --- */}
        <div style={styles.card}>
          
          {/* Toolbar */}
          <div className="p-3 p-md-4 border-bottom bg-white">
            <Row className="g-3">
              <Col xs={12} md={5}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0 text-muted">
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search assignments..."
                    className="bg-light border-start-0 shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col xs={12} md={3}>
                <Form.Select 
                  className="bg-light border-0 shadow-none" 
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
            <div className="text-center py-5">
              <div className="text-muted mb-2"><i className="bi bi-folder-x fs-1"></i></div>
              <h6 className="text-muted">No assignments found</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead style={styles.tableHead}>
                  <tr>
                    <th className="py-3 ps-4">Assignment Details</th>
                    <th className="py-3">Subject</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Due Date</th>
                    <th className="py-3 text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => {
                    const status = getStatus(a.dueDate);
                    const isNewItem = isNew(a.createdAt);

                    return (
                      <tr key={a._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        
                        {/* 1. Title & Description */}
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-start">
                             <div className="me-3 mt-1 text-primary bg-primary-subtle rounded p-2">
                                <i className="bi bi-journal-text fs-5"></i>
                             </div>
                             <div>
                                <div style={styles.title}>
                                  {a.title}
                                  {isNewItem && (
                                    <Badge bg="primary" className="ms-2 rounded-pill" style={{ fontSize: "0.6rem" }}>
                                      NEW
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-truncate" style={styles.description}>
                                  {a.description || "No description provided."}
                                </div>
                             </div>
                          </div>
                        </td>

                        {/* 2. Subject */}
                        <td>
                          <Badge bg="light" text="dark" className="border fw-normal px-2 py-1">
                            {a.subject}
                          </Badge>
                        </td>

                        {/* 3. Status Badge */}
                        <td>
                          <Badge bg={status.bg} text={status.text} className="rounded-pill fw-normal px-3">
                            {status.label}
                          </Badge>
                        </td>

                        {/* 4. Due Date */}
                        <td className="text-muted small">
                          {a.dueDate ? (
                             <>
                                <i className="bi bi-calendar3 me-2"></i>
                                {new Date(a.dueDate).toLocaleDateString()}
                             </>
                          ) : "No Date"}
                        </td>

                        {/* 5. Actions */}
                        <td className="text-end pe-4">
                          {a.file ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-3"
                              href={`http://localhost:3000/${a.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="bi bi-download me-2"></i> Download
                            </Button>
                          ) : (
                            <span className="text-muted small fst-italic me-2">No File</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
