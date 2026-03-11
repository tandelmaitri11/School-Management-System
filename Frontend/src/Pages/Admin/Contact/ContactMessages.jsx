import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

const STATUS_OPTIONS = ["New", "Responded", "Closed"];

export default function ContactMessages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => rows.find((r) => String(r._id) === String(selectedId)) || null,
    [rows, selectedId]
  );

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (search.trim()) params.append("q", search.trim());
      const res = await api.get(`/api/contact/admin/messages${params.toString() ? `?${params}` : ""}`);
      const data = res.data?.data || [];
      setRows(data);
      if (!selectedId && data.length) setSelectedId(data[0]._id);
    } catch (e) {
      setMessage(e?.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleFilter = async () => {
    setMessage("");
    await loadMessages();
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/contact/admin/messages/${id}/status`, { status });
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
    } catch (e) {
      setMessage("Status update failed");
    }
  };

  const sendResponse = async () => {
    if (!selected || !responseText.trim()) return;
    try {
      setSending(true);
      const res = await api.put(`/api/contact/admin/messages/${selected._id}/respond`, {
        response: responseText,
        status: "Responded",
      });
      setMessage(res.data?.message || "Reply sent successfully");
      setResponseText("");
      await loadMessages();
    } catch (e) {
      setMessage("Error sending response");
    } finally {
      setSending(false);
    }
  };

  // Logic for dynamic Bootstrap classes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "New": return "bg-primary-subtle text-primary border border-primary-subtle";
      case "Responded": return "bg-success-subtle text-success border border-success-subtle";
      case "Closed": return "bg-secondary-subtle text-secondary border border-secondary-subtle";
      default: return "bg-light text-dark";
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        
        {/* Header Area */}
        <div className="row align-items-center mb-4">
          <div className="col">
            <h1 className="h3 fw-bold mb-1 text-dark">
              <i className="bi bi-envelope-paper-heart me-2 text-primary"></i>Support Inbox
            </h1>
            <p className="text-muted mb-0">Review and reply to client inquiries.</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-white border shadow-sm px-3" onClick={loadMessages}>
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className="alert alert-primary border-0 shadow-sm rounded-3 d-flex align-items-center mb-4 fade show">
            <i className="bi bi-info-circle-fill me-2"></i>
            <div>{message}</div>
            <button type="button" className="btn-close ms-auto shadow-none" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Search & Filters Card */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-md-3">
                <select className="form-select bg-light border-0 py-2 shadow-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">Filter: All Messages</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-7">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                  <input
                    className="form-control bg-light border-0 py-2 shadow-none"
                    placeholder="Search by name, email, or message keyword..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100 py-2 fw-semibold" onClick={handleFilter} disabled={loading}>
                  {loading ? "Searching..." : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="row g-4">
          
          {/* Inbox Column */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ minHeight: '600px' }}>
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0">Recent Messages</h6>
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {rows.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-mailbox fs-1 d-block mb-2"></i>
                    <small>No inquiries found</small>
                  </div>
                ) : (
                  rows.map((row) => (
                    <button
                      key={row._id}
                      onClick={() => { setSelectedId(row._id); setResponseText(row.adminResponse || ""); }}
                      className={`list-group-item list-group-item-action border-0 p-3 mb-1 transition-all ${selectedId === row._id ? 'bg-primary-subtle border-start border-primary border-4 shadow-sm' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-bold text-dark">{row.firstName}</span>
                        <span className={`badge rounded-pill px-2 ${getStatusBadgeClass(row.status)}`} style={{ fontSize: '0.65rem' }}>
                          {row.status}
                        </span>
                      </div>
                      <div className="text-muted small text-truncate mb-1">{row.email}</div>
                      <div className="text-secondary small text-truncate">{row.message}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Reading Pane Column */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ minHeight: '600px' }}>
              {!selected ? (
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center opacity-75">
                  <div className="bg-light rounded-pill p-4 mb-3">
                    <i className="bi bi-chat-left-dots text-primary fs-1"></i>
                  </div>
                  <h5 className="fw-bold">Welcome to Support</h5>
                  <p className="text-muted px-5">Select a customer message from the sidebar to view full details and provide a response.</p>
                </div>
              ) : (
                <div className="d-flex flex-column h-100">
                  
                  {/* Message Detail Header */}
                  <div className="p-4 border-bottom bg-white d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center fw-bold" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                        {selected.firstName.charAt(0)}
                      </div>
                    </div>
                    <div className="ms-3 flex-grow-1">
                      <h5 className="fw-bold mb-0">{selected.firstName} {selected.lastName}</h5>
                      <span className="text-muted small">
                        <i className="bi bi-clock me-1"></i> {new Date(selected.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="ms-auto">
                      <select 
                        className="form-select form-select-sm fw-bold border-0 bg-light text-primary" 
                        value={selected.status} 
                        onChange={(e) => updateStatus(selected._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-4 flex-grow-1 bg-light-subtle">
                    <label className="text-uppercase text-muted fw-bold small mb-3 d-block tracking-wider">User Message</label>
                    <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
                      <p className="mb-0 text-dark lh-lg" style={{ whiteSpace: 'pre-line' }}>{selected.message}</p>
                    </div>
                    <div className="mt-3 text-muted small">
                      <i className="bi bi-info-circle me-1"></i> Received via Contact Form from <strong>{selected.email}</strong>
                    </div>
                  </div>

                  {/* Reply Area */}
                  <div className="p-4 border-top bg-white">
                    <label className="text-uppercase text-muted fw-bold small mb-3 d-block tracking-wider">Compose Response</label>
                    <div className="bg-light rounded-4 p-2 shadow-inner border border-light">
                      <textarea
                        className="form-control border-0 bg-transparent shadow-none"
                        rows="5"
                        placeholder="Type your reply here... (User will receive this via email)"
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        style={{ resize: 'none' }}
                      />
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                      <button 
                        className="btn btn-primary px-4 py-2 fw-bold rounded-pill shadow-sm" 
                        onClick={sendResponse} 
                        disabled={sending}
                      >
                        {sending ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                        ) : (
                          <><i className="bi bi-send-fill me-2"></i>Send Response</>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}