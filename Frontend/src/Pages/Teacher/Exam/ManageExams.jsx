import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { FaTrashAlt, FaEye, FaCalendarAlt, FaClock, FaSearch, FaEdit } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

const toDateTimeLocal = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

const ManageExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editExamId, setEditExamId] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    classId: "",
    className: "",
    stream: "",
    section: "",
    subjectId: "",
    subjectName: "",
    duration: "",
    totalMarks: "",
    startTime: "",
  });

  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");

  const fetchExams = async () => {
    try {
      const res = await api.get(`/api/teachers/my-exams/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const examData = res.data.exams || res.data || [];
      setExams(examData);
      setFilteredExams(examData);
    } catch (err) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherProfile = async () => {
    try {
      const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data?.classesFull || []);
      setAssignedSections(res.data?.assignedSections || []);
    } catch {
      toast.error("Failed to load class options");
    }
  };

  useEffect(() => {
    fetchExams();
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const results = exams.filter(
      (exam) =>
        String(exam.title || "").toLowerCase().includes(term) ||
        String(exam.subjectName || "").toLowerCase().includes(term)
    );
    setFilteredExams(results);
  }, [searchTerm, exams]);

  const selectedEditClass = useMemo(
    () => classes.find((c) => String(c._id) === String(editForm.classId)) || null,
    [classes, editForm.classId]
  );

  const assignedForClass = useMemo(
    () => assignedSections.filter((s) => String(s?.classId) === String(selectedEditClass?._id || "")),
    [assignedSections, selectedEditClass]
  );

  const classStreams = useMemo(
    () =>
      (selectedEditClass?.streams || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => normalize(s.name))
        .filter(Boolean),
    [selectedEditClass]
  );

  const streamOptions = useMemo(
    () => {
      if (classStreams.length === 0) return [];
      const assignedStreamSet = new Set(
        assignedForClass
          .map((s) => normalize(s?.stream))
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
    if (!selectedEditClass?._id) return [];

    const fromTeacher = assignedForClass
      .map((s) => ({ name: normalizeUpper(s.section), stream: normalize(s.stream) }))
      .filter((s) => s.name);

    const byName = new Map();
    fromTeacher.forEach((s) => {
      const key = `${s.name}__${normalize(s.stream).toLowerCase()}`;
      if (!byName.has(key)) {
        byName.set(key, s);
        return;
      }
      const prev = byName.get(key);
      if (!normalize(prev.stream) && normalize(s.stream)) byName.set(key, s);
    });
    const base = Array.from(byName.values());

    if (classHasStreams) {
      if (!editForm.stream) return [];
      const exact = base.filter(
        (s) => normalize(s.stream).toLowerCase() === normalize(editForm.stream).toLowerCase()
      );
      return Array.from(new Map(exact.map((s) => [s.name, s])).values());
    }
    return Array.from(new Map(base.map((s) => [s.name, s])).values());
  }, [selectedEditClass, assignedForClass, classHasStreams, editForm.stream]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!editExamId || !editForm.className) return;
      if (classHasStreams && !editForm.stream) {
        setSubjects([]);
        return;
      }
      setSubjects([]);
      setSubjectsLoading(true);
      try {
        const query = editForm.stream ? `?stream=${encodeURIComponent(editForm.stream)}` : "";
        const res = await api.get(`/api/subjects/getSubjects/${editForm.className}${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rows = res.data || [];
        setSubjects(rows);
        if (rows.length === 0) {
          toast.warning("No subjects available for selected class/stream");
        }
      } catch {
        toast.error("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [editExamId, editForm.className, editForm.stream, classHasStreams, token]);

  const handleDelete = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam? All questions will be lost.")) return;
    try {
      await api.delete(`/api/teachers/delete-exam/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Exam deleted successfully");
      setExams((prev) => prev.filter((exam) => exam._id !== examId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting exam");
    }
  };

  const getStatusBadge = (startTime, duration) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(start.getTime() + Number(duration) * 60000);

    if (now < start) return <span className="badge rounded-pill bg-info text-dark">Upcoming</span>;
    if (now > end) return <span className="badge rounded-pill bg-secondary">Completed</span>;
    return <span className="badge rounded-pill bg-success pulse-animation">Live Now</span>;
  };

  const openEdit = (exam) => {
    const classId = exam?.classId?._id || exam?.classId || "";
    const className = Number(exam?.classId?.className ?? exam?.className ?? 0) || "";
    const subjectId = exam?.subjectId?._id || exam?.subjectId || "";
    setEditExamId(exam._id);
    setEditForm({
      title: exam.title || "",
      classId: String(classId),
      className,
      stream: normalize(exam.stream),
      section: normalizeUpper(exam.section),
      subjectId: String(subjectId),
      subjectName: exam.subjectName || "",
      duration: exam.duration || "",
      totalMarks: exam.totalMarks || "",
      startTime: toDateTimeLocal(exam.startTime),
    });
  };

  const closeEdit = () => {
    setEditExamId("");
    setSubjects([]);
    setEditForm({
      title: "",
      classId: "",
      className: "",
      stream: "",
      section: "",
      subjectId: "",
      subjectName: "",
      duration: "",
      totalMarks: "",
      startTime: "",
    });
  };

  const handleEditClassChange = (classId) => {
    const cls = classes.find((c) => String(c._id) === String(classId));
    setEditForm((prev) => ({
      ...prev,
      classId: cls?._id || "",
      className: cls?.className || "",
      stream: "",
      section: "",
      subjectId: "",
      subjectName: "",
    }));
    setSubjects([]);
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    if (
      !editForm.title ||
      !editForm.classId ||
      !editForm.className ||
      !editForm.section ||
      (classHasStreams && !editForm.stream) ||
      !editForm.subjectId ||
      !editForm.subjectName ||
      !editForm.duration ||
      !editForm.totalMarks ||
      !editForm.startTime
    ) {
      toast.info("Please fill all required fields");
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/api/teacher/update-exam/${editExamId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Exam updated successfully");
      closeEdit();
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update exam");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-grow text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container">
        <div className="row align-items-center mb-5">
          <div className="col-md-6">
            <h2 className="fw-bold text-dark mb-1">My Exams</h2>
            <p className="text-muted">You have created {exams.length} exams so far.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <a href="/teacher/addexam" className="btn btn-primary btn-lg rounded-3 shadow-sm px-4">
              + Create New Exam
            </a>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-4">
            <div className="input-group bg-white shadow-sm rounded-3 p-1">
              <span className="input-group-text bg-transparent border-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-0 shadow-none"
                placeholder="Search title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted mt-3">No exams found.</h4>
          </div>
        ) : (
          <div className="row">
            {filteredExams.map((exam) => (
              <div key={exam._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 exam-card">
                  <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    {getStatusBadge(exam.startTime, exam.duration)}
                    <span className="text-primary fw-bold">{exam.totalMarks} Marks</span>
                  </div>

                  <div className="card-body px-4">
                    <h5 className="card-title fw-bold text-dark mb-3">{exam.title}</h5>

                    <div className="d-flex align-items-center text-muted small mb-2">
                      <FaCalendarAlt className="me-2 text-primary" />
                      <span>{new Date(exam.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="d-flex align-items-center text-muted small mb-4">
                      <FaClock className="me-2 text-primary" />
                      <span>
                        {exam.duration} Minutes <br />
                        Ends at{" "}
                        <b>
                          {new Date(new Date(exam.startTime).getTime() + Number(exam.duration) * 60000).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </b>
                      </span>
                    </div>

                    <div className="bg-light rounded-3 p-2 text-center">
                      <div className="small text-muted mb-0">Class / Section / Stream</div>
                      <div className="fw-bold text-dark">
                        {exam.classId?.className || exam.className || "N/A"} - {exam.section || "N/A"}
                        {exam.stream ? ` (${exam.stream})` : ""}
                      </div>
                      <div className="small text-muted mt-1">{exam.subjectName || "N/A"}</div>
                    </div>
                  </div>

                  <div className="card-footer bg-white border-0 pb-4 px-4 d-flex gap-2">
                    <button
                      className="btn btn-soft-primary flex-grow-1 rounded-3 fw-medium d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: "#e7f1ff", color: "#0d6efd", border: "none" }}
                      onClick={() => navigate(`/teacher/exam-results/${exam._id}`)}
                      title="View exam results"
                    >
                      <FaEye /> View Results
                    </button>
                    <button
                      className="btn btn-outline-secondary rounded-3"
                      onClick={() => openEdit(exam)}
                      title="Edit exam"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-outline-danger rounded-3"
                      onClick={() => handleDelete(exam._id)}
                      title="Delete exam"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editExamId && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleUpdateExam}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Exam</h5>
                  <button type="button" className="btn-close" onClick={closeEdit}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label">Class</label>
                      <select
                        className="form-select"
                        value={editForm.classId}
                        onChange={(e) => handleEditClassChange(e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        {classes.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.className}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Stream</label>
                      <select
                        className="form-select"
                        disabled={!editForm.classId || !classHasStreams || !hasStreams}
                        value={editForm.stream}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            stream: e.target.value,
                            section: "",
                            subjectId: "",
                            subjectName: "",
                          }))
                        }
                      >
                        <option value="">
                          {!classHasStreams ? "N/A" : hasStreams ? "Select" : "No assigned stream"}
                        </option>
                        {streamOptions.map((stream) => (
                          <option key={stream} value={stream}>
                            {stream}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label">Section</label>
                      <select
                        className="form-select"
                        value={editForm.section}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, section: e.target.value }))}
                        required
                      >
                        <option value="">Select</option>
                        {sectionOptions.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Subject</label>
                      <select
                        className="form-select"
                        value={editForm.subjectId}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            subjectId: e.target.value,
                            subjectName: e.target.selectedOptions[0]?.text || "",
                          }))
                        }
                        disabled={subjectsLoading || subjects.length === 0}
                        required
                      >
                        <option value="">{subjectsLoading ? "Loading..." : subjects.length ? "Select" : "No subjects"}</option>
                        {subjects.map((s) => (
                          <option key={s._id || s.subjectName} value={s._id || s.subjectName}>
                            {s.subjectName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label">Duration (Min)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editForm.duration}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, duration: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Total Marks</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editForm.totalMarks}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, totalMarks: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? "Updating..." : "Update Exam"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .exam-card { transition: all 0.3s ease; }
        .exam-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
        .pulse-animation { animation: pulse-green 2s infinite; }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); }
          100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
        }
      `}</style>
    </div>
  );
};

export default ManageExams;
