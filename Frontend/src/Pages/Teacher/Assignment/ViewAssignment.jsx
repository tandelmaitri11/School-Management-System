import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/api";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Toast,
  ToastContainer,
  Badge,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

export default function ViewAssignments() {
  const teacherId = localStorage.getItem("teacherId");
  const normalize = (v) => String(v || "").trim();
  const normalizeUpper = (v) => normalize(v).toUpperCase();

  // --- LOGIC REMAINS UNTOUCHED ---
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
    classAssigned: "",
    sectionAssigned: "",
    streamAssigned: "",
  });
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [grading, setGrading] = useState(null);
  const [gradeValue, setGradeValue] = useState("");

  const showToast = (message, variant = "primary") => {
    setToast({ show: true, message, variant });
  };
  const tt = (text) => <Tooltip>{text}</Tooltip>;

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
        const profile = res.data || {};
        setClasses(profile.classesFull || []);
        setAssignedSections(profile.assignedSections || []);
      } catch {
        setClasses([]);
        setAssignedSections([]);
      }
    };
    if (teacherId) fetchProfile();
  }, [teacherId]);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.className) === String(editForm.classAssigned)) || null,
    [classes, editForm.classAssigned]
  );

  const assignedForClass = useMemo(
    () => assignedSections.filter((s) => String(s?.classId) === String(selectedClass?._id || "")),
    [assignedSections, selectedClass]
  );

  const classStreams = useMemo(
    () =>
      (selectedClass?.streams || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => normalize(s.name))
        .filter(Boolean),
    [selectedClass]
  );

  const streamOptions = useMemo(() => {
    if (classStreams.length === 0) return [];
    const assignedStreamSet = new Set(
      assignedForClass
        .map((s) => normalize(s?.stream))
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    );
    return classStreams.filter((st) => assignedStreamSet.has(st.toLowerCase()));
  }, [classStreams, assignedForClass]);

  const classHasStreams = classStreams.length > 0;
  const hasAssignedStreams = streamOptions.length > 0;

  const sectionOptions = useMemo(() => {
    const rows = assignedForClass
      .map((s) => ({ section: normalizeUpper(s.section), stream: normalize(s.stream) }))
      .filter((s) => s.section);

    if (classHasStreams) {
      if (!editForm.streamAssigned) return [];
      return [
        ...new Set(
          rows
            .filter((r) => normalize(r.stream).toLowerCase() === normalize(editForm.streamAssigned).toLowerCase())
            .map((r) => r.section)
        ),
      ];
    }

    return [...new Set(rows.map((r) => r.section))];
  }, [assignedForClass, classHasStreams, editForm.streamAssigned]);

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
      classAssigned: assignment.classAssigned || "",
      sectionAssigned: assignment.sectionAssigned || "",
      streamAssigned: assignment.streamAssigned || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "classAssigned") {
      setEditForm((prev) => ({
        ...prev,
        classAssigned: value,
        streamAssigned: "",
        sectionAssigned: "",
        subject: "",
      }));
      setSubjects([]);
      return;
    }

    if (name === "streamAssigned") {
      setEditForm((prev) => ({
        ...prev,
        streamAssigned: value,
        sectionAssigned: "",
        subject: "",
      }));
      setSubjects([]);
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!editingAssignment || !editForm.classAssigned) return;
      if (classHasStreams && !editForm.streamAssigned) {
        setSubjects([]);
        setEditForm((prev) => ({ ...prev, subject: "" }));
        return;
      }

      setSubjects([]);
      setSubjectsLoading(true);
      try {
        const qs = editForm.streamAssigned ? `?stream=${encodeURIComponent(editForm.streamAssigned)}` : "";
        const res = await api.get(`/api/subjects/getSubjects/${editForm.classAssigned}${qs}`);
        const rows = res.data || [];
        const normalized = rows
          .map((s) => (typeof s === "string" ? s : s.subjectName))
          .map((s) => String(s || "").trim())
          .filter(Boolean);
        const unique = Array.from(new Set(normalized));
        setSubjects(unique);
        if (unique.length > 0) {
          setEditForm((prev) => ({
            ...prev,
            subject: unique.includes(prev.subject) ? prev.subject : unique[0],
          }));
        } else {
          setEditForm((prev) => ({ ...prev, subject: "" }));
        }
      } catch {
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [editingAssignment, editForm.classAssigned, editForm.streamAssigned, classHasStreams]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (
      !editForm.classAssigned ||
      !editForm.sectionAssigned ||
      (classHasStreams && !editForm.streamAssigned) ||
      !editForm.subject
    ) {
      showToast("Please complete class/stream/section/subject scope", "warning");
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(editForm).forEach((key) => {
        if (editForm[key] !== null && editForm[key] !== undefined && editForm[key] !== "") {
          formData.append(key, editForm[key]);
        }
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
  // --- END OF UNTOUCHED LOGIC ---

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <Spinner animation="grow" variant="primary" />
      </div>
    );

  return (
    <div className="container py-4">
      {/* Header Area */}
      <div className="d-flex align-items-center justify-content-between mb-5">
        <div>
          <h3 className="fw-bold text-dark mb-1">Teacher Dashboard</h3>
          <p className="text-muted small mb-0">Manage your active assignments and grade submissions.</p>
        </div>
        <Badge bg="primary" pill className="px-3 py-2">
          {assignments.length} Total Assignments
        </Badge>
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: "15px" }}>
        <div className="table-responsive">
          <Table hover className="align-middle mb-0 custom-table">
            <thead className="bg-light">
              <tr>
                <th className="py-3 ps-4 text-uppercase small fw-bold text-muted">Details</th>
                <th className="py-3 text-uppercase small fw-bold text-muted">Scope</th>
                <th className="py-3 text-uppercase small fw-bold text-muted text-center">Due Date</th>
                <th className="py-3 text-uppercase small fw-bold text-muted text-center">Attachment</th>
                <th className="py-3 pe-4 text-uppercase small fw-bold text-muted text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length ? (
                assignments.map((ass) => (
                  <tr key={ass._id}>
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark">{ass.title}</div>
                      <div className="small text-primary fw-semibold">{ass.subject}</div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Badge bg="secondary" className="bg-opacity-10 text-secondary border">
                          Cl: {Array.isArray(ass.classAssigned) ? ass.classAssigned.join(", ") : ass.classAssigned}
                        </Badge>
                        <Badge bg="light" text="dark" className="border">
                          Sec: {ass.sectionAssigned || "N/A"}
                        </Badge>
                      </div>
                      <div className="mt-1 small text-muted">Stream: {ass.streamAssigned || "N/A"}</div>
                    </td>
                    <td className="text-center">
                      <span className={`small fw-bold ${new Date(ass.dueDate) < new Date() ? 'text-danger' : 'text-dark'}`}>
                        {ass.dueDate ? ass.dueDate.split("T")[0] : "-"}
                      </span>
                    </td>
                    <td className="text-center">
                      {ass.file ? (
                        <OverlayTrigger placement="top" overlay={tt("Open attached file")}>
                          <Button 
                            variant="link" 
                            className="p-0 text-decoration-none small"
                            href={`http://localhost:3000/${ass.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-paperclip me-1"></i>View File
                          </Button>
                        </OverlayTrigger>
                      ) : (
                        <span className="text-muted opacity-50 small">—</span>
                      )}
                    </td>
                    <td className="pe-4 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <OverlayTrigger placement="top" overlay={tt("View student submissions")}>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="rounded-pill px-3"
                            onClick={() => handleViewSubmissions(ass._id)}
                          >
                            Submissions
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={tt("Edit assignment")}>
                          <Button
                            size="sm"
                            variant="light"
                            className="rounded-circle border"
                            onClick={() => handleEdit(ass)}
                          >
                            ✎
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={tt("Delete assignment")}>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="rounded-circle"
                            onClick={() => handleDelete(ass._id)}
                          >
                            ✕
                          </Button>
                        </OverlayTrigger>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="text-muted">
                       <p className="mb-0">No assignments posted yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* View Submissions Modal */}
      <Modal show={!!viewingSubmissions} onHide={() => setViewingSubmissions(null)} centered size="lg" className="submission-modal">
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">Review Submissions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          {submissionsLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : submissions.length ? (
            <div className="table-responsive rounded-3 border">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr className="small text-uppercase">
                    <th>Student Name</th>
                    <th>Submitted On</th>
                    <th>Grade</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id}>
                      <td className="fw-semibold">{s.name || "Unknown Student"}</td>
                      <td className="small text-muted">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        {s.grade ? (
                          <Badge bg="success" className="bg-opacity-10 text-success border border-success">
                            {s.grade}
                          </Badge>
                        ) : (
                          <span className="text-muted small italic">Pending</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end align-items-center">
                          <a href={`http://localhost:3000/${s.file}`} target="_blank" className="btn btn-sm btn-link text-decoration-none">
                            Open
                          </a>
                          {grading === s._id ? (
                            <div className="d-flex gap-1">
                              <Form.Control
                                size="sm"
                                style={{ width: "60px" }}
                                placeholder="80"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                              />
                              <Button size="sm" variant="success" onClick={() => handleGrade(s._id)}>✓</Button>
                            </div>
                          ) : (
                            <OverlayTrigger placement="top" overlay={tt("Add or update grade")}>
                              <Button size="sm" variant="dark" className="rounded-pill px-3" onClick={() => setGrading(s._id)}>Grade</Button>
                            </OverlayTrigger>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 border rounded-3 bg-light">
               <p className="text-muted mb-0 small">No students have submitted this assignment yet.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal show={!!editingAssignment} onHide={() => setEditingAssignment(null)} centered>
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">Modify Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">ASSIGNMENT TITLE</Form.Label>
              <Form.Control name="title" className="py-2 border-2" value={editForm.title} onChange={handleEditChange} />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">DESCRIPTION</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" className="border-2" value={editForm.description} onChange={handleEditChange} />
            </Form.Group>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <Form.Label className="small fw-bold text-muted">CLASS</Form.Label>
                <Form.Select name="classAssigned" className="border-2" value={editForm.classAssigned} onChange={handleEditChange}>
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.className}>
                      Class {cls.className}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-6">
                <Form.Label className="small fw-bold text-muted">STREAM</Form.Label>
                <Form.Select
                  name="streamAssigned"
                  className="border-2"
                  value={editForm.streamAssigned}
                  onChange={handleEditChange}
                  disabled={!editForm.classAssigned || !classHasStreams || !hasAssignedStreams}
                >
                  <option value="">
                    {!classHasStreams ? "N/A" : hasAssignedStreams ? "Select Stream" : "No assigned stream"}
                  </option>
                  {streamOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-6">
                <Form.Label className="small fw-bold text-muted">SECTION</Form.Label>
                <Form.Select
                  name="sectionAssigned"
                  className="border-2"
                  value={editForm.sectionAssigned}
                  onChange={handleEditChange}
                  disabled={!editForm.classAssigned || (classHasStreams && !editForm.streamAssigned)}
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-6">
                <Form.Label className="small fw-bold text-muted">SUBJECT</Form.Label>
                {subjectsLoading ? (
                  <div className="py-1">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <Form.Select name="subject" className="border-2" value={editForm.subject} onChange={handleEditChange}>
                    <option value="">{subjects.length ? "Select Subject" : "No subjects"}</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </div>
              <div className="col-6">
                <Form.Label className="small fw-bold text-muted">DUE DATE</Form.Label>
                <Form.Control type="date" name="dueDate" className="border-2" value={editForm.dueDate} onChange={handleEditChange} />
              </div>
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">REPLACE FILE (OPTIONAL)</Form.Label>
              <Form.Control type="file" name="file" className="border-2" onChange={handleEditChange} />
            </Form.Group>

            <Button type="submit" className="w-100 py-2 fw-bold shadow-sm rounded-pill" variant="primary">
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast show={toast.show} bg={toast.variant} delay={3000} autohide onClose={() => setToast({ ...toast, show: false })} className="border-0 text-white shadow-lg">
          <Toast.Body className="fw-semibold">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
