import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

const initialForm = { title: "", message: "", audience: "Both" };

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
      audience: item.audience || "Both",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(initialForm);
    setMediaFile(null);
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
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header Section */}
          <div className="mb-4">
            <h2 className="fw-bold text-dark">Announcements</h2>
            <p className="text-muted">Manage your school updates, alerts, and multimedia content.</p>
          </div>

          {/* Toast Notification */}
          {toast.text && (
            <div className={`alert ${toast.type === "error" ? "alert-danger" : "alert-success"} mb-4 shadow-sm border-0`}>
              {toast.text}
            </div>
          )}

          {/* Editor Section */}
          <div className="card shadow-sm border-0 mb-5">
            <div className="card-header bg-white py-3 border-bottom-0">
              <h5 className="mb-0 text-primary fw-bold">
                {isEdit ? "Edit Existing Announcement" : "Create New Announcement"}
              </h5>
            </div>
            <div className="card-body bg-white">
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-8">
                    <label className="form-label fw-medium">Title</label>
                    <input
                      className="form-control form-control-lg"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Exam Schedule Update"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium">Target Audience</label>
                    <select
                      className="form-select form-select-lg"
                      value={form.audience}
                      onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                    >
                      <option value="Students">Students</option>
                      <option value="Teachers">Teachers</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Message Details</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Provide details about the announcement..."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Attachment (Optional)</label>
                    <div className="input-group">
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*,video/*"
                        onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="form-text text-muted">Supports images and short videos (Max 50MB).</div>
                  </div>
                </div>
                
                <div className="mt-4 d-flex gap-2">
                  <button className="btn btn-primary btn-lg px-4" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span> Saving...
                      </>
                    ) : (
                      isEdit ? "Update Announcement" : "Publish Announcement"
                    )}
                  </button>
                  {isEdit && (
                    <button type="button" className="btn btn-light btn-lg px-4" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">Active Announcements</h5>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading data...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-5 text-muted">No announcements created yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Announcement</th>
                      <th>Audience</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th>Created</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item._id}>
                        <td className="ps-4">
                          <div className="fw-bold text-dark">{item.title}</div>
                          <div className="text-muted small text-truncate" style={{ maxWidth: "300px" }}>{item.message}</div>
                          {item.mediaUrl && (
                            <div className="mt-2">
                              {item.mediaType === "video" ? (
                                <video controls width="120" className="border rounded shadow-sm">
                                  <source src={`http://localhost:3000/${item.mediaUrl}`} />
                                </video>
                              ) : (
                                <img
                                  src={`http://localhost:3000/${item.mediaUrl}`}
                                  alt="announcement"
                                  width="100"
                                  className="rounded shadow-sm"
                                />
                              )}
                            </div>
                          )}
                        </td>
                        <td><span className="badge bg-light text-dark border">{item.audience}</span></td>
                        <td>
                          <span className={`badge ${item.isPublished ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                            {item.isPublished ? "Live" : "Draft"}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold">{item.viewStats?.totalViews || 0}</div>
                          <div className="small text-muted">
                            S: {item.viewStats?.studentViews || 0} | T: {item.viewStats?.teacherViews || 0}
                          </div>
                        </td>
                        <td className="text-muted small">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(item)}>Edit</button>
                            <button 
                              className={`btn btn-sm ${item.isPublished ? "btn-outline-warning" : "btn-outline-success"}`} 
                              onClick={() => handleTogglePublish(item)}
                            >
                              {item.isPublished ? "Unpublish" : "Publish"}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item._id)}>Delete</button>
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
  );
}
