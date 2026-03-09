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

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(`/api/classes/by-teacher/${teacherId}`);
        setClasses(res.data);
      } catch (err) {
        showToast("❌ Could not fetch classes", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

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
      } catch {
        setSubjectsError("❌ Could not fetch subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [formData.classAssigned]);

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
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      data.append("teacherId", teacherId);
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
      showToast(
        err.response?.data?.message || "❌ Error creating assignment",
        "danger"
      );
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
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7">
          <Card className="p-3 p-md-4 shadow-sm border-0 rounded-4 bg-light">
            <h4 className="mb-4 fw-semibold text-center text-dark">
              Assign New Assignment
            </h4>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>

              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <Form.Label>Class</Form.Label>
                  <Form.Select
                    name="classAssigned"
                    value={formData.classAssigned}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls.className}>
                        Class {cls.className}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="col-12 col-md-6 mb-3">
                  <Form.Label>Subject</Form.Label>
                  {subjectsLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        {subjectsError || "-- Select Subject --"}
                      </option>
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
                <Form.Label>Upload File</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </Form.Group>

              <Button
                type="submit"
                className="w-100 fw-semibold py-2"
                variant="dark"
              >
                Create Assignment
              </Button>
            </Form>
          </Card>
        </div>
      </div>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={toast.show}
          bg={toast.variant}
          delay={2500}
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
