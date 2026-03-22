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
import "bootstrap-icons/font/bootstrap-icons.css";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleExtendDueDate = (assignment) => {
    handleEdit(assignment);
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
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fw-semibold text-muted">Loading Assignments...</p>
      </div>
    );

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-3 px-md-5">
      {/* ---------- HEADER AREA ---------- */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <Badge bg="primary" className="bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill border border-primary border-opacity-25">
            <i className="bi bi-journal-check me-2"></i>Teacher Workspace
          </Badge>
          <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Active Assignments</h2>
          <p className="text-secondary small mb-0">Manage homework, track deadlines, and review student submissions.</p>
        </div>
        <div className="bg-white border shadow-sm px-4 py-2 rounded-4 text-center">
          <span className="d-block text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Total Posted</span>
          <span className="fs-4 fw-bolder text-primary">{assignments.length}</span>
        </div>
      </div>

      {/* ---------- MAIN DATA TABLE ---------- */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0 custom-hover-table border-light">
            <thead className="bg-light border-bottom border-light">
              <tr>
                <th className="py-3 ps-4 text-uppercase small fw-bold text-secondary" style={{ letterSpacing: '0.5px' }}>Assignment Details</th>
                <th className="py-3 text-uppercase small fw-bold text-secondary" style={{ letterSpacing: '0.5px' }}>Class Scope</th>
                <th className="py-3 text-uppercase small fw-bold text-secondary text-center" style={{ letterSpacing: '0.5px' }}>Due Date</th>
                <th className="py-3 text-uppercase small fw-bold text-secondary text-center" style={{ letterSpacing: '0.5px' }}>Resource</th>
                <th className="py-3 pe-4 text-uppercase small fw-bold text-secondary text-end" style={{ letterSpacing: '0.5px' }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length ? (
                assignments.map((ass) => {
                  const isOverdue = ass.dueDate && new Date(ass.dueDate) < new Date();
                  
                  return (
                    <tr key={ass._id} className="border-bottom border-light">
                      <td className="ps-4 py-3">
                        <div className="fw-bold text-dark fs-6 mb-1">{ass.title}</div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium rounded-pill px-2 py-1">
                            <i className="bi bi-book me-1"></i> {ass.subject}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-2 mb-1">
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded">
                            Class {Array.isArray(ass.classAssigned) ? ass.classAssigned.join(", ") : ass.classAssigned}
                          </span>
                          <span className="badge bg-light text-dark border px-2 py-1 rounded">
                            Sec {ass.sectionAssigned || "N/A"}
                          </span>
                        </div>
                        <div className="small text-muted fw-medium mt-1 d-flex align-items-center">
                          <i className="bi bi-diagram-2 me-1 opacity-75"></i> 
                          {ass.streamAssigned || "General Stream"}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className={`d-inline-flex align-items-center px-3 py-1 rounded-pill border ${isOverdue ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-light text-dark'}`}>
                          <i className={`bi bi-calendar-event me-2 ${isOverdue ? '' : 'text-muted'}`}></i>
                          <span className="fw-semibold small">
                            {ass.dueDate ? ass.dueDate.split("T")[0] : "No Date"}
                          </span>
                        </div>
                        {isOverdue && <div className="text-danger small mt-1 fw-bold" style={{ fontSize: '0.7rem' }}>OVERDUE</div>}
                      </td>
                      <td className="text-center">
                        {ass.file ? (
                          <OverlayTrigger placement="top" overlay={tt("Download attached resource")}>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="rounded-pill px-3 py-1 fw-medium border-opacity-50"
                              href={`http://localhost:3000/${ass.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="bi bi-paperclip me-1"></i> View
                            </Button>
                          </OverlayTrigger>
                        ) : (
                          <span className="text-muted small px-3 py-1 bg-light rounded-pill border d-inline-block">No File</span>
                        )}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex gap-2 justify-content-end align-items-center">
                          <OverlayTrigger placement="top" overlay={tt("Review Submissions")}>
                            <Button
                              variant="primary"
                              className="btn-icon-hover shadow-sm d-flex align-items-center gap-1 rounded-pill px-3 py-1"
                              onClick={() => handleViewSubmissions(ass._id)}
                            >
                              <i className="bi bi-ui-checks"></i>
                              <span className="small fw-semibold d-none d-xl-inline">Grade</span>
                            </Button>
                          </OverlayTrigger>

                          <div className="vr mx-1 opacity-25"></div>

                          {isOverdue && (
                            <OverlayTrigger placement="top" overlay={tt("Extend deadline")}>
                              <Button
                                variant="light"
                                className="btn-icon-hover text-warning border shadow-sm rounded-circle d-flex align-items-center justify-content-center p-0"
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => handleExtendDueDate(ass)}
                              >
                                <i className="bi bi-calendar-plus"></i>
                              </Button>
                            </OverlayTrigger>
                          )}
                          
                          <OverlayTrigger placement="top" overlay={tt("Edit Assignment")}>
                            <Button
                              variant="light"
                              className="btn-icon-hover text-primary border shadow-sm rounded-circle d-flex align-items-center justify-content-center p-0"
                              style={{ width: '32px', height: '32px' }}
                              onClick={() => handleEdit(ass)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          </OverlayTrigger>
                          
                          <OverlayTrigger placement="top" overlay={tt("Delete")}>
                            <Button
                              variant="light"
                              className="btn-icon-hover text-danger border shadow-sm rounded-circle d-flex align-items-center justify-content-center p-0"
                              style={{ width: '32px', height: '32px' }}
                              onClick={() => handleDelete(ass._id)}
                            >
                              <i className="bi bi-trash3"></i>
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="d-flex flex-column align-items-center justify-content-center opacity-50 py-3">
                      <i className="bi bi-folder-x fs-1 text-secondary mb-2"></i>
                      <p className="mb-0 fw-semibold text-secondary">No assignments posted yet.</p>
                      <small className="text-muted">Assignments you create will appear here.</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* ---------- REVIEW SUBMISSIONS MODAL ---------- */}
      <Modal show={!!viewingSubmissions} onHide={() => setViewingSubmissions(null)} centered size="lg" className="border-0">
        <Modal.Header closeButton className="bg-light border-bottom px-4 pt-4 pb-3">
          <Modal.Title className="fw-bolder text-dark d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 text-primary p-2 rounded me-3 d-flex align-items-center justify-content-center">
              <i className="bi bi-check2-all fs-5"></i>
            </div>
            Student Submissions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-0 pb-0 pt-0 bg-white rounded-bottom-3">
          {submissionsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small fw-medium">Fetching records...</p>
            </div>
          ) : submissions.length ? (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 border-light">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 ps-4 text-uppercase small fw-bold text-secondary">Student Name</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary text-center">Status</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary text-center">Submitted On</th>
                    <th className="py-3 text-uppercase small fw-bold text-secondary text-center">Grade</th>
                    <th className="py-3 pe-4 text-uppercase small fw-bold text-secondary text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id || s.studentMongoId} className="border-bottom border-light">
                      <td className="ps-4 py-3 fw-semibold text-dark">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center fw-bold border" style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                            {s.name ? s.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          {s.name || "Unknown Student"}
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge 
                          bg={s.submitted ? "success" : "secondary"} 
                          className={`rounded-pill px-3 py-1 fw-medium ${s.submitted ? 'bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-opacity-10 text-secondary border border-secondary border-opacity-25'}`}
                        >
                          {s.submissionStatus || (s.submitted ? "Submitted" : "Pending")}
                        </Badge>
                      </td>
                      <td className="text-center small text-muted fw-medium">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="text-center">
                        {s.submitted && s.grade ? (
                          <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-50 px-3 py-1 fs-6 rounded-pill">
                            {s.grade}
                          </Badge>
                        ) : s.submitted ? (
                          <span className="badge bg-light text-muted border px-2 py-1">Needs Grade</span>
                        ) : (
                          <span className="text-muted opacity-50">—</span>
                        )}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex gap-2 justify-content-end align-items-center">
                          {s.submitted && s.file && (
                            <OverlayTrigger placement="top" overlay={tt("View File")}>
                              <a href={`http://localhost:3000/${s.file}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-light border rounded-circle text-primary d-flex align-items-center justify-content-center p-0" style={{ width: '30px', height: '30px' }}>
                                <i className="bi bi-file-earmark-text"></i>
                              </a>
                            </OverlayTrigger>
                          )}
                          
                          {s.submitted && grading === s._id ? (
                            <div className="d-flex align-items-center gap-1 bg-light border p-1 rounded-pill shadow-sm">
                              <Form.Control
                                size="sm"
                                className="border-0 shadow-none text-center rounded-pill bg-white"
                                style={{ width: "60px", padding: "0.1rem 0.5rem" }}
                                placeholder="A+"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                autoFocus
                              />
                              <Button size="sm" variant="success" className="rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px' }} onClick={() => handleGrade(s._id)}>
                                <i className="bi bi-check2"></i>
                              </Button>
                            </div>
                          ) : s.submitted ? (
                            <Button size="sm" variant="outline-primary" className="rounded-pill px-3 py-1 fw-medium" onClick={() => setGrading(s._id)}>
                              {s.grade ? "Edit Grade" : "Add Grade"}
                            </Button>
                          ) : (
                            <Button size="sm" variant="light" className="rounded-pill px-3 py-1 text-muted border" disabled>
                              Waiting
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5 bg-light m-3 rounded-4">
               <p className="text-muted mb-0 fw-medium">No students found for this assignment.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ---------- EDIT ASSIGNMENT MODAL ---------- */}
      <Modal show={!!editingAssignment} onHide={() => setEditingAssignment(null)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom-0 px-4 pt-4">
          <Modal.Title className="fw-bolder">Modify Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <Form onSubmit={handleEditSubmit}>
            {editingAssignment?.dueDate && new Date(editingAssignment.dueDate) < new Date() && (
              <div className="alert alert-danger bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 small fw-medium mb-4 rounded-3 d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                This assignment is currently overdue. Update the due date below to reopen submissions for students.
              </div>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-secondary tracking-wide">ASSIGNMENT TITLE</Form.Label>
              <Form.Control name="title" className="py-2 bg-light border-0 shadow-none" value={editForm.title} onChange={handleEditChange} required />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-secondary tracking-wide">DESCRIPTION / INSTRUCTIONS</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" className="bg-light border-0 shadow-none" value={editForm.description} onChange={handleEditChange} />
            </Form.Group>

            <div className="bg-light p-3 rounded-3 mb-4 border">
              <h6 className="fw-bold fs-6 mb-3 text-dark border-bottom pb-2">Scope & Subject</h6>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <Form.Label className="small fw-bold text-secondary tracking-wide mb-1">CLASS</Form.Label>
                  <Form.Select name="classAssigned" className="border shadow-none" value={editForm.classAssigned} onChange={handleEditChange} required>
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls.className}>Class {cls.className}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Label className="small fw-bold text-secondary tracking-wide mb-1">STREAM</Form.Label>
                  <Form.Select
                    name="streamAssigned"
                    className="border shadow-none"
                    value={editForm.streamAssigned}
                    onChange={handleEditChange}
                    disabled={!editForm.classAssigned || !classHasStreams || !hasAssignedStreams}
                  >
                    <option value="">{!classHasStreams ? "N/A" : hasAssignedStreams ? "Select Stream" : "No assigned stream"}</option>
                    {streamOptions.map((st) => <option key={st} value={st}>{st}</option>)}
                  </Form.Select>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Label className="small fw-bold text-secondary tracking-wide mb-1">SECTION</Form.Label>
                  <Form.Select
                    name="sectionAssigned"
                    className="border shadow-none"
                    value={editForm.sectionAssigned}
                    onChange={handleEditChange}
                    disabled={!editForm.classAssigned || (classHasStreams && !editForm.streamAssigned)}
                    required
                  >
                    <option value="">Select Section</option>
                    {sectionOptions.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
                  </Form.Select>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Label className="small fw-bold text-secondary tracking-wide mb-1">SUBJECT</Form.Label>
                  {subjectsLoading ? (
                    <div className="py-2 px-2 border rounded bg-white text-muted small d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" /> Loading...
                    </div>
                  ) : (
                    <Form.Select name="subject" className="border shadow-none" value={editForm.subject} onChange={handleEditChange} required>
                      <option value="">{subjects.length ? "Select Subject" : "No subjects"}</option>
                      {subjects.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                    </Form.Select>
                  )}
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <Form.Label className="small fw-bold text-secondary tracking-wide mb-1">DUE DATE</Form.Label>
                <Form.Control type="date" name="dueDate" className="py-2 bg-light border-0 shadow-none" value={editForm.dueDate} onChange={handleEditChange} required />
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="small fw-bold text-secondary tracking-wide mb-1">REPLACE ATTACHMENT</Form.Label>
                <Form.Control type="file" name="file" className="py-2 bg-light border-0 shadow-none" onChange={handleEditChange} />
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button variant="light" className="px-4 fw-medium border rounded-pill" onClick={() => setEditingAssignment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="px-4 fw-medium rounded-pill shadow-sm">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ---------- TOAST NOTIFICATIONS ---------- */}
      <ToastContainer position="bottom-end" className="p-4" style={{ zIndex: 1060 }}>
        <Toast show={toast.show} bg={toast.variant} delay={3500} autohide onClose={() => setToast({ ...toast, show: false })} className="border-0 text-white shadow-lg rounded-3">
          <Toast.Body className="fw-medium d-flex align-items-center">
            <i className={`bi bi-${toast.variant === 'success' ? 'check-circle' : toast.variant === 'danger' ? 'x-octagon' : 'info-circle'} fs-5 me-2`}></i>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* ---------- CUSTOM STYLES ---------- */}
      <style>{`
        .custom-hover-table tbody tr {
          transition: background-color 0.2s ease;
        }
        .custom-hover-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .btn-icon-hover {
          transition: all 0.2s ease;
        }
        .btn-icon-hover:hover {
          transform: translateY(-2px);
          filter: brightness(0.95);
        }
        .tracking-wide {
          letter-spacing: 0.5px;
        }
        /* Custom scrollbar for table modal */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8; 
        }
      `}</style>
    </div>
  );
}