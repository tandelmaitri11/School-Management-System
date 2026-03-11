import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Form, Button, Spinner, Toast, ToastContainer, Row, Col } from "react-bootstrap";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "zip", "rar"];

export default function AddAssignment() {
  const teacherId = localStorage.getItem("teacherId");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    classAssigned: "",
    sectionAssigned: "",
    streamAssigned: "",
  });

  const [file, setFile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", variant: "" });

  const showToast = (message, variant = "info") => {
    setToast({ show: true, message, variant });
  };

  const todayIso = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
        const profile = res.data || {};
        setClasses(profile.classesFull || []);
        setAssignedSections(profile.assignedSections || []);
      } catch {
        showToast("Could not fetch classes", "danger");
      } finally {
        setLoading(false);
      }
    };
    if (teacherId) fetchClasses();
  }, [teacherId]);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.className) === String(formData.classAssigned)) || null,
    [classes, formData.classAssigned]
  );

  const assignedForClass = useMemo(
    () => assignedSections.filter((s) => String(s?.classId) === String(selectedClass?._id || "")),
    [assignedSections, selectedClass]
  );

  const classStreams = useMemo(
    () =>
      (selectedClass?.streams || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => String(s?.name || "").trim())
        .filter(Boolean),
    [selectedClass]
  );

  const streamOptions = useMemo(
    () => {
      if (classStreams.length === 0) return [];
      const assignedStreamSet = new Set(
        assignedForClass
          .map((s) => String(s?.stream || "").trim())
          .filter(Boolean)
          .map((s) => s.toLowerCase())
      );
      return classStreams.filter((st) => assignedStreamSet.has(st.toLowerCase()));
    },
    [classStreams, assignedForClass]
  );
  const classHasStreams = classStreams.length > 0;
  const hasStreams = streamOptions.length > 0;

  const sectionOptions = useMemo(() => {
    const rows = assignedForClass
      .map((s) => ({
        section: String(s?.section || "").trim().toUpperCase(),
        stream: String(s?.stream || "").trim(),
      }))
      .filter((s) => s.section);

    if (classHasStreams) {
      if (!formData.streamAssigned) return [];
      const scoped = rows.filter(
        (s) => s.stream.toLowerCase() === String(formData.streamAssigned).trim().toLowerCase()
      );
      return [...new Set(scoped.map((s) => s.section))];
    }

    return [...new Set(rows.map((s) => s.section))];
  }, [assignedForClass, classHasStreams, formData.streamAssigned]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.classAssigned) return;
      if (classHasStreams && !formData.streamAssigned) {
        setSubjects([]);
        setSubjectsError("Select stream first");
        setFormData((prev) => ({ ...prev, subject: "" }));
        return;
      }

      setSubjects([]);
      setSubjectsError("");
      setSubjectsLoading(true);

      try {
        const qs = formData.streamAssigned
          ? `?stream=${encodeURIComponent(formData.streamAssigned)}`
          : "";
        const res = await api.get(`/api/subjects/getSubjects/${formData.classAssigned}${qs}`);
        const rows = res.data || [];
        const normalized = rows
          .map((s) => (typeof s === "string" ? s : s.subjectName))
          .map((s) => String(s || "").trim())
          .filter(Boolean);
        const unique = Array.from(new Set(normalized));
        setSubjects(unique);

        if (unique.length > 0) {
          setFormData((prev) => ({ ...prev, subject: unique[0] }));
        } else {
          setSubjectsError("No subjects available");
          setFormData((prev) => ({ ...prev, subject: "" }));
        }
      } catch {
        setSubjectsError("Could not fetch subjects");
        setFormData((prev) => ({ ...prev, subject: "" }));
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [formData.classAssigned, formData.streamAssigned, classHasStreams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "classAssigned") {
      setFormData((prev) => ({
        ...prev,
        classAssigned: value,
        streamAssigned: "",
        sectionAssigned: "",
        subject: "",
      }));
      setSubjects([]);
      setSubjectsError("");
      return;
    }

    if (name === "streamAssigned") {
      setFormData((prev) => ({
        ...prev,
        streamAssigned: value,
        sectionAssigned: "",
        subject: "",
      }));
      setSubjects([]);
      setSubjectsError("");
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const title = String(formData.title || "").trim();
    const subject = String(formData.subject || "").trim();
    const section = String(formData.sectionAssigned || "").trim();

    if (!teacherId) return "Teacher session not found. Please login again.";
    if (!title) return "Assignment title is required.";
    if (title.length < 3) return "Assignment title must be at least 3 characters.";
    if (!formData.classAssigned) return "Please select class.";
    if (classHasStreams && !formData.streamAssigned) return "Please select stream.";
    if (!section) return "Please select section.";
    if (!subject) return "Please select subject.";
    if (subjectsLoading) return "Subjects are loading. Please wait.";

    if (formData.dueDate) {
      const due = new Date(`${formData.dueDate}T00:00:00`);
      const today = new Date(`${todayIso}T00:00:00`);
      if (Number.isNaN(due.getTime())) return "Please choose a valid due date.";
      if (due < today) return "Due date cannot be in the past.";
    }

    if (file) {
      const name = String(file.name || "");
      const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return "Invalid file type. Allowed: pdf, doc, docx, jpg, jpeg, png, zip, rar.";
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return "File size should be 10 MB or less.";
      }
    }

    return "";
  };

  const handleFileChange = (e) => {
    const nextFile = e.target.files?.[0] || null;
    if (!nextFile) {
      setFile(null);
      return;
    }

    const ext = String(nextFile.name || "")
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFile(null);
      setFileInputKey((k) => k + 1);
      showToast("Invalid file type. Use pdf/doc/docx/jpg/jpeg/png/zip/rar.", "warning");
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setFileInputKey((k) => k + 1);
      showToast("File too large. Maximum allowed size is 10 MB.", "warning");
      return;
    }

    setFile(nextFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const validationMessage = validateForm();
    if (validationMessage) {
      showToast(validationMessage, "warning");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      data.append("teacherId", teacherId);
      if (file) data.append("file", file);

      await api.post("/api/assignments/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Assignment published successfully!", "success");
      setFormData({
        title: "", description: "", subject: "", dueDate: "",
        classAssigned: "", sectionAssigned: "", streamAssigned: "",
      });
      setFile(null);
      setFileInputKey((k) => k + 1);
      setSubjects([]);
      setSubjectsError("");
    } catch (err) {
      showToast(err.response?.data?.message || "Error creating assignment", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <Spinner animation="grow" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="fw-bold text-primary">Create Assignment</h2>
        <p className="text-muted">Fill in the fields below to share new tasks with your students.</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* LEFT COLUMN: CONTENT */}
          <Col lg={7}>
            <div className="bg-white p-4 rounded-3 shadow-sm border mb-4">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Assignment Title</Form.Label>
                <Form.Control 
                  size="lg"
                  placeholder="E.g. Biology - Cell Structure Quiz" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  className="bg-light"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold">Instructions / Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  placeholder="Provide instructions and details..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-light"
                  style={{ resize: "none" }}
                />
              </Form.Group>
            </div>
          </Col>

          {/* RIGHT COLUMN: CONFIGURATION */}
          <Col lg={5}>
            <div className="bg-white p-4 rounded-3 shadow-sm border">
              <h5 className="mb-3 text-secondary border-bottom pb-2">Target Class</h5>
              
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Class</Form.Label>
                <Form.Select name="classAssigned" value={formData.classAssigned} onChange={handleChange} required>
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.className}>Class {cls.className}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {classHasStreams && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Stream</Form.Label>
                  <Form.Select
                    name="streamAssigned"
                    value={formData.streamAssigned}
                    onChange={handleChange}
                    disabled={!formData.classAssigned || !classHasStreams || !hasStreams}
                    required={classHasStreams}
                  >
                    <option value="">{!classHasStreams ? "N/A" : hasStreams ? "Select Stream" : "No stream assigned"}</option>
                    {streamOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Section</Form.Label>
                <Form.Select
                  name="sectionAssigned"
                  value={formData.sectionAssigned}
                  onChange={handleChange}
                  disabled={!formData.classAssigned || (classHasStreams && !formData.streamAssigned)}
                  required
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map((s) => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small">Subject</Form.Label>
                {subjectsLoading ? (
                  <div className="text-center p-2"><Spinner animation="border" size="sm" variant="primary" /></div>
                ) : (
                  <Form.Select name="subject" value={formData.subject} onChange={handleChange} required>
                    <option value="">{subjectsError || "Select Subject"}</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>

              <h5 className="mb-3 text-secondary border-bottom pb-2 pt-2">Timeline & Attachment</h5>
              
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Due Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="dueDate" 
                  value={formData.dueDate} 
                  onChange={handleChange} 
                  min={todayIso}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small">Attachment (Optional)</Form.Label>
                <Form.Control 
                  key={fileInputKey}
                  type="file" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
                  onChange={handleFileChange} 
                />
                <small className="text-muted">Max 10MB (PDF, DOC, IMG, ZIP)</small>
              </Form.Group>

              <Button 
                type="submit" 
                className="w-100 py-3 fw-bold" 
                variant="primary"
                disabled={submitting || loading || subjectsLoading}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Publishing...
                  </>
                ) : (
                  "Publish Assignment"
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>

      {/* Toast at top-end (top right) */}
      <ToastContainer position="top-end" className="p-3 mt-5">
        <Toast
          show={toast.show}
          bg={toast.variant === "success" ? "success" : toast.variant === "danger" ? "danger" : toast.variant === "warning" ? "warning" : "info"}
          delay={4000}
          autohide
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        >
          <Toast.Header closeButton={true}>
            <strong className="me-auto text-capitalize">{toast.variant}</strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === "warning" ? "text-dark" : "text-white"}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}