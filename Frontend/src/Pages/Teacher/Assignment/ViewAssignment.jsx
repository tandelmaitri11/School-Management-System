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

  // ✅ Helper for toast
  const showToast = (message, variant = "primary") => {
    setToast({ show: true, message, variant });
  };

  // ✅ Fetch all teacher assignments
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/assignments/teacher/${teacherId}`);
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
      showToast("Error fetching assignments", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [teacherId]);

  // ✅ Delete assignment
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await api.delete(`/api/assignments/delete/${id}`);
      showToast("Assignment deleted successfully", "success");
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      showToast("Error deleting assignment", "danger");
    }
  };

  // ✅ Edit assignment
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

      await api.put(`/api/assignments/update/${editingAssignment._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchAssignments();
      setEditingAssignment(null);
      showToast("Assignment updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast(" Error updating assignment", "danger");
    }
  };

  // ✅ View submissions
  const handleViewSubmissions = async (assignmentId) => {
    setViewingSubmissions(assignmentId);
    setSubmissionsLoading(true);
    try {
      const res = await api.get(`/api/assignments/submissions/${assignmentId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch submissions", "danger");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // ✅ Grade submission
  const handleGrade = async (submissionId) => {
    try {
      await api.put(`/api/assignments/grade/${submissionId}`, { grade: gradeValue });
      showToast("Grade saved successfully", "success");
      setGrading(null);
      setGradeValue("");
      handleViewSubmissions(viewingSubmissions);
    } catch (err) {
      console.error(err);
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold text-dark"> My Assignments</h4>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-3">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="text-secondary border-bottom">
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Due Date</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? (
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
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewSubmissions(ass._id)}
                      >
                        Submissions
                      </Button>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(ass)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(ass._id)}
                      >
                         Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* 🧾 View Submissions Modal */}
      <Modal
        show={!!viewingSubmissions}
        onHide={() => setViewingSubmissions(null)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Student Submissions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submissionsLoading ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <p>Loading submissions...</p>
            </div>
          ) : submissions.length > 0 ? (
            <Table bordered hover>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Submitted On</th>
                  <th>File</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name || "Unknown"}</td>
                    <td>
                      {s.submittedAt
                        ? new Date(s.submittedAt).toLocaleString()
                        : "—"}
                    </td>
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
                        <>
                          <Form.Control
                            size="sm"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            placeholder="Enter grade"
                            className="d-inline-block w-50 me-2"
                          />
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleGrade(s._id)}
                          >
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline-primary"
                          size="sm"
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
          ) : (
            <p className="text-center text-muted">
              No students have submitted yet.
            </p>
          )}
        </Modal.Body>
      </Modal>

      {/* ✏️ Edit Assignment Modal */}
      <Modal show={!!editingAssignment} onHide={() => setEditingAssignment(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                rows={3}
                value={editForm.description}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                name="subject"
                value={editForm.subject}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="dueDate"
                value={editForm.dueDate}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>File (optional)</Form.Label>
              <Form.Control type="file" name="file" onChange={handleEditChange} />
            </Form.Group>
            <Button type="submit" variant="dark" className="w-100">
              Update Assignment
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 🔔 Toast */}
      <ToastContainer position="bottom-end" className="p-4">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white fw-semibold fs-6">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
