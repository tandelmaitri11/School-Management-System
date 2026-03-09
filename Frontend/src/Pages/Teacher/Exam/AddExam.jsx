import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaPlus,
  FaCalendarAlt,
  FaLayerGroup,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const AddExam = () => {
  // --- States ---
  const [examId, setExamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [examData, setExamData] = useState({
    title: "",
    classId: "",
    className: "",
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

  // ---------------- TOAST HELPERS ----------------
  const toastIds = useRef({});

  const getErrMsg = (err, fallback = "Something went wrong") =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

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

    api
      .get(`/api/classes/by-teacher/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setClasses(res.data))
      .catch((err) =>
        showToast("error", getErrMsg(err, "Failed to load classes"), "classes")
      );
  }, [teacherId, token]);

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

  const handleClassChange = async (cId, cName) => {
    setExamData((prev) => ({
      ...prev,
      classId: cId,
      className: cName,
      subjectId: "",
      subjectName: "",
    }));
    setSubjects([]);

    try {
      const res = await api.get(`/api/subjects/getSubjects/${cName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const subs = res.data || [];
      setSubjects(subs);

      if (subs.length === 0) {
        showToast("info", "No subjects available for this class", "no-subjects");
      }
    } catch (err) {
      showToast("error", getErrMsg(err, "Could not load subjects"), "subjects");
    }
  };

  const handleSaveExamHeader = async (e) => {
    e.preventDefault();

    if (!examData.title || !examData.classId || !examData.subjectId) {
      return showToast("info", "Please fill all exam info fields", "header-required");
    }
    if (subjects.length === 0) {
      return showToast("info", "No subjects available for this class", "no-subjects");
    }

    setLoading(true);
    try {
      const res = await api.post("/api/teacher/add-exam", examData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setExamId(res.data.exam._id);
      showToast(
        "success",
        "Exam header saved! Students will get details .",
        "header-saved"
      );
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

    const totalWithoutThis = questions.reduce((sum, q, i) => {
      if (i === editIndex) return sum;
      return sum + Number(q.marks);
    }, 0);

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

  const usedMarks = useMemo(
    () => questions.reduce((s, q) => s + Number(q.marks), 0),
    [questions]
  );

  const totalMarks = Number(examData.totalMarks || 0);

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">Add Exam</h4>
          <p className="text-muted mb-0 small">Create exam header then add MCQ questions</p>
        </div>

        {examId && <span className="badge bg-success">Step 1 Locked</span>}
      </div>

      <div className="row g-4">
        {/* Left */}
        <div className={examId ? "col-lg-4" : "col-lg-6 mx-auto"}>
          <div className="card border shadow-sm">
            <div className={`card-header fw-bold text-white ${examId ? "bg-dark" : "bg-primary"}`}>
              <FaCalendarAlt className="me-2" />
              {examId ? "Exam Info (Locked)" : "Exam Info"}
            </div>

            <div className="card-body">
              <form onSubmit={handleSaveExamHeader}>
                <div className="mb-3">
                  <label className="form-label">Exam Title</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled={examId}
                    required
                    value={examData.title}
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label">Class</label>
                    <select
                      className="form-select"
                      disabled={examId}
                      required
                      value={examData.classId}
                      onChange={(e) =>
                        handleClassChange(e.target.value, e.target.selectedOptions[0].text)
                      }
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
                    <label className="form-label">Subject</label>
                    <select
                      className="form-select"
                      disabled={examId || subjects.length === 0}
                      required
                      value={examData.subjectId}
                      onChange={(e) =>
                        setExamData({
                          ...examData,
                          subjectId: e.target.value,
                          subjectName: e.target.selectedOptions[0].text,
                        })
                      }
                    >
                      <option value="">
                        {subjects.length === 0 ? "No subjects" : "Select"}
                      </option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label">Duration (Min)</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={examId}
                      required
                      value={examData.duration}
                      onChange={(e) => setExamData({ ...examData, duration: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Total Marks</label>
                    <input
                      type="number"
                      className="form-control"
                      disabled={examId}
                      required
                      value={examData.totalMarks}
                      onChange={(e) => setExamData({ ...examData, totalMarks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    disabled={examId}
                    required
                    value={examData.startTime}
                    onChange={(e) => setExamData({ ...examData, startTime: e.target.value })}
                  />
                </div>

                {!examId && (
                  <button className="btn btn-primary w-100 fw-bold" disabled={loading}>
                    {loading ? "Saving..." : "Proceed"}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Right */}
        {examId && (
          <div className="col-lg-8">
            <div className="card border shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div className="fw-bold">
                  <FaLayerGroup className="me-2 text-primary" />
                  Question Bank
                </div>
                <span className="badge bg-secondary">
                  Marks: {usedMarks} / {totalMarks}
                </span>
              </div>

              <div className="card-body">
                {/* Editor */}
                <div className="border rounded p-3 mb-3 bg-light">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Question</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={currentQuestion.questionText}
                      onChange={(e) =>
                        setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })
                      }
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

                            let newCorrect = currentQuestion.correctAnswerIndex;
                            if (newCorrect === i && e.target.value.trim() === "") newCorrect = -1;

                            setCurrentQuestion({
                              ...currentQuestion,
                              options: newOpts,
                              correctAnswerIndex: newCorrect,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="row g-2 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Correct Answer</label>
                      <select
                        className="form-select"
                        value={currentQuestion.correctAnswerIndex}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswerIndex: Number(e.target.value),
                          })
                        }
                      >
                        <option value={-1}>Select</option>
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
                      <label className="form-label fw-semibold">Marks</label>
                      <input
                        type="number"
                        className="form-control"
                        value={currentQuestion.marks}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, marks: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-4">
                      {editIndex === null ? (
                        <button
                          type="button"
                          className="btn btn-primary w-100"
                          onClick={handleAddQuestion}
                        >
                          <FaPlus className="me-2" /> Add
                        </button>
                      ) : (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-success w-100"
                            onClick={handleUpdateQuestion}
                          >
                            <FaCheckCircle className="me-2" /> Update
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary w-100"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questionsList">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="mb-3">
                        {questions.length === 0 && (
                          <div className="text-center text-muted small py-3">
                            No questions added yet.
                          </div>
                        )}

                        {questions.map((q, idx) => (
                          <Draggable key={q._tempId} draggableId={q._tempId} index={idx}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="border rounded p-3 mb-2 d-flex justify-content-between align-items-center"
                              >
                                <div className="small">
                                  <span className="fw-bold me-2">Q{idx + 1}</span>
                                  {q.questionText.substring(0, 70)}
                                  {q.questionText.length > 70 ? "..." : ""}
                                  <span className="ms-2 badge bg-light text-dark border">
                                    {q.marks} marks
                                  </span>
                                </div>

                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEditQuestion(idx)}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => {
                                      if (editIndex === idx) handleCancelEdit();
                                      setQuestions(questions.filter((_, i) => i !== idx));
                                      showToast("info", "Question removed", "q-removed");
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
                  className="btn btn-success w-100 fw-bold"
                  onClick={handleFinalPublish}
                  disabled={questions.length === 0 || loading}
                >
                  {loading ? "Publishing..." : "Publish Exam"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExam;
