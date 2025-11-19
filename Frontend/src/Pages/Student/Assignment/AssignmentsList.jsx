import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Table, Spinner, Alert, Form, Row, Col, Badge } from "react-bootstrap";

export default function StudentAssignments({ studentClasses }) {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [lastViewed, setLastViewed] = useState(
    localStorage.getItem("lastAssignmentViewTime")
  );

  // ✅ Fetch assignments from API
  useEffect(() => {
    const fetchAssignments = async () => {
      let classes = studentClasses;

      if (!classes || classes.length === 0) {
        const storedClass = localStorage.getItem("studentClass");
        classes = storedClass ? [storedClass] : [];
      }

      if (classes.length === 0) {
        setError("⚠️ No class information found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/api/assignments/classes`, {
          params: { classes: classes.join(",") },
        });

        const data = res.data || [];
        setAssignments(data);
        setFilteredAssignments(data);

        // Extract unique subjects
        const uniqueSubjects = [...new Set(data.map((a) => a.subject))];
        setSubjects(uniqueSubjects);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError("❌ Failed to load assignments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [studentClasses]);

  // ✅ Apply search and filter logic
  useEffect(() => {
    let filtered = assignments;

    if (selectedClass !== "All") {
      filtered = filtered.filter((a) =>
        Array.isArray(a.classAssigned)
          ? a.classAssigned.includes(selectedClass)
          : a.classAssigned === selectedClass
      );
    }

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
  }, [assignments, selectedClass, selectedSubject, searchTerm]);

  // ✅ Save last viewed timestamp (once per session)
  useEffect(() => {
    const now = new Date().toISOString();
    localStorage.setItem("lastAssignmentViewTime", now);
    setLastViewed(now);
  }, []);

  // ✅ Helper: Show 🆕 for new assignments (created after last viewed)
  const isNewAssignment = (createdAt) => {
    if (!lastViewed) return false;
    return new Date(createdAt) > new Date(lastViewed);
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="container mt-4">
      <h3 className="fw-bold mb-3 text-center">📘 Assignment Details</h3>

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      {/* 🔍 Filters */}
      <Row className="mb-3">
        <Col md={4} sm={12} className="mb-2">
          <Form.Control
            type="text"
            placeholder="🔍 Search by title or subject"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
       
        <Col md={4} sm={12} className="mb-2">
          <Form.Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* 📋 Assignments Table */}
      {filteredAssignments.length === 0 && !error ? (
        <Alert variant="info" className="text-center">
          No assignments match your search or filter.
        </Alert>
      ) : (
        <Table bordered hover responsive className="shadow-sm">
          <thead className="table-primary text-center">
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Class</th>
              <th>Attachment</th>
              <th>Posted On</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((a) => (
              <tr key={a._id}>
                <td>
                  {a.title}{" "}
                  {isNewAssignment(a.createdAt) && (
                    <Badge bg="success" className="ms-1">
                      🆕 New
                    </Badge>
                  )}
                </td>
                <td>{a.subject}</td>
                <td>{a.description || "—"}</td>
                <td>
                  {a.dueDate
                    ? new Date(a.dueDate).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  {Array.isArray(a.classAssigned)
                    ? a.classAssigned.join(", ")
                    : a.classAssigned}
                </td>
                <td>
                  {a.file ? (
                    <a
                      href={`http://localhost:3000/${a.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 Download
                    </a>
                  ) : (
                    "No File"
                  )}
                </td>
                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
