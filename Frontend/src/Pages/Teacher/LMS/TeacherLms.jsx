import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Button, Card, Form, Spinner, Table, Toast, ToastContainer } from "react-bootstrap";

export default function TeacherLms() {
  const teacherId = localStorage.getItem("teacherId");
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  const [courseForm, setCourseForm] = useState({
    title: "",
    subject: "",
    classAssigned: "",
    description: "",
  });

  const [chapterForm, setChapterForm] = useState({
    title: "",
    order: "",
    description: "",
    topicInput: "",
    topics: [],
  });

  const [materialForm, setMaterialForm] = useState({
    chapterId: "",
    title: "",
    type: "video",
    externalUrl: "",
    duration: "",
    topic: "",
  });

  const [file, setFile] = useState(null);
  const [chapterTopicInputs, setChapterTopicInputs] = useState({});
  const [dragChapterId, setDragChapterId] = useState(null);
  const [dragMaterial, setDragMaterial] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterEdits, setChapterEdits] = useState({});
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialEdits, setMaterialEdits] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  const showMessage = (type, text) => setMessage({ type, text });
  const showToast = (message, variant = "success") => setToast({ show: true, message, variant });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/lms/teacher/courses");
      setCourses(res.data || []);
    } catch (err) {
      showMessage("danger", "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/lms/courses/${courseId}/content`);
      setContent(res.data?.chapters || []);
    } catch (err) {
      showMessage("danger", "Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!teacherId) return;
      try {
        const res = await api.get(`/api/classes/by-teacher/${teacherId}`);
        setClasses(res.data || []);
      } catch (err) {
        showMessage("danger", "Failed to load classes");
      }
    };
    fetchClasses();
  }, [teacherId]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!courseForm.classAssigned) return;
      setSubjects([]);
      setSubjectsError("");
      setSubjectsLoading(true);
      try {
        const res = await api.get(
          `/api/subjects/getSubjects/${courseForm.classAssigned}`
        );
        setSubjects(res.data || []);
        if (res.data?.length) {
          setCourseForm((prev) => ({
            ...prev,
            subject: res.data[0].subjectName,
          }));
        } else {
          setCourseForm((prev) => ({ ...prev, subject: "" }));
          setSubjectsError("No subjects available for this class");
        }
      } catch (err) {
        setSubjectsError("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [courseForm.classAssigned]);

  useEffect(() => {
    if (selectedCourseId) fetchContent(selectedCourseId);
  }, [selectedCourseId]);

  const chapterOptions = useMemo(() => {
    return content.map((chapter) => ({
      id: chapter._id,
      title: chapter.title,
    }));
  }, [content]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/lms/courses", courseForm);
      showMessage("success", "Course created successfully");
      setCourseForm({ title: "", subject: "", classAssigned: "", description: "" });
      fetchCourses();
    } catch (err) {
      showMessage("danger", err.response?.data?.message || "Failed to create course");
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      showMessage("warning", "Select a course first");
      return;
    }
    try {
      await api.post("/api/lms/chapters", {
        courseId: selectedCourseId,
        title: chapterForm.title,
        order: chapterForm.order,
        description: chapterForm.description,
        topics: chapterForm.topics,
      });
      showMessage("success", "Chapter created successfully");
      setChapterForm({ title: "", order: "", description: "", topicInput: "", topics: [] });
      fetchContent(selectedCourseId);
    } catch (err) {
      showMessage("danger", err.response?.data?.message || "Failed to create chapter");
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !materialForm.chapterId) {
      showMessage("warning", "Select a course and chapter");
      return;
    }
    try {
      const data = new FormData();
      data.append("courseId", selectedCourseId);

      Object.entries(materialForm).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      if (file) data.append("file", file);

      await api.post("/api/lms/materials", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showMessage("success", "Material uploaded");
      setMaterialForm({
        chapterId: "",
        title: "",
        type: "video",
        externalUrl: "",
        duration: "",
        topic: "",
      });
      setFile(null);
      fetchContent(selectedCourseId);
    } catch (err) {
      showMessage("danger", err.response?.data?.message || "Failed to upload material");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.delete(`/api/lms/courses/${courseId}`);
      showMessage("success", "Course deleted");
      setSelectedCourseId("");
      setContent([]);
      fetchCourses();
    } catch (err) {
      showMessage("danger", "Failed to delete course");
    }
  };

  const handleSaveTopics = async (chapterId, topics) => {
    try {
      await api.put(`/api/lms/chapters/${chapterId}`, { topics });
      fetchContent(selectedCourseId);
      showToast("Topics updated");
    } catch (err) {
      showMessage("danger", "Failed to update topics");
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      await api.delete(`/api/lms/materials/${materialId}`);
      showMessage("success", "Material deleted");
      fetchContent(selectedCourseId);
    } catch (err) {
      showMessage("danger", "Failed to delete material");
    }
  };

  const moveItem = (list, fromIndex, toIndex) => {
    const updated = [...list];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    return updated;
  };

  const persistChapterOrder = async (chapters) => {
    await Promise.all(
      chapters.map((chapter, idx) =>
        api.put(`/api/lms/chapters/${chapter._id}`, { order: idx + 1 })
      )
    );
  };

  const persistMaterialOrder = async (chapterId, materials) => {
    await Promise.all(
      materials.map((material, idx) =>
        api.put(`/api/lms/materials/${material._id}`, { order: idx + 1 })
      )
    );
  };

  const handleChapterDrop = async (targetId) => {
    if (!dragChapterId || dragChapterId === targetId) return;
    const fromIndex = content.findIndex((c) => c._id === dragChapterId);
    const toIndex = content.findIndex((c) => c._id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const updated = moveItem(content, fromIndex, toIndex).map((c, idx) => ({
      ...c,
      order: idx + 1,
    }));
    setContent(updated);
    setDragChapterId(null);
    try {
      await persistChapterOrder(updated);
      showToast("Chapter order updated");
    } catch {
      showMessage("danger", "Failed to save chapter order");
    }
  };

  const handleMaterialDrop = async (chapterId, targetId) => {
    if (!dragMaterial || dragMaterial.chapterId !== chapterId) return;
    const chapterIndex = content.findIndex((c) => c._id === chapterId);
    if (chapterIndex < 0) return;
    const materials = content[chapterIndex].materials || [];
    const fromIndex = materials.findIndex((m) => m._id === dragMaterial.materialId);
    const toIndex = materials.findIndex((m) => m._id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const updatedMaterials = moveItem(materials, fromIndex, toIndex).map((m, idx) => ({
      ...m,
      order: idx + 1,
    }));
    const updatedContent = [...content];
    updatedContent[chapterIndex] = { ...updatedContent[chapterIndex], materials: updatedMaterials };
    setContent(updatedContent);
    setDragMaterial(null);
    try {
      await persistMaterialOrder(chapterId, updatedMaterials);
      showToast("Material order updated");
    } catch {
      showMessage("danger", "Failed to save material order");
    }
  };

  const startEditChapter = (chapter) => {
    setEditingChapterId(chapter._id);
    setChapterEdits({
      ...chapterEdits,
      [chapter._id]: {
        title: chapter.title || "",
        description: chapter.description || "",
        order: chapter.order || 0,
      },
    });
  };

  const saveEditChapter = async (chapterId) => {
    try {
      const payload = chapterEdits[chapterId];
      await api.put(`/api/lms/chapters/${chapterId}`, payload);
      setEditingChapterId(null);
      fetchContent(selectedCourseId);
      showToast("Chapter updated");
    } catch {
      showMessage("danger", "Failed to update chapter");
    }
  };

  const startEditMaterial = (material) => {
    setEditingMaterialId(material._id);
    setMaterialEdits({
      ...materialEdits,
      [material._id]: {
        title: material.title || "",
        type: material.type || "video",
        duration: material.duration || 0,
        externalUrl: material.externalUrl || "",
        topic: material.topic || "",
      },
    });
  };
  const saveEditMaterial = async (materialId) => {
    try {
      const payload = materialEdits[materialId];
      await api.put(`/api/lms/materials/${materialId}`, payload);
      setEditingMaterialId(null);
      fetchContent(selectedCourseId);
      showToast("Material updated");
    } catch {
      showMessage("danger", "Failed to update material");
    }
  };


  return (
    <div className="container py-3">
      <h3 className="fw-semibold mb-3">LMS - Manage Learning Content</h3>

      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <Card className="p-3 shadow-sm border-0">
            <h5 className="mb-3">Create Course</h5>
            <Form onSubmit={handleCreateCourse}>
              <Form.Group className="mb-2">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Class</Form.Label>
                <Form.Select
                  value={courseForm.classAssigned}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, classAssigned: e.target.value, subject: "" })
                  }
                  required
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.className}>
                      Class {cls.className}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Subject</Form.Label>
                {subjectsLoading ? (
                  <div className="small text-muted">Loading subjects...</div>
                ) : (
                  <Form.Select
                    value={courseForm.subject}
                    onChange={(e) => setCourseForm({ ...courseForm, subject: e.target.value })}
                    required
                  >
                    <option value="">{subjectsError || "Select subject"}</option>
                    {subjects.map((sub, idx) => (
                      <option key={idx} value={sub.subjectName}>
                        {sub.subjectName}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100">
                Create Course
              </Button>
            </Form>
          </Card>
        </div>

        <div className="col-12 col-lg-7">
          <Card className="p-3 shadow-sm border-0 mb-3">
            <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between mb-3">
              <h5 className="mb-0">Your Courses</h5>
              <Form.Select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{ maxWidth: 260 }}
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title} (Class {course.classAssigned})
                  </option>
                ))}
              </Form.Select>
            </div>

            {selectedCourseId && (
              <div className="d-flex justify-content-end mb-2">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteCourse(selectedCourseId)}
                >
                  Delete Course
                </Button>
              </div>
            )}

            <Table responsive bordered size="sm" className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Course</th>
                  <th>Subject</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-muted">
                      No courses yet
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course._id}>
                      <td>{course.title}</td>
                      <td>{course.subject}</td>
                      <td>{course.classAssigned}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>

          <Card className="p-3 shadow-sm border-0 mb-3">
            <h5 className="mb-3">Create Chapter</h5>
            <Form onSubmit={handleCreateChapter}>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Label>Chapter Title</Form.Label>
                  <Form.Control
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    value={chapterForm.order}
                    onChange={(e) => setChapterForm({ ...chapterForm, order: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>

              <Form.Group className="mt-2">
                <Form.Label>Topics</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    placeholder="Add topic and press Add"
                    value={chapterForm.topicInput}
                    onChange={(e) => setChapterForm({ ...chapterForm, topicInput: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={() => {
                      const next = chapterForm.topicInput.trim();
                      if (!next) return;
                      if (chapterForm.topics.includes(next)) return;
                      setChapterForm({
                        ...chapterForm,
                        topics: [...chapterForm.topics, next],
                        topicInput: "",
                      });
                    }}
                  >
                    Add
                  </Button>
                </div>

                {chapterForm.topics.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {chapterForm.topics.map((topic, idx) => (
                      <span key={idx} className="badge bg-light text-dark border">
                        {topic}
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger ms-1 p-0"
                          onClick={() =>
                            setChapterForm({
                              ...chapterForm,
                              topics: chapterForm.topics.filter((t) => t !== topic),
                            })
                          }
                        >
                          <i className="bi bi-x-circle" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mt-2 mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                />
              </Form.Group>

              <Button type="submit" variant="secondary">
                Add Chapter
              </Button>
            </Form>
          </Card>

          <Card className="p-3 shadow-sm border-0">
            <h5 className="mb-3">Upload Material</h5>
            <Form onSubmit={handleCreateMaterial}>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <Form.Label>Chapter</Form.Label>
                  <Form.Select
                    value={materialForm.chapterId}
                    onChange={(e) =>
                      setMaterialForm({ ...materialForm, chapterId: e.target.value, topic: "" })
                    }
                    required
                  >
                    <option value="">Select chapter</option>
                    {chapterOptions.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="col-12 col-md-6">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="row g-2 mt-1">
                <div className="col-12 col-md-6">
                  <Form.Label>Topic</Form.Label>
                  <Form.Select
                    value={materialForm.topic}
                    onChange={(e) => setMaterialForm({ ...materialForm, topic: e.target.value })}
                    disabled={!materialForm.chapterId}
                  >
                    <option value="">
                      {materialForm.chapterId ? "Select topic (optional)" : "Select chapter first"}
                    </option>
                    {(content.find((c) => c._id === materialForm.chapterId)?.topics || []).map(
                      (topic, idx) => (
                        <option key={idx} value={topic}>
                          {topic}
                        </option>
                      )
                    )}
                  </Form.Select>
                </div>
              </div>

              <div className="row g-2 mt-1">
                <div className="col-12 col-md-4">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
                  >
                    <option value="video">Video</option>
                    <option value="note">Notes</option>
                  </Form.Select>
                </div>

                <div className="col-12 col-md-4">
                  <Form.Label>Duration (mins)</Form.Label>
                  <Form.Control
                    type="number"
                    value={materialForm.duration}
                    onChange={(e) => setMaterialForm({ ...materialForm, duration: e.target.value })}
                  />
                </div>
              </div>

              <Form.Group className="mt-2">
                <Form.Label>External URL (optional)</Form.Label>
                <Form.Control
                  value={materialForm.externalUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, externalUrl: e.target.value })}
                  placeholder="https://"
                />
              </Form.Group>

              <Form.Group className="mt-2">
                <Form.Label>Upload File</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
              </Form.Group>

              <Button type="submit" variant="dark" className="mt-3">
                Upload Material
              </Button>
            </Form>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-3 shadow-sm border-0">
        <h5 className="mb-3">Course Content</h5>
        {selectedCourseId && content.length === 0 && (
          <p className="text-muted">No chapters added yet.</p>
        )}

        {content.map((chapter) => (
          <div
            key={chapter._id}
            className="mb-3"
            draggable
            onDragStart={() => setDragChapterId(chapter._id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleChapterDrop(chapter._id)}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="fw-semibold">
                <i className="bi bi-grip-vertical me-2 text-muted" />
                {chapter.title} (Order {chapter.order || 0})
              </div>
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => startEditChapter(chapter)}
                >
                  Edit
                </Button>
              </div>
            </div>
            {editingChapterId === chapter._id && (
              <div className="border rounded p-2 mb-2 bg-light">
                <div className="row g-2">
                  <div className="col-12 col-md-5">
                    <Form.Control
                      value={chapterEdits[chapter._id]?.title || ""}
                      onChange={(e) =>
                        setChapterEdits({
                          ...chapterEdits,
                          [chapter._id]: {
                            ...chapterEdits[chapter._id],
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Chapter title"
                    />
                  </div>
                  <div className="col-12 col-md-2">
                    <Form.Control
                      type="number"
                      value={chapterEdits[chapter._id]?.order || 0}
                      onChange={(e) =>
                        setChapterEdits({
                          ...chapterEdits,
                          [chapter._id]: {
                            ...chapterEdits[chapter._id],
                            order: e.target.value,
                          },
                        })
                      }
                      placeholder="Order"
                    />
                  </div>
                  <div className="col-12 col-md-5">
                    <Form.Control
                      value={chapterEdits[chapter._id]?.description || ""}
                      onChange={(e) =>
                        setChapterEdits({
                          ...chapterEdits,
                          [chapter._id]: {
                            ...chapterEdits[chapter._id],
                            description: e.target.value,
                          },
                        })
                      }
                      placeholder="Description"
                    />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2">
                  <Button size="sm" onClick={() => saveEditChapter(chapter._id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setEditingChapterId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="mb-2">
              <div className="small text-muted mb-1">Topics</div>
              <div className="d-flex flex-wrap gap-2">
                {(chapter.topics || []).length === 0 && (
                  <span className="text-muted small">No topics yet.</span>
                )}
                {(chapter.topics || []).map((topic, idx) => (
                  <span key={idx} className="badge bg-light text-dark border">
                    {topic}
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger ms-1 p-0"
                      onClick={() => {
                        const nextTopics = (chapter.topics || []).filter((t) => t !== topic);
                        handleSaveTopics(chapter._id, nextTopics);
                      }}
                    >
                      <i className="bi bi-x-circle" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="d-flex gap-2 mt-2">
                <Form.Control
                  placeholder="Add topic and click Add"
                  value={chapterTopicInputs[chapter._id] || ""}
                  onChange={(e) =>
                    setChapterTopicInputs({
                      ...chapterTopicInputs,
                      [chapter._id]: e.target.value,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline-primary"
                  onClick={() => {
                    const value = (chapterTopicInputs[chapter._id] || "").trim();
                    if (!value) return;
                    const currentTopics = chapter.topics || [];
                    if (currentTopics.includes(value)) return;
                    handleSaveTopics(chapter._id, [...currentTopics, value]);
                    setChapterTopicInputs({ ...chapterTopicInputs, [chapter._id]: "" });
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <Table size="sm" bordered responsive>
              <thead className="table-light">
                <tr>
                  <th>Material</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Topic</th>
                  <th>Resource</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {chapter.materials.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No materials
                    </td>
                  </tr>
                ) : (
                  chapter.materials.map((mat) => (
                    editingMaterialId === mat._id ? (
                      <tr key={mat._id}>
                        <td>
                          <Form.Control
                            value={materialEdits[mat._id]?.title || ""}
                            onChange={(e) =>
                              setMaterialEdits({
                                ...materialEdits,
                                [mat._id]: {
                                  ...materialEdits[mat._id],
                                  title: e.target.value,
                                },
                              })
                            }
                          />
                        </td>
                        <td>
                          <Form.Select
                            value={materialEdits[mat._id]?.type || "video"}
                            onChange={(e) =>
                              setMaterialEdits({
                                ...materialEdits,
                                [mat._id]: {
                                  ...materialEdits[mat._id],
                                  type: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="video">Video</option>
                            <option value="note">Notes</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            value={materialEdits[mat._id]?.duration || 0}
                            onChange={(e) =>
                              setMaterialEdits({
                                ...materialEdits,
                                [mat._id]: {
                                  ...materialEdits[mat._id],
                                  duration: e.target.value,
                                },
                              })
                            }
                          />
                        </td>
                        <td>
                          <Form.Select
                            value={materialEdits[mat._id]?.topic || ""}
                            onChange={(e) =>
                              setMaterialEdits({
                                ...materialEdits,
                                [mat._id]: {
                                  ...materialEdits[mat._id],
                                  topic: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="">No topic</option>
                            {(chapter.topics || []).map((topic, idx) => (
                              <option key={idx} value={topic}>
                                {topic}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            value={materialEdits[mat._id]?.externalUrl || ""}
                            onChange={(e) =>
                              setMaterialEdits({
                                ...materialEdits,
                                [mat._id]: {
                                  ...materialEdits[mat._id],
                                  externalUrl: e.target.value,
                                },
                              })
                            }
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" onClick={() => saveEditMaterial(mat._id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => setEditingMaterialId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={mat._id}
                        draggable
                        onDragStart={() => setDragMaterial({ chapterId: chapter._id, materialId: mat._id })}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleMaterialDrop(chapter._id, mat._id)}
                      >
                        <td>{mat.title}</td>
                        <td>{mat.type}</td>
                        <td>{mat.duration ? `${mat.duration} min` : "-"}</td>
                        <td>{mat.topic || "-"}</td>
                        <td>
                          {mat.file ? (
                            <a
                              href={`http://localhost:3000/${mat.file}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View file
                            </a>
                          ) : mat.externalUrl ? (
                            <a href={mat.externalUrl} target="_blank" rel="noreferrer">
                              Open link
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-secondary" onClick={() => startEditMaterial(mat)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteMaterial(mat._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))
                )}
              </tbody>
            </Table>
          </div>
        ))}
      </Card>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={toast.show}
          bg={toast.variant}
          delay={2500}
          autohide
          onClose={() => setToast({ ...toast, show: false })}
        >
          <Toast.Body className="text-white fw-semibold">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
