import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import {
  Form,
  Button,
  Card,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";

export default function AddAssignment() {
  const teacherId = localStorage.getItem("teacherId");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    classAssigned: "",
  });

  const [file, setFile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "",
  });

  // ✅ Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(`/api/classes/by-teacher/${teacherId}`);
        setClasses(res.data);
      } catch (err) {
        console.error(err);
        showToast("❌ Could not fetch classes", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

  // ✅ Fetch subjects for selected class
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.classAssigned) return;
      setSubjects([]);
      setSubjectsError("");
      setSubjectsLoading(true);

      try {
        const res = await api.get(
          `/api/subjects/getSubjects/${formData.classAssigned}`
        );
        setSubjects(res.data);

        if (res.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            subject: res.data[0].subjectName,
          }));
        } else {
          setSubjectsError("⚠️ No subjects available for this class");
          setFormData((prev) => ({ ...prev, subject: "" }));
        }
      } catch (err) {
        console.error(err);
        setSubjectsError("❌ Could not fetch subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [formData.classAssigned]);

  // ✅ Helper for toast messages
  const showToast = (message, variant = "info") => {
    setToast({ show: true, message, variant });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "classAssigned") {
      setFormData((prev) => ({ ...prev, classAssigned: value, subject: "" }));
      setSubjects([]);
      setSubjectsError("");
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.classAssigned) {
      showToast("⚠️ Please select a class", "warning");
      return;
    }

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("subject", formData.subject);
      data.append("dueDate", formData.dueDate);
      data.append("teacherId", teacherId);
      data.append("classAssigned", formData.classAssigned);
      if (file) data.append("file", file);

      await api.post("/api/assignments/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Assignment created successfully!", "success");

      setFormData({
        title: "",
        description: "",
        subject: "",
        dueDate: "",
        classAssigned: "",
      });
      setFile(null);
      setSubjects([]);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "❌ Error creating assignment", "danger");
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
      <Card
        className="p-4 shadow-sm border-0 rounded-4"
        style={{ backgroundColor: "#fafafa" }}
      >
        <h4 className="mb-4 fw-semibold text-center" style={{ color: "#333" }}>
          Assign New Assignment
        </h4>

        <Form onSubmit={handleSubmit} className="px-2">
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium text-secondary">Title</Form.Label>
            <Form.Control
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter assignment title"
              className="rounded-3 border-0 shadow-sm"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium text-secondary">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter assignment description"
              className="rounded-3 border-0 shadow-sm"
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Label className="fw-medium text-secondary">Class</Form.Label>
              <Form.Select
                name="classAssigned"
                value={formData.classAssigned}
                onChange={handleChange}
                required
                className="rounded-3 border-0 shadow-sm"
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.className}>
                    Class {cls.className}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="col-md-6 mb-3">
              <Form.Label className="fw-medium text-secondary">Subject</Form.Label>
              {subjectsLoading ? (
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" variant="secondary" className="me-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                <Form.Select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="rounded-3 border-0 shadow-sm"
                >
                  <option value="">{subjectsError || "-- Select Subject --"}</option>
                  {subjects.map((sub, idx) => (
                    <option key={idx} value={sub.subjectName}>
                      {sub.subjectName} ({sub.marks} marks)
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium text-secondary">Upload File</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              className="rounded-3 border-0 shadow-sm"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-medium text-secondary">Due Date</Form.Label>
            <Form.Control
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="rounded-3 border-0 shadow-sm"
            />
          </Form.Group>

          <div className="text-center">
            <Button
              type="submit"
              className="px-4 py-2 rounded-3 fw-semibold border-0"
              style={{
                backgroundColor: "#444",
                color: "white",
                transition: "0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#222")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
            >
              Create Assignment
            </Button>
          </div>
        </Form>
      </Card>

      {/* ✅ Professional Toast Notification */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          bg={toast.variant}
          delay={2500}
          autohide
        >
          <Toast.Body className="text-white fw-semibold">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
