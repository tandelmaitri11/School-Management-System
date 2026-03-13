import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { getSocket } from "../../socket/socketClient";

export default function ParentTeacherCommunication() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [message, setMessage] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/parent/students");
        const rows = res.data?.students || [];
        setStudents(rows);
        setSelectedStudentId(rows[0]?.id || "");
      } catch (err) {
        setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to load students" });
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const loadDetails = async (studentId) => {
    if (!studentId) {
      setTeachers([]);
      setThreads([]);
      setSelectedTeacherId("");
      return;
    }
    try {
      setDetailLoading(true);
      const [teachersRes, threadsRes] = await Promise.all([
        api.get(`/api/parent/student/${studentId}/teachers`),
        api.get(`/api/parent/student/${studentId}/messages`),
      ]);
      const teacherRows = teachersRes.data?.teachers || [];
      const threadRows = threadsRes.data?.threads || [];
      setTeachers(teacherRows);
      setThreads(threadRows);
      setSelectedTeacherId((prev) => (teacherRows.some((teacher) => teacher.id === prev) ? prev : teacherRows[0]?.id || ""));
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to load teacher communication" });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadDetails(selectedStudentId);
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.teacher?.id === selectedTeacherId) || null,
    [threads, selectedTeacherId]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onChatUpdated = (payload) => {
      if (String(payload?.studentId || "") === String(selectedStudentId || "")) {
        loadDetails(selectedStudentId);
      }
    };

    const onTyping = (payload) => {
      if (
        String(payload?.teacherId || "") === String(selectedTeacherId || "") &&
        String(payload?.studentId || "") === String(selectedStudentId || "") &&
        payload?.senderRole === "Teacher"
      ) {
        setIsOtherTyping(Boolean(payload?.isTyping));
      }
    };

    const onSeen = (payload) => {
      if (String(payload?.threadId || "") === String(selectedThread?.id || "")) {
        loadDetails(selectedStudentId);
      }
    };

    socket.on("chat:updated", onChatUpdated);
    socket.on("chat:typing", onTyping);
    socket.on("chat:seen", onSeen);
    return () => {
      socket.off("chat:updated", onChatUpdated);
      socket.off("chat:typing", onTyping);
      socket.off("chat:seen", onSeen);
    };
  }, [selectedStudentId, selectedTeacherId, selectedThread?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTeacherId || !message.trim()) return;

    try {
      setSubmitting(true);
      setFeedback({ type: "", message: "" });
      const res = await api.post(`/api/parent/student/${selectedStudentId}/messages`, {
        teacherId: selectedTeacherId,
        message,
      });
      setFeedback({ type: "", message: "" });
      setMessage("");
      await loadDetails(selectedStudentId);
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to send message" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedThread?.id || !selectedStudentId) return;
    try {
      setDeletingThread(true);
      setFeedback({ type: "", message: "" });
      await api.delete(`/api/parent/student/${selectedStudentId}/messages/${selectedThread.id}`);
      await loadDetails(selectedStudentId);
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to delete chat" });
    } finally {
      setDeletingThread(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedThread?.id) return;

    socket.emit("chat:seen", {
      threadId: selectedThread.id,
      parentId: localStorage.getItem("parentObjectId") || localStorage.getItem("parentId"),
      teacherId: selectedTeacherId,
    });
  }, [selectedThread?.id, selectedTeacherId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedTeacherId) return undefined;

    const isTyping = message.trim().length > 0;
    socket.emit("chat:typing", {
      parentId: localStorage.getItem("parentObjectId") || localStorage.getItem("parentId"),
      teacherId: selectedTeacherId,
      studentId: selectedStudentId,
      isTyping,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:typing", {
          parentId: localStorage.getItem("parentObjectId") || localStorage.getItem("parentId"),
          teacherId: selectedTeacherId,
          studentId: selectedStudentId,
          isTyping: false,
        });
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedTeacherId, selectedStudentId]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status"></div>
        <div className="mt-3 text-muted fw-medium fs-5">Loading teacher communication...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ height: "calc(100vh - 60px)" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bolder mb-1 text-dark">Teacher Chat</h2>
          <p className="text-muted mb-0">Stay connected with your child's educators.</p>
        </div>
        
        {/* Modern Student Selector */}
        <div className="bg-white p-2 rounded-pill shadow-sm border d-flex align-items-center gap-2 px-3" style={{ minWidth: "280px" }}>
          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "30px", height: "30px" }}>
            <i className="bi bi-person-fill"></i>
          </div>
          <select
            className="form-select form-select-sm border-0 shadow-none fw-bold text-dark bg-transparent"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show shadow-sm`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: "", message: "" })}></button>
        </div>
      )}

      {!students.length ? (
        <div className="alert alert-warning shadow-sm border-0 rounded-4 p-4 text-center">
          <i className="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>
          <h5 className="fw-bold">No linked students found</h5>
          <p className="mb-0 text-muted">Please contact the administration to link your child to this account.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ minHeight: "600px", height: "75vh" }}>
          <div className="row g-0 h-100">
            
            {/* Left Sidebar: Teachers List */}
            <div className="col-lg-4 col-md-5 bg-light border-end d-flex flex-column h-100">
              <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-uppercase text-secondary" style={{ letterSpacing: "0.5px" }}>Teachers</h6>
              </div>

              <div className="flex-grow-1 overflow-auto p-2">
                {detailLoading ? (
                  <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div> Loading...
                  </div>
                ) : !teachers.length ? (
                  <div className="text-center mt-5 text-muted">No teachers available.</div>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {teachers.map((teacher) => {
                      const thread = threads.find((row) => row.teacher?.id === teacher.id);
                      const lastMessage = thread?.messages?.[thread.messages.length - 1];
                      const isSelected = selectedTeacherId === teacher.id;

                      return (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => setSelectedTeacherId(teacher.id)}
                          className={`btn text-start border-0 rounded-3 p-3 transition-all ${
                            isSelected ? "bg-primary text-white shadow-sm" : "bg-transparent text-dark hover-bg-white"
                          }`}
                          style={{ transition: "all 0.2s" }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            {/* Avatar */}
                            <div className={`rounded-circle d-flex justify-content-center align-items-center fw-bold flex-shrink-0 ${isSelected ? "bg-white text-primary" : "bg-primary text-white"}`} style={{ width: "40px", height: "40px" }}>
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Text Info */}
                            <div className="overflow-hidden w-100">
                              <div className="fw-bold text-truncate">{teacher.name}</div>
                              <div className={`small mb-1 ${isSelected ? "text-white-50" : "text-secondary"}`}>
                                {teacher.roleLabel}
                              </div>
                              <div className={`small text-truncate ${isSelected ? "text-white" : "text-muted"}`}>
                                {lastMessage?.text || <span className="fst-italic">Start chat...</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Area: Active Chat */}
            <div className="col-lg-8 col-md-7 d-flex flex-column h-100 bg-white">
              {!selectedTeacher ? (
                <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted bg-light">
                  <i className="bi bi-chat-text fs-1 mb-3 text-secondary"></i>
                  <h5>Select a teacher</h5>
                  <p>Choose a teacher from the left to start messaging.</p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white shadow-sm" style={{ zIndex: 10 }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center fw-bold" style={{ width: "45px", height: "45px", fontSize: "1.2rem" }}>
                        {selectedTeacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0">{selectedTeacher.name}</h5>
                        <span className="text-muted small">
                          {selectedTeacher.roleLabel} <span className="mx-1">•</span> Student: <span className="fw-medium">{selectedStudent?.name || "-"}</span>
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {selectedThread && (
                        <span className={`badge px-3 py-2 rounded-pill ${selectedThread.status === "Resolved" ? "bg-success" : "bg-primary"}`}>
                          {selectedThread.status}
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDeleteThread}
                        disabled={deletingThread || !selectedThread?.id}
                      >
                        {deletingThread ? "Deleting..." : "Clear Chat"}
                      </button>
                    </div>
                  </div>
                  {deletingThread ? (
                    <div className="px-3 pt-2 bg-white">
                      <div className="progress" style={{ height: "6px" }}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-danger" style={{ width: "100%" }} />
                      </div>
                    </div>
                  ) : null}

                  {/* Messages Area */}
                  <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="d-flex flex-column gap-3">
                      {!selectedThread?.messages?.length ? (
                        <div className="text-center mt-5 text-muted">
                          <div className="bg-white d-inline-block p-3 rounded-pill shadow-sm border">
                            No messages yet. Say hello! 👋
                          </div>
                        </div>
                      ) : (
                        selectedThread.messages.map((item, index) => {
                          const lastParentIndex = selectedThread.messages
                            .map((message) => message.senderRole)
                            .lastIndexOf("Parent");
                          const isParent = item.senderRole === "Parent";
                          const isLastParent = index === lastParentIndex;
                          const seenAt = selectedThread.lastSeenByTeacherAt
                            ? new Date(selectedThread.lastSeenByTeacherAt)
                            : null;
                          const isSeen =
                            isLastParent && isParent && seenAt && seenAt >= new Date(item.sentAt);
                          return (
                            <div key={`${selectedThread.id}-${index}`} className={`d-flex ${isParent ? "justify-content-end" : "justify-content-start"}`}>
                              <div
                                className={`p-3 shadow-sm ${isParent ? "bg-primary text-white" : "bg-white text-dark border"}`}
                                style={{ 
                                  maxWidth: "75%", 
                                  borderRadius: "1rem", 
                                  borderBottomRightRadius: isParent ? "0.2rem" : "1rem",
                                  borderBottomLeftRadius: isParent ? "1rem" : "0.2rem"
                                }}
                              >
                                <div style={{ wordBreak: "break-word" }}>{item.text}</div>
                                <div className={`small mt-1 ${isParent ? "text-white-50 text-end" : "text-muted"}`} style={{ fontSize: "0.7rem" }}>
                                  {new Date(item.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                                {isSeen ? <div className="small text-white-50 text-end">Seen</div> : null}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {isOtherTyping ? <div className="small text-muted mb-2">Teacher is typing...</div> : null}
                  </div>

                  {/* Message Input Form */}
                  <div className="p-3 border-top bg-white">
                    <form onSubmit={handleSubmit}>
                      <div className="d-flex flex-column gap-2">
                        <textarea
                          className="form-control bg-light border-0 shadow-none focus-ring focus-ring-primary rounded-3 p-3"
                          rows="2"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type a message to the teacher..."
                          style={{ resize: "none" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <small className="text-muted ps-2 d-none d-md-block">Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for new line</small>
                          <small className="text-muted ps-2 d-md-none"></small>
                          <button 
                            className="btn btn-primary px-4 py-2 rounded-pill fw-medium shadow-sm d-flex align-items-center gap-2 ms-auto" 
                            type="submit" 
                            disabled={submitting || !message.trim()}
                          >
                            {submitting ? (
                              <><div className="spinner-border spinner-border-sm"></div> Sending...</>
                            ) : (
                              <>Send <i className="bi bi-send-fill"></i></>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
