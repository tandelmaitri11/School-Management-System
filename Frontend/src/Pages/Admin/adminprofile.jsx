import React, { useEffect, useState } from "react";
import { Card, Spinner, Alert, Button, Form, Badge } from "react-bootstrap";
import api from "../../api/api";

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await api.get("/api/admin");
        if (res.data.length > 0) {
          const firstAdmin = res.data[0];
          setAdmin(firstAdmin);
          setFormData({ name: firstAdmin.name, email: firstAdmin.email, password: "" });
        } else {
          setError("No admin found!");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch admin profile");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      await api.put(
        `/api/admin/${admin._id}`,
        formData.password ? formData : { name: formData.name, email: formData.email }
      );
      setSuccess("Profile updated successfully!");
      setEditingProfile(false);

      const res = await api.get("/api/admin");
      const firstAdmin = res.data[0];
      setAdmin(firstAdmin);
      setFormData({ name: firstAdmin.name, email: firstAdmin.email, password: "" });
    } catch (err) {
      console.error(err);
      setError("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/api/admin/change-password/${admin._id}`, passwordData);
      setSuccess("Password changed successfully!");
      setPasswordData({ oldPassword: "", newPassword: "" });
      setChangingPassword(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to change password");
    } finally {
      setUpdating(false);
    }
  };

  const initials = (admin?.name || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <Spinner animation="border" style={{ color: "var(--brand-primary, #4f46e5)" }} />
          <div className="mt-3 fw-medium" style={{ color: "var(--text-muted, #64748b)" }}>Loading profile...</div>
        </div>
      </div>
    );

  if (error && !admin)
    return (
      <div className="container py-4" style={{ maxWidth: 720 }}>
        <Alert variant="danger" className="shadow-sm rounded-4 border-0">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </Alert>
      </div>
    );

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1000, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Component Specific Custom CSS to ensure it looks premium in light/dark modes */}
      <style>{`
        .profile-card { background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 16px; }
        .detail-box { background: var(--bg-body, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 16px; transition: all 0.2s; }
        .detail-box:hover { border-color: rgba(79, 70, 229, 0.3); background: var(--bg-surface, #ffffff); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .input-premium { background: var(--bg-body, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); color: var(--text-main, #0f172a); border-radius: 10px; padding: 12px 16px; transition: all 0.2s; }
        .input-premium:focus { border-color: var(--brand-primary, #4f46e5); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: var(--bg-surface, #ffffff); outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; }
      `}</style>

      {/* Top Header Card */}
      <div 
        className="rounded-4 overflow-hidden mb-4 shadow-sm border-0"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", position: 'relative' }}
      >
        {/* Decorative background circles */}
        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

        <div className="p-4 p-md-5 position-relative z-1">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="text-white">
              <h3 className="mb-1 fw-bolder" style={{ letterSpacing: '-0.5px' }}>Admin Profile</h3>
              <div className="opacity-75 fw-medium">Manage your personal information and security.</div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-shield-check me-1"></i> {admin?.role || "Administrator"}
              </span>
              <span className="badge bg-dark px-3 py-2 rounded-pill fw-semibold shadow-sm">
                Secure Zone
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className="mb-4 fade-in-up">
          {error && (
            <Alert variant="danger" className="shadow-sm rounded-4 border-0 d-flex align-items-center">
              <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i> {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="shadow-sm rounded-4 border-0 d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i> {success}
            </Alert>
          )}
        </div>
      )}

      <div className="row g-4">
        {/* Left: Profile Summary */}
        <div className="col-12 col-lg-4">
          <div className="profile-card shadow-sm h-100 p-4 p-xl-5 d-flex flex-column align-items-center text-center">
            
            {/* Avatar */}
            <div
              className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold mb-4"
              style={{
                width: 110,
                height: 110,
                fontSize: 36,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                boxShadow: "0 12px 24px rgba(79, 70, 229, 0.25)",
                border: "4px solid var(--bg-surface, #fff)"
              }}
            >
              {initials}
            </div>

            <h4 className="fw-bolder mb-1" style={{ color: "var(--text-main, #0f172a)", letterSpacing: "-0.5px" }}>{admin?.name}</h4>
            <div className="mb-3 fw-medium" style={{ color: "var(--text-muted, #64748b)" }}>{admin?.email}</div>

            <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill fw-medium text-muted mb-4">
              Joined {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
            </Badge>

            <hr className="w-100 mb-4 mt-0" style={{ borderColor: 'var(--border-color, #e2e8f0)', opacity: 1 }} />

            {!editingProfile && !changingPassword && (
              <div className="d-grid gap-3 w-100 mt-auto">
                <Button variant="light" className="rounded-pill py-2 fw-semibold border" onClick={() => setEditingProfile(true)} style={{ color: "var(--text-main, #0f172a)" }}>
                  <i className="bi bi-pencil-square me-2"></i> Edit Profile
                </Button>
                <Button variant="light" className="rounded-pill py-2 fw-semibold border" onClick={() => setChangingPassword(true)} style={{ color: "var(--text-main, #0f172a)" }}>
                  <i className="bi bi-lock-fill me-2"></i> Change Password
                </Button>
              </div>
            )}

            {(editingProfile || changingPassword) && (
              <div className="d-grid w-100 mt-auto">
                <Button
                  variant="light"
                  className="rounded-pill py-2 fw-semibold border text-muted"
                  onClick={() => {
                    setEditingProfile(false);
                    setChangingPassword(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  <i className="bi bi-arrow-left me-2"></i> Back to Overview
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Forms / Details */}
        <div className="col-12 col-lg-8">
          <div className="profile-card shadow-sm h-100">
            <div className="p-4 p-xl-5">
              
              {/* Overview Mode */}
              {!editingProfile && !changingPassword && (
                <div className="fade-in">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h4 className="fw-bolder mb-1" style={{ color: "var(--text-main, #0f172a)" }}>Account Details</h4>
                      <div style={{ color: "var(--text-muted, #64748b)" }}>Your current profile information.</div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="detail-box">
                        <div className="small fw-bold mb-1" style={{ color: "var(--text-muted, #64748b)", textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</div>
                        <div className="fw-semibold fs-5" style={{ color: "var(--text-main, #0f172a)" }}>{admin?.name}</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="detail-box">
                        <div className="small fw-bold mb-1" style={{ color: "var(--text-muted, #64748b)", textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                        <div className="fw-semibold fs-5 text-truncate" style={{ color: "var(--text-main, #0f172a)" }} title={admin?.email}>{admin?.email}</div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="detail-box">
                        <div className="small fw-bold mb-1" style={{ color: "var(--text-muted, #64748b)", textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Role</div>
                        <div className="fw-semibold fs-5 d-flex align-items-center" style={{ color: "var(--text-main, #0f172a)" }}>
                          <i className="bi bi-person-badge text-primary me-2"></i>
                          {admin?.role || "Administrator"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Profile Mode */}
              {editingProfile && (
                <div className="fade-in">
                  <div className="mb-4">
                    <h4 className="fw-bolder mb-1" style={{ color: "var(--text-main, #0f172a)" }}>Edit Profile</h4>
                    <div style={{ color: "var(--text-muted, #64748b)" }}>Update your personal details below.</div>
                  </div>

                  <Form onSubmit={handleUpdateProfile}>
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <Form.Group>
                          <Form.Label className="fw-semibold" style={{ color: "var(--text-main, #0f172a)" }}>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="input-premium"
                            placeholder="e.g. John Doe"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-12 col-md-6">
                        <Form.Group>
                          <Form.Label className="fw-semibold" style={{ color: "var(--text-main, #0f172a)" }}>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="input-premium"
                            placeholder="admin@schooly.com"
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 mt-5 pt-3 border-top" style={{ borderColor: 'var(--border-color, #e2e8f0)' }}>
                      <Button type="submit" className="btn-brand rounded-pill px-4 py-2 fw-semibold" disabled={updating}>
                        {updating ? (
                           <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Saving...</>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button variant="light" className="rounded-pill px-4 py-2 fw-semibold border text-muted" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {/* Change Password Mode */}
              {changingPassword && (
                <div className="fade-in">
                  <div className="mb-4">
                    <h4 className="fw-bolder mb-1" style={{ color: "var(--text-main, #0f172a)" }}>Change Password</h4>
                    <div style={{ color: "var(--text-muted, #64748b)" }}>
                      Ensure your account stays secure by using a strong password.
                    </div>
                  </div>

                  <Form onSubmit={handleChangePassword}>
                    <div className="row g-4">
                      <div className="col-12">
                        <Form.Group>
                          <Form.Label className="fw-semibold" style={{ color: "var(--text-main, #0f172a)" }}>Current Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.oldPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            required
                            className="input-premium"
                            placeholder="Enter your current password"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-12">
                        <Form.Group>
                          <Form.Label className="fw-semibold" style={{ color: "var(--text-main, #0f172a)" }}>New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            className="input-premium"
                            placeholder="Enter your new password"
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 mt-5 pt-3 border-top" style={{ borderColor: 'var(--border-color, #e2e8f0)' }}>
                      <Button type="submit" className="btn-brand rounded-pill px-4 py-2 fw-semibold" disabled={updating}>
                         {updating ? (
                           <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Updating...</>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                      <Button variant="light" className="rounded-pill px-4 py-2 fw-semibold border text-muted" onClick={() => setChangingPassword(false)}>
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}