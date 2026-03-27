import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const initialForm = { title: "", message: "", audience: "All" };

export default function AnnouncementPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });
  const [mediaFile, setMediaFile] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3000);
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/announcements");
      setRows(res.data?.announcements || []);
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Error fetching announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const isEdit = useMemo(() => Boolean(editingId), [editingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return showToast("error", "Title and message are required");
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
      };
      const data = new FormData();
      Object.entries(payload).forEach(([k, v]) => data.append(k, v));
      if (mediaFile) data.append("media", mediaFile);

      if (isEdit) {
        await api.put(`/api/announcements/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", "Announcement updated");
      } else {
        await api.post("/api/announcements", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", "Announcement created");
      }

      setForm(initialForm);
      setEditingId("");
      setMediaFile(null);
      // Reset file input visually
      const fileInput = document.getElementById("mediaFileInput");
      if (fileInput) fileInput.value = "";
      
      loadAnnouncements();
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      message: item.message || "",
      audience: item.audience || "All",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(initialForm);
    setMediaFile(null);
    const fileInput = document.getElementById("mediaFileInput");
    if (fileInput) fileInput.value = "";
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this announcement?");
    if (!ok) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      showToast("success", "Announcement deleted");
      if (editingId === id) cancelEdit();
      loadAnnouncements();
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Delete failed");
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      await api.patch(`/api/announcements/${item._id}/publish`, {
        isPublished: !item.isPublished,
      });
      showToast("success", `Announcement ${item.isPublished ? "unpublished" : "published"}`);
      loadAnnouncements();
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Publish update failed");
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { background: #ffffff; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }

        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Toast Notification */}
        {toast.text && (
          <div className={`alert ${toast.type === "error" ? "alert-danger border-danger text-danger" : "alert-success border-success text-success"} border border-opacity-25 bg-opacity-10 shadow-sm rounded-4 d-flex align-items-center mb-4 animate-fade-in`}>
            <i className={`bi ${toast.type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"} me-3 fs-5`}></i>
            <div className="fw-medium">{toast.text}</div>
            <button type="button" className="btn-close ms-auto shadow-none" onClick={() => setToast({ type: "", text: "" })}></button>
          </div>
        )}

        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-2">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-megaphone-fill me-1"></i> Broadcast Center
            </span>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Announcements</h2>
                <p className="text-white opacity-75 fw-medium mb-0">Publish school updates, alerts, and multimedia content to your community.</p>
              </div>
              <button className="btn bg-white text-primary rounded-pill px-4 py-2 fw-bold shadow-sm transition-all" onClick={loadAnnouncements} disabled={loading}>
                <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i> 
                {loading ? "Syncing..." : "Refresh Board"}
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 animate-fade-in">
          
          {/* Editor Section (Left Column) */}
          <div className="col-lg-4 col-xl-4">
            <div className="premium-card h-100 p-0 overflow-hidden sticky-top" style={{ top: '20px', zIndex: 1 }}>
              <div className={`p-4 border-bottom ${isEdit ? 'bg-primary bg-opacity-10 border-primary border-opacity-25' : 'bg-white'}`}>
                <h5 className="mb-0 fw-bolder text-dark d-flex align-items-center">
                  <i className={`bi ${isEdit ? 'bi-pencil-square text-primary' : 'bi-plus-circle-fill text-primary'} me-2`}></i>
                  {isEdit ? "Edit Announcement" : "Create Broadcast"}
                </h5>
                {isEdit && <div className="text-muted small fw-medium mt-1">Updating existing record</div>}
              </div>
              
              <div className="p-4 bg-white">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>Headline</label>
                    <input
                      className="form-control input-premium"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Q3 Exam Schedule Released"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>Target Audience</label>
                    <select
                      className="form-select input-premium"
                      value={form.audience}
                      onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                    >
                      <option value="All">Everyone (Public)</option>
                      <option value="Students">Students Only</option>
                      <option value="Teachers">Faculty & Staff Only</option>
                      <option value="Parents">Parents & Guardians</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>Message Content</label>
                    <textarea
                      className="form-control input-premium"
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Provide the full details of this announcement..."
                      style={{ resize: 'none' }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>Media Attachment</label>
                    <input
                      id="mediaFileInput"
                      type="file"
                      className="form-control input-premium py-2"
                      accept="image/*,video/*"
                      onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                    />
                    <div className="form-text text-muted small mt-2">
                      <i className="bi bi-info-circle me-1"></i> Supports images and short videos (Max 50MB).
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column gap-2 mt-4 pt-2 border-top border-light">
                    <button className="btn btn-brand btn-lg py-2 rounded-pill shadow-sm fs-6" disabled={saving}>
                      {saving ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Processing...</>
                      ) : (
                        <><i className="bi bi-send-fill me-2"></i> {isEdit ? "Update Broadcast" : "Publish Broadcast"}</>
                      )}
                    </button>
                    {isEdit && (
                      <button type="button" className="btn btn-light btn-lg py-2 rounded-pill border fw-bold text-muted fs-6 mt-1" onClick={cancelEdit}>
                        Cancel Editing
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Table Section (Right Column) */}
          <div className="col-lg-8 col-xl-8">
            <div className="premium-card overflow-hidden h-100 d-flex flex-column">
              <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bolder text-dark d-flex align-items-center">
                  <i className="bi bi-list-columns-reverse text-primary me-2"></i> Active Ledger
                </h5>
                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-bold border border-primary border-opacity-25">
                  {rows.length} Published
                </span>
              </div>
              
              <div className="flex-grow-1 bg-white">
                {loading && rows.length === 0 ? (
                  <div className="text-center py-5 my-5">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <h5 className="fw-bolder text-dark">Fetching Records...</h5>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="text-center py-5 my-5">
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                      <i className="bi bi-megaphone text-muted opacity-50 display-6"></i>
                    </div>
                    <h4 className="fw-bolder text-dark mb-2">No Announcements Yet</h4>
                    <p className="text-muted fw-medium">Use the panel on the left to create your first broadcast.</p>
                  </div>
                ) : (
                  <div className="table-responsive custom-scroll">
                    <table className="table table-premium align-middle mb-0 w-100">
                      <thead>
                        <tr>
                          <th className="ps-4">Content</th>
                          <th>Audience</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Engagement</th>
                          <th className="pe-4 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((item) => (
                          <tr key={item._id}>
                            <td className="ps-4 py-3" style={{ maxWidth: "300px" }}>
                              <div className="fw-bolder text-dark mb-1 lh-sm">{item.title}</div>
                              <div className="text-muted small text-truncate mb-2">{item.message}</div>
                              {item.mediaUrl && (
                                <div className="mt-2 d-inline-block position-relative">
                                  {item.mediaType === "video" ? (
                                    <video controls className="border rounded-3 shadow-sm object-fit-cover" style={{ height: '70px', width: '120px' }}>
                                      <source src={`http://localhost:3000/${item.mediaUrl}`} />
                                    </video>
                                  ) : (
                                    <img
                                      src={`http://localhost:3000/${item.mediaUrl}`}
                                      alt="announcement media"
                                      className="border rounded-3 shadow-sm object-fit-cover"
                                      style={{ height: '70px', width: '120px' }}
                                    />
                                  )}
                                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-dark p-1 border border-white">
                                    <i className={`bi ${item.mediaType === 'video' ? 'bi-play-circle-fill' : 'bi-image-fill'} text-white`}></i>
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-light text-secondary border px-2 py-1 fw-bold">
                                {item.audience}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className={`badge rounded-pill px-3 py-2 fw-bold shadow-sm border ${
                                item.isPublished 
                                ? "bg-success bg-opacity-10 text-success border-success border-opacity-25" 
                                : "bg-warning bg-opacity-10 text-warning-emphasis border-warning border-opacity-50"
                              }`}>
                                {item.isPublished ? "Live" : "Draft"}
                              </span>
                              <div className="text-muted small mt-1 fw-medium" style={{ fontSize: '0.7rem' }}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="fw-bolder text-dark fs-6 d-flex justify-content-center align-items-center gap-1">
                                <i className="bi bi-eye text-muted small"></i> {item.viewStats?.totalViews || 0}
                              </div>
                              <div className="d-flex justify-content-center gap-2 mt-1" style={{ fontSize: '0.65rem' }}>
                                <span className="text-primary fw-bold" title="Student Views">S:{item.viewStats?.studentViews || 0}</span>
                                <span className="text-info fw-bold" title="Teacher Views">T:{item.viewStats?.teacherViews || 0}</span>
                                <span className="text-secondary fw-bold" title="Parent Views">P:{item.viewStats?.parentViews || 0}</span>
                              </div>
                            </td>
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button 
                                  className="btn btn-sm btn-light border rounded-circle d-flex align-items-center justify-content-center shadow-sm text-secondary" 
                                  onClick={() => startEdit(item)}
                                  style={{ width: '36px', height: '36px' }}
                                  title="Edit Announcement"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button 
                                  className={`btn btn-sm border rounded-circle d-flex align-items-center justify-content-center shadow-sm ${item.isPublished ? "btn-light text-warning border-warning border-opacity-25" : "btn-light text-success border-success border-opacity-25"}`} 
                                  onClick={() => handleTogglePublish(item)}
                                  style={{ width: '36px', height: '36px' }}
                                  title={item.isPublished ? "Unpublish Announcement" : "Publish Announcement"}
                                >
                                  <i className={`bi ${item.isPublished ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-light border border-danger border-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                                  onClick={() => handleDelete(item._id)}
                                  style={{ width: '36px', height: '36px' }}
                                  title="Delete Announcement"
                                >
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}