import React, { useState } from "react";
import api from "../../../api/api";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  status: "Active",
};

export default function AddParent() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdParent, setCreatedParent] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const res = await api.post("/api/parent/admin/create", form);
      setCreatedParent(res.data?.parent || null);
      setMessage(res.data?.message || "Parent created successfully");
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create parent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Create Parent Account</h2>
        <div className="text-muted">Add a parent login before linking it to students.</div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Parent Name</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
                {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}

                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-primary px-4" disabled={saving}>
                    {saving ? "Creating..." : "Create Parent"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Latest Created Account</h5>
              {createdParent ? (
                <div className="border rounded-4 p-3 bg-light">
                  <div className="fw-bold fs-5">{createdParent.name}</div>
                  <div className="text-muted small mb-2">{createdParent.email}</div>
                  <div className="small">Parent ID: <strong>{createdParent.parentId}</strong></div>
                  <div className="small">Phone: <strong>{createdParent.phone || "-"}</strong></div>
                  <div className="small">Status: <strong>{createdParent.status}</strong></div>
                </div>
              ) : (
                <div className="text-muted">No parent created in this session yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
