import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

export default function ViewAssignments() {
  const teacherId = localStorage.getItem("teacherId");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", variant: "info" });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    file: null,
    classAssigned: [],
  });

  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [grading, setGrading] = useState(null);
  const [gradeValue, setGradeValue] = useState("");

  const showToast = (message, variant = "primary") => {
    setToast({ show: true, message, variant });
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/assignments/teacher/${teacherId}`);
      setAssignments(res.data);
    } catch {
      showToast("Error fetching assignments", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [teacherId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await api.delete(`/api/assignments/delete/${id}`);
      showToast("Assignment deleted successfully", "success");
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch {
      showToast("Error deleting assignment", "danger");
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      dueDate: assignment.dueDate?.split("T")[0],
      file: null,
      classAssigned: assignment.classAssigned,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach((key) => {
        if (key === "classAssigned")
          formData.append(key, JSON.stringify(editForm[key]));
        else if (editForm[key]) formData.append(key, editForm[key]);
      });

      await api.put(`/api/assignments/update/${editingAssignment._id}`, formData);
      fetchAssignments();
      setEditingAssignment(null);
      showToast("Assignment updated successfully", "success");
    } catch {
      showToast("Error updating assignment", "danger");
    }
  };

  const handleViewSubmissions = async (assignmentId) => {
    setViewingSubmissions(assignmentId);
    setSubmissionsLoading(true);
    try {
      const res = await api.get(`/api/assignments/submissions/${assignmentId}`);
      setSubmissions(res.data);
    } catch {
      showToast("Failed to fetch submissions", "danger");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    try {
      await api.put(`/api/assignments/grade/${submissionId}`, { grade: gradeValue });
      showToast("Grade saved successfully", "success");
      setGrading(null);
      setGradeValue("");
      handleViewSubmissions(viewingSubmissions);
    } catch {
      showToast("Error grading submission", "danger");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="secondary" />
      </div>
    );

  return (
    <div className="container py-3 py-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h4 className="fw-semibold mb-3 mb-md-0">My Assignments</h4>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-2 p-md-3">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="text-secondary">
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Due</th>
                <th>File</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length ? (
                assignments.map((ass) => (
                  <tr key={ass._id}>
                    <td>{ass.title}</td>
                    <td>{ass.subject}</td>
                    <td>
                      {Array.isArray(ass.classAssigned)
                        ? ass.classAssigned.join(", ")
                        : ass.classAssigned}
                    </td>
                    <td>{ass.dueDate ? ass.dueDate.split("T")[0] : "—"}</td>
                    <td>
                      {ass.file ? (
                        <a
                          href={`http://localhost:3000/${ass.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column flex-md-row gap-2 justify-content-center">
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => handleViewSubmissions(ass._id)}
                        >
                          Submissions
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-dark"
                          onClick={() => handleEdit(ass)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(ass._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* View Submissions Modal */}
      <Modal show={!!viewingSubmissions} onHide={() => setViewingSubmissions(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Student Submissions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submissionsLoading ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
            </div>
          ) : submissions.length ? (
            <div className="table-responsive">
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>File</th>
                    <th>Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id}>
                      <td>{s.name || "Unknown"}</td>
                      <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}</td>
                      <td>
                        <a
                          href={`http://localhost:3000/${s.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      </td>
                      <td>{s.grade || "Not graded"}</td>
                      <td>
                        {grading === s._id ? (
                          <div className="d-flex gap-2">
                            <Form.Control
                              size="sm"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(e.target.value)}
                            />
                            <Button size="sm" onClick={() => handleGrade(s._id)}>
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setGrading(s._id)}
                          >
                            Grade
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted">No submissions yet.</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal show={!!editingAssignment} onHide={() => setEditingAssignment(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            {["title", "description", "subject", "dueDate"].map((field) => (
              <Form.Group className="mb-3" key={field}>
                <Form.Label className="text-capitalize">{field}</Form.Label>
                <Form.Control
                  type={field === "dueDate" ? "date" : "text"}
                  name={field}
                  value={editForm[field]}
                  onChange={handleEditChange}
                />
              </Form.Group>
            ))}
            <Form.Group className="mb-3">
              <Form.Label>File</Form.Label>
              <Form.Control type="file" name="file" onChange={handleEditChange} />
            </Form.Group>
            <Button type="submit" className="w-100" variant="dark">
              Update Assignment
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
          onClose={() => setToast({ ...toast, show: false })}
        >
          <Toast.Body className="text-white fw-semibold">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
