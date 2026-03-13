import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import { getSocket } from "../../../socket/socketClient";

export default function ParentMessages() {
  const [threads, setThreads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [reply, setReply] = useState("");
  const [resolveAfterReply, setResolveAfterReply] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const typingTimeoutRef = useRef(null);

  const loadThreads = async (nextStatus = statusFilter) => {
    try {
      setLoading(true);
      const params = nextStatus === "All" ? {} : { status: nextStatus };
      const res = await api.get("/api/teachers/parent/messages", { params });
      const rows = res.data?.threads || [];
      setThreads(rows);
      setSelectedThreadId((prev) => (rows.some((row) => row.id === prev) ? prev : rows[0]?.id || ""));
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to load parent messages" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads("All");
  }, []);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onChatUpdated = () => {
      loadThreads(statusFilter);
    };

    const onTyping = (payload) => {
      if (
        String(payload?.parentId || "") === String(selectedThread?.parent?.id || "") &&
        String(payload?.studentId || "") === String(selectedThread?.student?.id || "") &&
        payload?.senderRole === "Parent"
      ) {
        setIsOtherTyping(Boolean(payload?.isTyping));
      }
    };

    const onSeen = (payload) => {
      if (String(payload?.threadId || "") === String(selectedThread?.id || "")) {
        loadThreads(statusFilter);
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
  }, [statusFilter, selectedThread?.id, selectedThread?.parent?.id, selectedThread?.student?.id]);

  const sendReply = async () => {
    if (!selectedThreadId || !reply.trim()) return;
    try {
      setSubmitting(true);
      setFeedback({ type: "", message: "" });
      const res = await api.post(`/api/teachers/parent/messages/${selectedThreadId}/reply`, {
        message: reply,
        status: resolveAfterReply ? "Resolved" : "Open",
      });
      setFeedback({ type: "", message: "" });
      setReply("");
      setResolveAfterReply(false);
      await loadThreads(statusFilter);
    } catch (err) {
      setFeedback({ type: "danger", message: err.response?.data?.message || "Failed to send reply" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedThread?.id) return;
    try {
      setDeletingThread(true);
      setFeedback({ type: "", message: "" });
      await api.delete(`/api/teachers/parent/messages/${selectedThread.id}`);
      await loadThreads(statusFilter);
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
      parentId: selectedThread?.parent?.id,
      teacherId: localStorage.getItem("teacherId"),
    });
  }, [selectedThread?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedThread?.id) return undefined;

    const isTyping = reply.trim().length > 0;
    socket.emit("chat:typing", {
      parentId: selectedThread?.parent?.id,
      teacherId: localStorage.getItem("teacherId"),
      studentId: selectedThread?.student?.id,
      isTyping,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:typing", {
          parentId: selectedThread?.parent?.id,
          teacherId: localStorage.getItem("teacherId"),
          studentId: selectedThread?.student?.id,
          isTyping: false,
        });
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [reply, selectedThread?.id, selectedThread?.parent?.id, selectedThread?.student?.id]);

  return (
    <div className="container-fluid py-4" style={{ height: "calc(100vh - 60px)" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bolder mb-1 text-dark">Parent Messages</h2>
          <p className="text-muted mb-0">Manage and reply to parent conversations seamlessly.</p>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show shadow-sm`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: "", message: "" })}></button>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ minHeight: "600px", height: "75vh" }}>
        <div className="row g-0 h-100">
          
          {/* Left Sidebar: Threads List */}
          <div className="col-lg-4 col-md-5 bg-light border-end d-flex flex-column h-100">
            {/* Sidebar Header */}
            <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-uppercase text-secondary" style={{ letterSpacing: "0.5px" }}>Conversations</h6>
              <select
                className="form-select form-select-sm shadow-none border-secondary-subtle"
                style={{ width: "auto" }}
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value);
                  loadThreads(value);
                }}
              >
                <option value="All">All</option>
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Threads List */}
            <div className="flex-grow-1 overflow-auto p-2">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div> Loading...
                </div>
              ) : !threads.length ? (
                <div className="text-center mt-5 text-muted">No conversations found.</div>
              ) : (
                <div className="d-flex flex-column gap-1">
                  {threads.map((thread) => {
                    const isSelected = selectedThreadId === thread.id;
                    const lastMsg = thread.messages?.[thread.messages.length - 1]?.text || "Open chat...";
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`btn text-start border-0 rounded-3 p-3 transition-all ${
                          isSelected ? "bg-primary text-white shadow-sm" : "bg-transparent text-dark hover-bg-light"
                        }`}
                        style={{ transition: "all 0.2s" }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-truncate" style={{ maxWidth: "70%" }}>
                            {thread.parent?.name || "Parent"}
                          </span>
                          <span className={`badge rounded-pill ${thread.status === "Resolved" ? (isSelected ? "bg-light text-success" : "bg-success-subtle text-success") : (isSelected ? "bg-light text-primary" : "bg-primary-subtle text-primary")}`} style={{ fontSize: "0.7rem" }}>
                            {thread.status}
                          </span>
                        </div>
                        <div className={`small mb-1 ${isSelected ? "text-white-50" : "text-secondary"}`}>
                          Student: {thread.student?.name || "-"} (Class {thread.student?.className || "-"} {thread.student?.section || ""})
                        </div>
                        <div className={`small text-truncate ${isSelected ? "text-white" : "text-muted"}`}>
                          {lastMsg}
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
            {!selectedThread ? (
              <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted bg-light">
                <i className="bi bi-chat-dots fs-1 mb-3 text-secondary"></i>
                <h5>Select a conversation</h5>
                <p>Choose a thread from the left to start messaging.</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white shadow-sm" style={{ zIndex: 10 }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center fw-bold" style={{ width: "45px", height: "45px", fontSize: "1.2rem" }}>
                      {(selectedThread.parent?.name || "P")[0].toUpperCase()}
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0">{selectedThread.parent?.name || "Parent"}</h5>
                      <span className="text-muted small">
                        Student: <span className="fw-medium">{selectedThread.student?.name || "-"}</span> | Class {selectedThread.student?.className || "-"} {selectedThread.student?.section || ""}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge px-3 py-2 rounded-pill ${selectedThread.status === "Resolved" ? "bg-success" : "bg-primary"}`}>
                      {selectedThread.status}
                    </span>
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
                    {selectedThread.messages.map((message, index) => {
                      const isTeacher = message.senderRole === "Teacher";
                      const isLast = index === selectedThread.messages.length - 1;
                      const seenAt = selectedThread.lastSeenByParentAt
                        ? new Date(selectedThread.lastSeenByParentAt)
                        : null;
                      const isSeen =
                        isLast && isTeacher && seenAt && seenAt >= new Date(message.sentAt);
                      return (
                        <div key={`${selectedThread.id}-${index}`} className={`d-flex ${isTeacher ? "justify-content-end" : "justify-content-start"}`}>
                          <div
                            className={`p-3 shadow-sm ${isTeacher ? "bg-primary text-white" : "bg-white text-dark border"}`}
                            style={{ 
                              maxWidth: "75%", 
                              borderRadius: "1rem", 
                              borderBottomRightRadius: isTeacher ? "0.2rem" : "1rem",
                              borderBottomLeftRadius: isTeacher ? "1rem" : "0.2rem"
                            }}
                          >
                            <div className={`small mb-1 fw-bold ${isTeacher ? "text-white-50 text-end" : "text-secondary"}`}>
                              {message.senderRole}
                            </div>
                            <div style={{ wordBreak: "break-word" }}>{message.text}</div>
                            <div className={`small mt-2 ${isTeacher ? "text-white-50 text-end" : "text-muted"}`} style={{ fontSize: "0.7rem" }}>
                              {new Date(message.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                            {isSeen ? <div className="small text-white-50 text-end">Seen</div> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isOtherTyping ? <div className="small text-muted px-4 pb-2">Parent is typing...</div> : null}

                {/* Message Input Area */}
                <div className="p-3 border-top bg-white">
                  <div className="d-flex flex-column gap-2">
                    <textarea
                      className="form-control bg-light border-0 shadow-none focus-ring focus-ring-primary rounded-3 p-3"
                      rows="3"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply here..."
                      style={{ resize: "none" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <div className="form-check form-switch ps-5">
                        <input
                          className="form-check-input ms-[-2.5em]"
                          type="checkbox"
                          role="switch"
                          id="resolveAfterReply"
                          checked={resolveAfterReply}
                          onChange={(e) => setResolveAfterReply(e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                        <label className="form-check-label text-muted small user-select-none" htmlFor="resolveAfterReply" style={{ cursor: "pointer" }}>
                          Mark as Resolved
                        </label>
                      </div>
                      <button 
                        className="btn btn-primary px-4 py-2 rounded-pill fw-medium shadow-sm d-flex align-items-center gap-2" 
                        disabled={submitting || !reply.trim()} 
                        onClick={sendReply}
                      >
                        {submitting ? (
                          <><div className="spinner-border spinner-border-sm"></div> Sending...</>
                        ) : (
                          <>Send <i className="bi bi-send-fill"></i></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
