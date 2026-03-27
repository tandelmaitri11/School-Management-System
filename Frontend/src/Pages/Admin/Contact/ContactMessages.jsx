import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const STATUS_OPTIONS = ["New", "Responded", "Closed"];

// Generate a consistent pastel color based on a string (for avatars)
const stringToColor = (string) => {
  if (!string) return "hsl(0, 0%, 85%)";
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 85%)`; 
};

const getInitials = (firstName, lastName) => {
  const f = firstName ? firstName.charAt(0) : "?";
  const l = lastName ? lastName.charAt(0) : "";
  return (f + l).toUpperCase();
};

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "New": return "bg-primary bg-opacity-10 text-primary border-primary border-opacity-25";
      case "Responded": return "bg-success bg-opacity-10 text-success border-success border-opacity-25";
      case "Closed": return "bg-secondary bg-opacity-10 text-secondary border-secondary border-opacity-25";
      default: return "bg-light text-dark border-secondary";
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .message-item { border-left: 4px solid transparent; transition: all 0.2s ease; }
        .message-item:hover { background-color: #f8fafc; }
        .message-item.active-msg { background-color: #f8fafc; border-left-color: #4f46e5; }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Feedback Alert */}
        {message && (
          <div className="alert alert-primary border-0 shadow-sm rounded-4 d-flex align-items-center mb-4 animate-fade-in">
            <i className="bi bi-info-circle-fill me-3 fs-5"></i>
            <div className="fw-medium">{message}</div>
            <button type="button" className="btn-close ms-auto shadow-none" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-envelope-paper-heart me-1"></i> Client Relations
            </span>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Support Inbox</h2>
                <p className="text-white opacity-75 fw-medium mb-0">Review client inquiries, provide assistance, and track communication.</p>
              </div>
              <button className="btn bg-white text-primary rounded-pill px-4 py-2 fw-bold shadow-sm transition-all" onClick={loadMessages} disabled={loading}>
                <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i> 
                {loading ? "Syncing Inbox..." : "Refresh Inbox"}
              </button>
            </div>
          </div>
          
          {/* Glassmorphism Control Panel */}
          <div className="position-relative z-1 d-flex flex-column flex-lg-row gap-3 p-3 rounded-4 shadow-sm align-items-center" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            
            <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3 py-1 flex-grow-1" style={{ minWidth: '200px' }}>
              <span className="small fw-bold text-white me-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Status:</span>
              <select
                className="form-select input-premium py-2 bg-transparent text-white border-0 shadow-none fw-semibold"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="text-dark">All Messages</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="text-dark">{s}</option>)}
              </select>
            </div>

            <div className="position-relative flex-grow-1" style={{ minWidth: "300px" }}>
              <i className="bi bi-search position-absolute text-white" style={{ top: '50%', transform: 'translateY(-50%)', left: '16px' }}></i>
              <input
                type="text"
                className="form-control input-premium w-100 bg-white bg-opacity-25 border-0 text-white placeholder-white"
                style={{ paddingLeft: '44px' }}
                placeholder="Search by name, email, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              />
            </div>

            <button 
              className="btn btn-brand rounded-pill px-4 py-2 fw-bold shadow-sm" 
              onClick={handleFilter}
              style={{ minWidth: '120px' }}
              disabled={loading}
            >
              Search
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <div className="row g-4 animate-fade-in">
          
          {/* Inbox Column */}
          <div className="col-lg-4">
            <div className="premium-card overflow-hidden d-flex flex-column" style={{ height: '700px' }}>
              <div className="bg-light px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bolder mb-0 text-dark text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                  Inbox Directory
                </h6>
                <span className="badge bg-primary rounded-pill px-2 py-1">{rows.length} Total</span>
              </div>
              
              <div className="list-group list-group-flush custom-scroll flex-grow-1" style={{ overflowY: 'auto' }}>
                {loading && rows.length === 0 ? (
                   <div className="p-5 text-center text-muted">
                     <div className="spinner-border text-primary mb-3" role="status"></div>
                     <div className="fw-medium small">Loading messages...</div>
                   </div>
                ) : rows.length === 0 ? (
                  <div className="p-5 text-center text-muted h-100 d-flex flex-column align-items-center justify-content-center">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                      <i className="bi bi-mailbox fs-2"></i>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Inbox Zero</h6>
                    <small>No inquiries match your filters.</small>
                  </div>
                ) : (
                  rows.map((row) => {
                    const avatarColor = stringToColor(row.firstName);
                    const isActive = selectedId === row._id;

                    return (
                      <button
                        key={row._id}
                        onClick={() => { setSelectedId(row._id); setResponseText(row.adminResponse || ""); }}
                        className={`list-group-item list-group-item-action border-bottom py-3 px-4 message-item ${isActive ? 'active-msg' : 'border-0'}`}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bolder text-dark shadow-sm flex-shrink-0"
                            style={{ width: '40px', height: '40px', fontSize: '0.9rem', backgroundColor: avatarColor }}
                          >
                            {getInitials(row.firstName, row.lastName)}
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark text-truncate d-block" style={{ maxWidth: '65%' }}>
                                {row.firstName} {row.lastName}
                              </span>
                              <span className={`badge rounded-pill border ${getStatusBadgeClass(row.status)}`} style={{ fontSize: '0.65rem' }}>
                                {row.status}
                              </span>
                            </div>
                            <div className="text-muted fw-medium text-truncate mb-1" style={{ fontSize: '0.75rem' }}>
                              {row.email}
                            </div>
                            <div className="text-secondary small text-truncate" style={{ fontSize: '0.8rem' }}>
                              {row.message}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Reading Pane Column */}
          <div className="col-lg-8">
            <div className="premium-card h-100 overflow-hidden d-flex flex-column" style={{ height: '700px' }}>
              {!selected ? (
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center opacity-75 h-100">
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-4 shadow-sm" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-chat-left-dots text-primary display-6"></i>
                  </div>
                  <h4 className="fw-bolder text-dark">Welcome to Support Desk</h4>
                  <p className="text-muted px-5" style={{ maxWidth: '500px' }}>Select a customer message from the sidebar directory to view its full contents and draft a response.</p>
                </div>
              ) : (
                <div className="d-flex flex-column h-100">
                  
                  {/* Message Detail Header */}
                  <div className="p-4 border-bottom bg-white d-flex align-items-center flex-wrap gap-3">
                    <div className="flex-shrink-0">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bolder text-dark shadow-sm"
                        style={{ width: '56px', height: '56px', fontSize: '1.2rem', backgroundColor: stringToColor(selected.firstName) }}
                      >
                        {getInitials(selected.firstName, selected.lastName)}
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h4 className="fw-bolder mb-1 text-dark">{selected.firstName} {selected.lastName}</h4>
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted small fw-medium">
                          <i className="bi bi-envelope me-1"></i> {selected.email}
                        </span>
                        <span className="text-muted small fw-medium border-start ps-3">
                          <i className="bi bi-clock me-1"></i> {new Date(selected.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="ms-auto">
                      <select 
                        className="form-select form-select-sm fw-bold border bg-light text-dark rounded-pill px-3 py-2 shadow-sm" 
                        value={selected.status} 
                        onChange={(e) => updateStatus(selected._id, e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s} Status</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-4 flex-grow-1 bg-light custom-scroll" style={{ overflowY: 'auto' }}>
                    <label className="text-uppercase text-muted fw-bold small mb-3 d-flex align-items-center tracking-wider" style={{ letterSpacing: '1px' }}>
                      <i className="bi bi-text-paragraph me-2"></i> Client Inquiry
                    </label>
                    <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light">
                      <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: '1.7' }}>
                        {selected.message}
                      </p>
                    </div>
                  </div>

                  {/* Reply Area */}
                  <div className="p-4 border-top bg-white">
                    <label className="text-uppercase text-muted fw-bold small mb-3 d-flex align-items-center tracking-wider" style={{ letterSpacing: '1px' }}>
                      <i className="bi bi-reply-fill me-2 fs-5 text-primary"></i> Compose Response
                    </label>
                    <div className="bg-light rounded-4 p-2 border border-secondary border-opacity-10 focus-ring-primary transition-all">
                      <textarea
                        className="form-control border-0 bg-transparent shadow-none custom-scroll"
                        rows="4"
                        placeholder="Draft your reply here. The client will receive this response via email..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        style={{ resize: 'none', fontWeight: '500' }}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="text-muted small fw-medium">
                        {responseText.length > 0 ? `${responseText.length} characters` : ""}
                      </div>
                      <button 
                        className="btn btn-brand px-4 py-2 fw-bold rounded-pill shadow-sm d-flex align-items-center" 
                        onClick={sendResponse} 
                        disabled={sending || !responseText.trim()}
                      >
                        {sending ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Transmitting...</>
                        ) : (
                          <><i className="bi bi-send-fill me-2"></i> Send Official Reply</>
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