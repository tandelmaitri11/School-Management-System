import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Button, Col, Row, Spinner, Toast, ToastContainer } from "react-bootstrap";
import TeacherLmsLeftPanel from "./components/TeacherLmsLeftPanel";
import TeacherLmsRightPanel from "./components/TeacherLmsRightPanel";

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

// ---------- Validation helpers ---------
const isHttpUrl = (url) => {
  const u = normalize(url);
  if (!u) return true; 
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toPositiveIntOrEmpty = (val) => {
  const s = normalize(val);
  if (!s) return "";
  const n = Number(s);
  if (!Number.isFinite(n)) return "";
  const i = Math.floor(n);
  return i > 0 ? String(i) : "";
};

const MAX_TITLE = 120;
const MAX_DESC = 500;

export default function TeacherLms() {
  const teacherId = localStorage.getItem("teacherId");

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  // UI-only search
  const [courseQuery, setCourseQuery] = useState("");
  const [contentQuery, setContentQuery] = useState("");

  // ---------- Forms ----------
  const [courseForm, setCourseForm] = useState({
    title: "",
    subject: "",
    classId: "",
    classAssigned: "",
    section: "",
    stream: "",
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

  // per-chapter topic input
  const [chapterTopicInputs, setChapterTopicInputs] = useState({});

  // drag state
  const [dragChapterId, setDragChapterId] = useState(null);
  const [dragMaterial, setDragMaterial] = useState(null);

  // editing
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterEdits, setChapterEdits] = useState({});
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialEdits, setMaterialEdits] = useState({});

  
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseEdits, setCourseEdits] = useState({});

  // validation state (UI only)
  const [errors, setErrors] = useState({
    course: {},
    chapter: {},
    material: {},
    chapterEdit: {},
    materialEdit: {},
  });

  const showMessage = (type, text) => setMessage({ type, text });
  const showToast = (message, variant = "success") => setToast({ show: true, message, variant });

  // ---------- Derived: class / stream / section ----------
  const selectedClassDoc = useMemo(
    () => classes.find((c) => String(c._id) === String(courseForm.classId)) || null,
    [classes, courseForm.classId]
  );

  const assignedForClass = useMemo(
    () => assignedSections.filter((s) => String(s?.classId) === String(selectedClassDoc?._id || "")),
    [assignedSections, selectedClassDoc]
  );

  const classStreams = useMemo(
    () =>
      (selectedClassDoc?.streams || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => normalize(s.name))
        .filter(Boolean),
    [selectedClassDoc]
  );

  const classHasStreams = classStreams.length > 0;

  const streamOptions = useMemo(() => {
    if (!classHasStreams) return [];
    const assignedStreamSet = new Set(
      assignedForClass.map((s) => normalize(s.stream).toLowerCase()).filter(Boolean)
    );
    return classStreams.filter((st) => assignedStreamSet.has(st.toLowerCase()));
  }, [classHasStreams, assignedForClass, classStreams]);

  const sectionOptions = useMemo(() => {
    const assignedRows = assignedForClass
      .map((s) => ({ section: normalizeUpper(s.section), stream: normalize(s.stream) }))
      .filter((s) => s.section);

    const classRows = (selectedClassDoc?.sections || [])
      .filter((s) => s?.isActive !== false)
      .map((s) => ({ section: normalizeUpper(s.name), stream: normalize(s.stream) }))
      .filter((s) => s.section);

    const rows = assignedRows.length ? assignedRows : classRows;
    if (!rows.length) return ["ALL"];

    const streamKey = normalize(courseForm.stream).toLowerCase();
    const streamAwareRows =
      classHasStreams && streamKey
        ? rows.filter((r) => {
          const rowStream = normalize(r.stream).toLowerCase();
          return !rowStream || rowStream === streamKey;
        })
        : rows;

    const uniqueSections = [...new Set(streamAwareRows.map((r) => r.section))].filter((sec) => sec !== "ALL");
    return ["ALL", ...uniqueSections];
  }, [assignedForClass, selectedClassDoc, classHasStreams, courseForm.stream]);

  // ---------- Fetch ----------
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/lms/teacher/courses");
      setCourses(res.data || []);
    } catch {
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
    } catch {
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
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
        setClasses(res.data?.classesFull || []);
        setAssignedSections(res.data?.assignedSections || []);
      } catch {
        showMessage("danger", "Failed to load classes");
      }
    };
    fetchClasses();
  }, [teacherId]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!courseForm.classAssigned) return;
      if (classHasStreams && !courseForm.stream) {
        setSubjects([]);
        setCourseForm((prev) => ({ ...prev, subject: "" }));
        setSubjectsError("Select stream to load subjects");
        return;
      }

      setSubjects([]);
      setSubjectsError("");
      setSubjectsLoading(true);
      try {
        const query = courseForm.stream ? `?stream=${encodeURIComponent(courseForm.stream)}` : "";
        const res = await api.get(`/api/subjects/getSubjects/${courseForm.classAssigned}${query}`);
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
      } catch {
        setSubjectsError("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [courseForm.classAssigned, courseForm.stream, classHasStreams]);

  useEffect(() => {
    if (courseForm.stream && !streamOptions.includes(courseForm.stream)) {
      setCourseForm((prev) => ({ ...prev, stream: "", section: "ALL", subject: "" }));
    }
  }, [courseForm.stream, streamOptions]);

  useEffect(() => {
    if (courseForm.section && !sectionOptions.includes(courseForm.section)) {
      setCourseForm((prev) => ({ ...prev, section: "ALL", subject: "" }));
    }
  }, [courseForm.section, sectionOptions]);

  useEffect(() => {
    if (selectedCourseId) fetchContent(selectedCourseId);
  }, [selectedCourseId]);

  // ---------- UI-only computed ----------
  const selectedCourse = useMemo(
    () => courses.find((c) => String(c._id) === String(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );

  const filteredCourses = useMemo(() => {
    const q = normalize(courseQuery).toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const hay = `${c.title || ""} ${c.subject || ""} ${c.classAssigned || ""} ${c.section || ""} ${c.stream || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [courses, courseQuery]);

  const filteredContent = useMemo(() => {
    const q = normalize(contentQuery).toLowerCase();
    if (!q) return content;
    return content
      .map((ch) => {
        const mats = (ch.materials || []).filter((m) => {
          const hay = `${m.title || ""} ${m.type || ""} ${m.topic || ""} ${m.externalUrl || ""}`.toLowerCase();
          return hay.includes(q);
        });
        const chapterHay = `${ch.title || ""} ${ch.description || ""}`.toLowerCase();
        const chapterMatch = chapterHay.includes(q);
        return chapterMatch ? ch : { ...ch, materials: mats };
      })
      .filter((ch) => {
        const chapterHay = `${ch.title || ""} ${ch.description || ""}`.toLowerCase();
        const chapterMatch = chapterHay.includes(q);
        const matsCount = (ch.materials || []).length;
        return chapterMatch || matsCount > 0;
      });
  }, [content, contentQuery]);

  const chapterOptions = useMemo(() => {
    return content.map((chapter) => ({
      id: chapter._id,
      title: chapter.title,
    }));
  }, [content]);

  // ---------- Validation: build errors ----------
  const validateCourse = (draft) => {
    const e = {};
    const title = normalize(draft.title);

    if (!title) e.title = "Title is required";
    else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters`;

    if (!draft.classId) e.classId = "Class is required";

    if (!draft.classAssigned) e.classAssigned = "Class is required";
    if (!draft.section) e.section = "Section is required";

    if (classHasStreams && !draft.stream) e.stream = "Stream is required";
    if (classHasStreams && draft.stream && !streamOptions.includes(draft.stream))
      e.stream = "Invalid stream selection";

    if (draft.section && !sectionOptions.includes(draft.section)) e.section = "Invalid section selection";

    if (!normalize(draft.subject)) e.subject = subjectsError || "Subject is required";

    const desc = normalize(draft.description);
    if (desc.length > MAX_DESC) e.description = `Max ${MAX_DESC} characters`;

    return e;
  };
  const validateCourseEdit = (payload) => {
    const e = {};

    const title = normalize(payload.title);
    if (!title) e.title = "Title is required";
    else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters`;

    if (!payload.classAssigned) e.classAssigned = "Class is required";
    if (!payload.section) e.section = "Section is required";

    const desc = normalize(payload.description);
    if (desc.length > MAX_DESC) e.description = `Max ${MAX_DESC} characters`;

    return e;
  };

  const validateChapter = (draft) => {
    const e = {};
    if (!selectedCourseId) e.courseId = "Select a course first";

    const title = normalize(draft.title);
    if (!title) e.title = "Chapter title is required";
    else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters`;

    if (draft.order) {
      const ord = Number(draft.order);
      if (!Number.isFinite(ord) || ord < 1) e.order = "Order must be a positive number";
    }

    const desc = normalize(draft.description);
    if (desc.length > MAX_DESC) e.description = `Max ${MAX_DESC} characters`;

    // topics: no empty, no duplicates (case-insensitive)
    const topics = (draft.topics || []).map((t) => normalize(t)).filter(Boolean);
    const lower = topics.map((t) => t.toLowerCase());
    const uniqueLower = new Set(lower);
    if (topics.length !== uniqueLower.size) e.topics = "Duplicate topics found";

    return e;
  };

  const validateMaterial = (draft) => {
    const e = {};
    if (!selectedCourseId) e.courseId = "Select a course first";
    if (!draft.chapterId) e.chapterId = "Chapter is required";

    const title = normalize(draft.title);
    if (!title) e.title = "Material title is required";
    else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters`;

    if (!draft.type) e.type = "Type is required";

    if (draft.duration) {
      const d = Number(draft.duration);
      if (!Number.isFinite(d) || d < 0) e.duration = "Duration must be 0 or more";
    }

    // URL optional but if present must be valid
    if (!isHttpUrl(draft.externalUrl)) e.externalUrl = "Enter a valid http/https URL";

    // at least one resource: file OR url
    const hasFile = !!file;
    const hasUrl = !!normalize(draft.externalUrl);
    if (!hasFile && !hasUrl) e.resource = "Upload a file or provide an external URL";

    return e;
  };

  const validateChapterEdit = (chapterId, payload) => {
    const e = {};
    const title = normalize(payload?.title);
    if (!title) e.title = "Title is required";
    else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters`;

    if (payload?.order !== "" && payload?.order != null) {
      const ord = Number(payload.order);
      if (!Number.isFinite(ord) || ord < 1) e.order = "Order must be a positive number";
    }

    const desc = normalize(payload?.description);
    if (desc.length > MAX_DESC) e.description = `Max ${MAX_DESC} characters`;

    return { [chapterId]: e };
  };

  const validateMaterialEdit = (materialId, payload, chapter) => {
    const e = {};
    const title = normalize(payload?.title);
    if (!title) e.title = "Title is required";
    else if (title.length > MAX_TITLE) e.title = `Max ${MAX_TITLE} characters`;

    if (!payload?.type) e.type = "Type is required";

    if (payload?.duration !== "" && payload?.duration != null) {
      const d = Number(payload.duration);
      if (!Number.isFinite(d) || d < 0) e.duration = "Duration must be 0 or more";
    }

    if (!isHttpUrl(payload?.externalUrl)) e.externalUrl = "Enter a valid http/https URL";

    // topic must be from chapter topics if provided
    const t = normalize(payload?.topic);
    if (t) {
      const topics = (chapter?.topics || []).map((x) => normalize(x));
      if (!topics.includes(t)) e.topic = "Invalid topic";
    }

    return { [materialId]: e };
  };

  // ---------- Actions ----------
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const nextErrors = validateCourse(courseForm);
    setErrors((prev) => ({ ...prev, course: nextErrors }));
    if (Object.keys(nextErrors).length) {
      showMessage("warning", "Fix validation errors and try again");
      return;
    }

    try {
      await api.post("/api/lms/courses", {
        ...courseForm,
        title: normalize(courseForm.title),
        description: normalize(courseForm.description),
      });
      showMessage("success", "Course created successfully");

      setCourseForm({
        title: "",
        subject: "",
        classId: "",
        classAssigned: "",
        section: "",
        stream: "",
        description: "",
      });
      setErrors((prev) => ({ ...prev, course: {} }));
      fetchCourses();
    } catch (err) {
      showMessage("danger", err.response?.data?.message || "Failed to create course");
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleaned = {
      ...chapterForm,
      title: normalize(chapterForm.title),
      description: normalize(chapterForm.description),
      order: toPositiveIntOrEmpty(chapterForm.order),
      topics: (chapterForm.topics || []).map((t) => normalize(t)).filter(Boolean),
    };

    const nextErrors = validateChapter(cleaned);
    setErrors((prev) => ({ ...prev, chapter: nextErrors }));
    if (Object.keys(nextErrors).length) {
      showMessage("warning", "Fix validation errors and try again");
      return;
    }

    try {
      await api.post("/api/lms/chapters", {
        courseId: selectedCourseId,
        title: cleaned.title,
        order: cleaned.order,
        description: cleaned.description,
        topics: cleaned.topics,
      });
      showMessage("success", "Chapter created successfully");
      setChapterForm({ title: "", order: "", description: "", topicInput: "", topics: [] });
      setErrors((prev) => ({ ...prev, chapter: {} }));
      fetchContent(selectedCourseId);
    } catch (err) {
      showMessage("danger", err.response?.data?.message || "Failed to create chapter");
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleaned = {
      ...materialForm,
      title: normalize(materialForm.title),
      externalUrl: normalize(materialForm.externalUrl),
      duration: materialForm.duration === "" ? "" : String(materialForm.duration),
      topic: normalize(materialForm.topic),
    };

    const nextErrors = validateMaterial(cleaned);
    setErrors((prev) => ({ ...prev, material: nextErrors }));
    if (Object.keys(nextErrors).length) {
      showMessage("warning", "Fix validation errors and try again");
      return;
    }

    try {
      const data = new FormData();
      data.append("courseId", selectedCourseId);

      Object.entries(cleaned).forEach(([key, value]) => {
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
      setErrors((prev) => ({ ...prev, material: {} }));
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
    } catch {
      showMessage("danger", "Failed to delete course");
    }
  };

  const handleSaveTopics = async (chapterId, topics) => {
    try {
      const cleaned = (topics || []).map((t) => normalize(t)).filter(Boolean);
      // validation: duplicates
      const lower = cleaned.map((t) => t.toLowerCase());
      if (new Set(lower).size !== cleaned.length) {
        showMessage("warning", "Duplicate topics are not allowed");
        return;
      }
      await api.put(`/api/lms/chapters/${chapterId}`, { topics: cleaned });
      fetchContent(selectedCourseId);
      showToast("Topics updated");
    } catch {
      showMessage("danger", "Failed to update topics");
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      await api.delete(`/api/lms/materials/${materialId}`);
      showMessage("success", "Material deleted");
      fetchContent(selectedCourseId);
    } catch {
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
    await Promise.all(chapters.map((chapter, idx) => api.put(`/api/lms/chapters/${chapter._id}`, { order: idx + 1 })));
  };

  const persistMaterialOrder = async (chapterId, materials) => {
    await Promise.all(materials.map((material, idx) => api.put(`/api/lms/materials/${material._id}`, { order: idx + 1 })));
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

  // ---------------- EDIT COURSE ----------------
  const startEditCourse = (course) => {
    setEditingCourseId(course._id);
    setCourseEdits({
      title: course.title || "",
      subject: course.subject || "",
      classAssigned: course.classAssigned || "",
      section: course.section || "",
      stream: course.stream || "",
      description: course.description || "",
    });
  };

  const saveEditCourse = async (courseId) => {
    const cleaned = {
      title: normalize(courseEdits.title),
      subject: normalize(courseEdits.subject),
      classAssigned: normalize(courseEdits.classAssigned),
      section: normalize(courseEdits.section),
      stream: normalize(courseEdits.stream),
      description: normalize(courseEdits.description),
    };

    const e = validateCourseEdit(cleaned);
    if (Object.keys(e).length) {
      showMessage("warning", "Fix course validation errors");
      return;
    }

    try {
      await api.put(`/api/lms/courses/${courseId}`, cleaned);
      setEditingCourseId(null);
      fetchCourses();
      showToast("Course updated successfully");
    } catch {
      showMessage("danger", "Failed to update course");
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
    setErrors((prev) => ({ ...prev, chapterEdit: { ...prev.chapterEdit, [chapter._id]: {} } }));
  };

  const saveEditChapter = async (chapterId) => {
    const payload = chapterEdits[chapterId] || {};
    const cleaned = {
      title: normalize(payload.title),
      description: normalize(payload.description),
      order: payload.order === "" ? "" : Number(payload.order),
    };

    const perIdErr = validateChapterEdit(chapterId, cleaned);
    setErrors((prev) => ({ ...prev, chapterEdit: { ...prev.chapterEdit, ...perIdErr } }));

    const e = perIdErr[chapterId] || {};
    if (Object.keys(e).length) {
      showMessage("warning", "Fix chapter validation errors");
      return;
    }

    try {
      await api.put(`/api/lms/chapters/${chapterId}`, cleaned);
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
    setErrors((prev) => ({ ...prev, materialEdit: { ...prev.materialEdit, [material._id]: {} } }));
  };

  const saveEditMaterial = async (materialId, chapter) => {
    const payload = materialEdits[materialId] || {};
    const cleaned = {
      title: normalize(payload.title),
      type: normalize(payload.type),
      duration: payload.duration === "" ? "" : Number(payload.duration),
      externalUrl: normalize(payload.externalUrl),
      topic: normalize(payload.topic),
    };

    const perIdErr = validateMaterialEdit(materialId, cleaned, chapter);
    setErrors((prev) => ({ ...prev, materialEdit: { ...prev.materialEdit, ...perIdErr } }));

    const e = perIdErr[materialId] || {};
    if (Object.keys(e).length) {
      showMessage("warning", "Fix material validation errors");
      return;
    }

    try {
      await api.put(`/api/lms/materials/${materialId}`, cleaned);
      setEditingMaterialId(null);
      fetchContent(selectedCourseId);
      showToast("Material updated");
    } catch {
      showMessage("danger", "Failed to update material");
    }
  };

  // ---------- Render ----------
  const courseErr = errors.course || {};
  const chapterErr = errors.chapter || {};
  const materialErr = errors.material || {};

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* Top header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 fw-medium shadow-sm">
              <i className="bi bi-mortarboard-fill me-2" />
              Learning Management
            </span>
            <h3 className="mb-0 fw-bold text-dark">Teacher Content Manager</h3>
          </div>
          <div className="text-secondary small mt-2 d-flex align-items-center">
            <i className="bi bi-info-circle me-2 opacity-75"></i>
            Create courses, chapters, topics and upload learning materials (drag & drop to reorder).
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="white"
            className="d-flex align-items-center gap-2 border shadow-sm rounded-pill px-4 fw-medium text-secondary transition hover-bg-light"
            onClick={() => {
              setMessage({ type: "", text: "" });
              showToast("Refreshing content...");
              fetchCourses();
              if (selectedCourseId) fetchContent(selectedCourseId);
            }}
          >
            <i className="bi bi-arrow-clockwise" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <Alert variant={message.type || "info"} className="shadow-sm border-0 rounded-4 mb-4">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi fs-5 ${message.type === "danger" ? "bi-exclamation-triangle-fill text-danger" : "bi-check-circle-fill text-success"}`} />
              <div className="fw-medium">{message.text}</div>
            </div>
            <Button size="sm" variant="link" className="text-secondary p-0 text-decoration-none" onClick={() => setMessage({ type: "", text: "" })}>
              <i className="bi bi-x-lg"></i>
            </Button>
          </div>
        </Alert>
      )}

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <div className="text-muted mt-2 fw-medium small">Loading content...</div>
        </div>
      )}

      <Row className="g-4">
        <Col xs={12} lg={5} xxl={4}>
          <TeacherLmsLeftPanel
            courseErr={courseErr}
            chapterErr={chapterErr}
            materialErr={materialErr}
            courseForm={courseForm}
            setCourseForm={setCourseForm}
            chapterForm={chapterForm}
            setChapterForm={setChapterForm}
            materialForm={materialForm}
            setMaterialForm={setMaterialForm}
            setFile={setFile}
            classes={classes}
            classHasStreams={classHasStreams}
            streamOptions={streamOptions}
            sectionOptions={sectionOptions}
            subjectsLoading={subjectsLoading}
            subjectsError={subjectsError}
            subjects={subjects}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            courses={courses}
            chapterOptions={chapterOptions}
            content={content}
            setErrors={setErrors}
            handleCreateCourse={handleCreateCourse}
            handleCreateChapter={handleCreateChapter}
            handleCreateMaterial={handleCreateMaterial}
            MAX_TITLE={MAX_TITLE}
            MAX_DESC={MAX_DESC}
          />
        </Col>

        <Col xs={12} lg={7} xxl={8}>
          <TeacherLmsRightPanel
            courseQuery={courseQuery}
            setCourseQuery={setCourseQuery}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            filteredCourses={filteredCourses}
            selectedCourse={selectedCourse}
            handleDeleteCourse={handleDeleteCourse}

            editingCourseId={editingCourseId}
            setEditingCourseId={setEditingCourseId}
            courseEdits={courseEdits}
            setCourseEdits={setCourseEdits}
            startEditCourse={startEditCourse}
            saveEditCourse={saveEditCourse}

            contentQuery={contentQuery}
            setContentQuery={setContentQuery}
            content={content}
            filteredContent={filteredContent}
            errors={errors}
            setDragChapterId={setDragChapterId}
            handleChapterDrop={handleChapterDrop}
            editingChapterId={editingChapterId}
            setEditingChapterId={setEditingChapterId}
            chapterEdits={chapterEdits}
            setChapterEdits={setChapterEdits}
            startEditChapter={startEditChapter}
            saveEditChapter={saveEditChapter}
            chapterTopicInputs={chapterTopicInputs}
            setChapterTopicInputs={setChapterTopicInputs}
            handleSaveTopics={handleSaveTopics}
            showMessage={showMessage}
            setDragMaterial={setDragMaterial}
            handleMaterialDrop={handleMaterialDrop}
            editingMaterialId={editingMaterialId}
            setEditingMaterialId={setEditingMaterialId}
            materialEdits={materialEdits}
            setMaterialEdits={setMaterialEdits}
            startEditMaterial={startEditMaterial}
            saveEditMaterial={saveEditMaterial}
            handleDeleteMaterial={handleDeleteMaterial}
          />
        </Col>
      </Row>

      <ToastContainer position="bottom-end" className="p-4" style={{ zIndex: 1060 }}>
        <Toast show={toast.show} bg={toast.variant} delay={3000} autohide onClose={() => setToast({ ...toast, show: false })} className="shadow border-0">
          <Toast.Body className="text-white fw-medium d-flex align-items-center gap-2">
            <i className={`bi ${toast.variant === 'danger' ? 'bi-exclamation-octagon' : 'bi-check-circle'} fs-5`}></i>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}