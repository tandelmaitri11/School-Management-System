import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaPlus,
  FaCalendarAlt,
  FaLayerGroup,
  FaArrowRight,
  FaSave,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

const AddExam = () => {
  const [examId, setExamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [examData, setExamData] = useState({
    title: "",
    classId: "",
    className: "",
    section: "",
    stream: "",
    subjectId: "",
    subjectName: "",
    duration: "",
    totalMarks: "",
    startTime: "",
  });

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    type: "MCQ",
    options: ["", "", "", ""],
    correctAnswerIndex: -1,
    marks: 1,
  });

  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");
  const toastIds = useRef({});

  const getErrMsg = (err, fallback = "Something went wrong") =>
    err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

  const showToast = (type, message, key) => {
    const idKey = key || message;
    if (toastIds.current[idKey] && toast.isActive(toastIds.current[idKey])) return;

    const fn =
      type === "success"
        ? toast.success
        : type === "error"
        ? toast.error
        : type === "warning"
        ? toast.warning
        : toast.info;

    toastIds.current[idKey] = fn(message);
  };

  useEffect(() => {
    if (!teacherId || !token) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(res.data?.classesFull || []);
        setAssignedSections(res.data?.assignedSections || []);
      } catch (err) {
        showToast("error", getErrMsg(err, "Failed to load teacher classes"), "classes");
      }
    };

    fetchProfile();
  }, [teacherId, token]);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c._id) === String(examData.classId)) || null,
    [classes, examData.classId]
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
    if (!selectedClass?._id) return [];

    const fromTeacher = assignedForClass
      .map((s) => ({ name: normalizeUpper(s.section), stream: normalize(s.stream), fromClass: false }))
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
      if (!examData.stream) return [];
      const exact = base.filter(
        (s) => normalize(s.stream).toLowerCase() === normalize(examData.stream).toLowerCase()
      );
      return Array.from(new Map(exact.map((s) => [s.name, s])).values());
    }

    return Array.from(new Map(base.map((s) => [s.name, s])).values());
  }, [selectedClass, assignedForClass, classHasStreams, examData.stream]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!examData.className) return;
      if (classHasStreams && !examData.stream) {
        setSubjects([]);
        return;
      }

      setSubjects([]);
      setSubjectsLoading(true);
      try {
        const query = examData.stream ? `?stream=${encodeURIComponent(examData.stream)}` : "";
        const res = await api.get(`/api/subjects/getSubjects/${examData.className}${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rows = res.data || [];
        setSubjects(rows);
        if (rows.length === 0) {
          showToast("warning", "No subjects available for selected class/stream", "no-subjects-scope");
        }
      } catch (err) {
        showToast("error", getErrMsg(err, "Could not load subjects"), "subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [examData.className, examData.stream, classHasStreams, token]);

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    setQuestions((prev) => reorder(prev, result.source.index, result.destination.index));
  };

  const handleClassChange = (classDoc) => {
    setExamData((prev) => ({
      ...prev,
      classId: classDoc?._id || "",
      className: classDoc?.className || "",
      stream: "",
      section: "",
      subjectId: "",
      subjectName: "",
    }));
    setSubjects([]);
  };

  const handleSaveExamHeader = async (e) => {
    e.preventDefault();

    if (
      !examData.title ||
      !examData.classId ||
      !examData.section ||
      (classHasStreams && !examData.stream) ||
      !examData.subjectId
    ) {
      return showToast("info", "Please fill all required exam fields", "header-required");
    }

    if (subjects.length === 0) {
      return showToast("info", "No subjects available for selected scope", "no-subjects");
    }

    setLoading(true);
    try {
      const res = await api.post("/api/teacher/add-exam", examData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setExamId(res.data.exam._id);
      showToast("success", "Exam header saved. Add questions now.", "header-saved");
    } catch (err) {
      showToast("error", getErrMsg(err, "Error creating exam"), "create-exam");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const totalMarks = Number(examData.totalMarks || 0);
    const currentUsedMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

    if (currentUsedMarks + Number(currentQuestion.marks) > totalMarks) {
      return showToast(
        "warning",
        `Marks limit exceeded! Remaining: ${totalMarks - currentUsedMarks}`,
        "marks-limit"
      );
    }

    if (!currentQuestion.questionText || currentQuestion.correctAnswerIndex === -1) {
      return showToast("info", "Fill question and select correct answer", "q-required");
    }

    if (currentQuestion.options.some((opt) => opt.trim() === "")) {
      return showToast("info", "All 4 options must be filled", "opt-required");
    }

    const newQ = {
      questionText: currentQuestion.questionText,
      type: "MCQ",
      options: [...currentQuestion.options],
      correctAnswerIndex: currentQuestion.correctAnswerIndex,
      correctAnswer: currentQuestion.options[currentQuestion.correctAnswerIndex],
      marks: Number(currentQuestion.marks),
      _tempId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    };

    setQuestions((prev) => [...prev, newQ]);
    setCurrentQuestion({
      questionText: "",
      type: "MCQ",
      options: ["", "", "", ""],
      correctAnswerIndex: -1,
      marks: 1,
    });

    showToast("success", "Question added", "q-added");
  };

  const handleEditQuestion = (idx) => {
    const q = questions[idx];
    const indexFromString =
      typeof q.correctAnswerIndex === "number"
        ? q.correctAnswerIndex
        : q.options.findIndex((x) => x === q.correctAnswer);

    setCurrentQuestion({
      questionText: q.questionText,
      type: "MCQ",
      options: [...q.options],
      correctAnswerIndex: indexFromString >= 0 ? indexFromString : -1,
      marks: q.marks,
    });
    setEditIndex(idx);
  };

  const handleUpdateQuestion = () => {
    if (editIndex === null) return;
    if (!currentQuestion.questionText || currentQuestion.correctAnswerIndex === -1) {
      return showToast("info", "Fill question and select correct answer", "q-required");
    }
    if (currentQuestion.options.some((opt) => opt.trim() === "")) {
      return showToast("info", "All 4 options must be filled", "opt-required");
    }

    const totalMarks = Number(examData.totalMarks || 0);
    const totalWithoutThis = questions.reduce((sum, q, i) => (i === editIndex ? sum : sum + Number(q.marks)), 0);
    const newTotal = totalWithoutThis + Number(currentQuestion.marks);

    if (newTotal > totalMarks) {
      return showToast(
        "warning",
        `Marks limit exceeded! Remaining: ${totalMarks - totalWithoutThis}`,
        "marks-limit"
      );
    }

    setQuestions((prev) => {
      const updated = [...prev];
      const old = updated[editIndex];
      updated[editIndex] = {
        questionText: currentQuestion.questionText,
        type: "MCQ",
        options: [...currentQuestion.options],
        correctAnswerIndex: currentQuestion.correctAnswerIndex,
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswerIndex],
        marks: Number(currentQuestion.marks),
        _tempId: old._tempId,
      };
      return updated;
    });

    handleCancelEdit();
    showToast("success", "Question updated!", "q-updated");
  };

  const handleCancelEdit = () => {
    setCurrentQuestion({
      questionText: "",
      type: "MCQ",
      options: ["", "", "", ""],
      correctAnswerIndex: -1,
      marks: 1,
    });
    setEditIndex(null);
  };

  const handleFinalPublish = async () => {
    const totalMarks = Number(examData.totalMarks || 0);
    const totalAddedMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

    if (questions.length === 0) return showToast("info", "Add at least 1 question", "no-q");
    if (totalAddedMarks !== totalMarks) {
      return showToast(
        "error",
        `Total marks added (${totalAddedMarks}) must equal Exam Total (${totalMarks})`,
        "marks-mismatch"
      );
    }

    const finalQuestions = questions.map((q) => ({
      questionText: q.questionText,
      type: "MCQ",
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex],
      marks: q.marks,
    }));

    setLoading(true);
    try {
      await api.post(
        "/api/teacher/add-exam-questions",
        { examId, questions: finalQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("success", "Exam Published Successfully!", "published");
      setExamId(null);
      setQuestions([]);
      setSubjects([]);
      setExamData({
        title: "",
        classId: "",
        className: "",
        section: "",
        stream: "",
        subjectId: "",
        subjectName: "",
        duration: "",
        totalMarks: "",
        startTime: "",
      });
      handleCancelEdit();
    } catch (err) {
      showToast("error", getErrMsg(err, "Failed to publish questions"), "publish-error");
    } finally {
      setLoading(false);
    }
  };

  const usedMarks = useMemo(() => questions.reduce((s, q) => s + Number(q.marks), 0), [questions]);
  const totalMarks = Number(examData.totalMarks || 0);

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="container">
        {/* Header Section */}
        <div className="mb-4">
          <h3 className="fw-bold text-dark">Add New Exam</h3>
          <p className="text-muted small">Configure your exam settings, then build your question bank.</p>
        </div>

        <div className="row g-4">
          {/* CONFIGURATION AREA */}
          <div className={examId ? "col-lg-4" : "col-lg-6 mx-auto"}>
            <div className="bg-white p-4 shadow-sm rounded-3 border-0">
              <div className="d-flex align-items-center mb-3">
                <FaCalendarAlt className="me-2 text-primary" />
                <h5 className="mb-0 fw-bold">{examId ? "Exam Header (Locked)" : "1. Exam Header"}</h5>
              </div>

              <form onSubmit={handleSaveExamHeader}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Exam Title</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled={examId}
                    required
                    value={examData.title}
                    onChange={(e) => setExamData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Class</label>
                    <select
                      className="form-select"
                      disabled={examId}
                      required
                      value={examData.classId}
                      onChange={(e) => {
                        const cls = classes.find((c) => String(c._id) === String(e.target.value));
                        handleClassChange(cls);
                      }}
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
                    <label className="form-label small fw-bold">Stream</label>
                    <select
                      className="form-select"
                      disabled={examId || !examData.classId || !classHasStreams}
                      value={examData.stream}
                      onChange={(e) =>
                        setExamData((prev) => ({
                          ...prev,
                          stream: e.target.value,
                          section: "",
                          subjectId: "",
                          subjectName: "",
                        }))
                      }
                    >
                      <option value="">
                        {classHasStreams ? "Select" : "N/A"}
                      </option>
                      {streamOptions.map((stream) => (
                        <option key={stream} value={stream}>
                          {stream}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Section</label>
                    <select
                      className="form-select"
                      disabled={examId || !examData.classId}
                      required
                      value={examData.section}
                      onChange={(e) => setExamData((prev) => ({ ...prev, section: e.target.value }))}
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
                    <label className="form-label small fw-bold">Subject</label>
                    <select
                      className="form-select"
                      disabled={examId || subjectsLoading || subjects.length === 0}
                      required
                      value={examData.subjectId}
                      onChange={(e) =>
                        setExamData((prev) => ({
                          ...prev,
                          subjectId: e.target.value,
                          subjectName: e.target.selectedOptions[0]?.text || "",
                        }))
                      }
                    >
                      <option value="">
                        {subjectsLoading ? "Loading..." : subjects.length === 0 ? "No subjects" : "Select"}
                      </option>
                      {subjects.map((s) => (
                        <option key={s._id || s.subjectName} value={s._id || s.subjectName}>
                          {s.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Duration (Min)</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={examId}
                      required
                      value={examData.duration}
                      onChange={(e) => setExamData((prev) => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Total Marks</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={examId}
                      required
                      value={examData.totalMarks}
                      onChange={(e) => setExamData((prev) => ({ ...prev, totalMarks: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold">Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    disabled={examId}
                    required
                    value={examData.startTime}
                    onChange={(e) => setExamData((prev) => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                {!examId && (
                  <button
                    className="btn btn-primary w-100 fw-bold py-2"
                    type="submit"
                    disabled={loading || subjectsLoading || (classHasStreams && !examData.stream)}
                  >
                    {loading ? "Saving..." : "Next: Add Questions"}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* QUESTION BUILDER AREA */}
          {examId && (
            <div className="col-lg-8">
              <div className="bg-white p-4 shadow-sm rounded-3 border-0">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="text-primary fw-bold m-0"><FaLayerGroup className="me-2"/> 2. Question Bank</h5>
                  <span className="badge bg-dark px-3 py-2">Marks: {usedMarks} / {totalMarks}</span>
                </div>

                {/* Question Input Container */}
                <div className="p-3 bg-light rounded-3 mb-4 border">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Question Text</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={currentQuestion.questionText}
                      onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, questionText: e.target.value }))}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    {currentQuestion.options.map((opt, i) => (
                      <div className="col-md-6" key={i}>
                        <label className="form-label small mb-1">Option {i + 1}</label>
                        <input
                          type="text"
                          className="form-control"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...currentQuestion.options];
                            newOpts[i] = e.target.value;
                            setCurrentQuestion((prev) => ({ ...prev, options: newOpts }));
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="row g-2">
                    <div className="col-md-5">
                      <label className="form-label small fw-bold">Correct Choice</label>
                      <select
                        className="form-select"
                        value={currentQuestion.correctAnswerIndex}
                        onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, correctAnswerIndex: Number(e.target.value) }))}
                      >
                        <option value={-1}>Select Correct</option>
                        {currentQuestion.options.map((opt, i) =>
                          opt.trim() ? (
                            <option key={i} value={i}>
                              {opt}
                            </option>
                          ) : null
                        )}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Points</label>
                      <input
                        type="number"
                        className="form-control"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, marks: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4 align-self-end">
                      {editIndex === null ? (
                        <button className="btn btn-primary w-100" onClick={handleAddQuestion}>
                          <FaPlus className="me-2" /> Add
                        </button>
                      ) : (
                        <div className="d-flex gap-2">
                          <button className="btn btn-success w-100" onClick={handleUpdateQuestion}>
                            <FaSave /> Update
                          </button>
                          <button className="btn btn-outline-secondary w-100" onClick={handleCancelEdit}>
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* List of Questions */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questionsList">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="mb-4">
                        {questions.length === 0 && (
                          <div className="text-center text-muted p-4 border border-dashed rounded-3">No questions added yet. Add one above!</div>
                        )}
                        {questions.map((q, idx) => (
                          <Draggable key={q._tempId} draggableId={q._tempId} index={idx}>
                            {(drag) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className="bg-white border p-3 mb-2 rounded-2 d-flex justify-content-between align-items-center shadow-sm"
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <span className="badge bg-primary text-white">Q{idx + 1}</span>
                                  <span className="small text-truncate">{q.questionText}</span>
                                  <span className="badge bg-light text-dark border">{q.marks} mks</span>
                                </div>
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditQuestion(idx)}>
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => {
                                      if (editIndex === idx) handleCancelEdit();
                                      setQuestions((prev) => prev.filter((_, i) => i !== idx));
                                    }}
                                  >
                                    <FaTrashAlt />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <button
                  className="btn btn-success w-100 fw-bold py-2"
                  onClick={handleFinalPublish}
                  disabled={questions.length === 0 || loading}
                >
                  {loading ? "Publishing..." : "Publish Exam"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExam;