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

  // Fetch first admin (✅ same logic)
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

  // Update profile (✅ same logic)
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

  // Change password (✅ same logic)
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
          <Spinner animation="border" />
          <div className="text-muted mt-2">Loading profile...</div>
        </div>
      </div>
    );

  if (error && !admin)
    return (
      <div className="container py-4" style={{ maxWidth: 720 }}>
        <Alert variant="danger" className="shadow-sm rounded-4">
          {error}
        </Alert>
      </div>
    );

  return (
    <div className="container py-4" style={{ maxWidth: 980 }}>
      {/* Top Header Card */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div
          className="p-4"
          style={{
            background: "linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)",
          }}
        >
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="text-white">
              <h3 className="mb-1 fw-bold">Admin Profile</h3>
              <div className="opacity-75">Manage your profile details and password.</div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                {admin?.role || "Administrator"}
              </Badge>
              <Badge bg="dark" className="px-3 py-2 rounded-pill">
                Secure Zone
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {(error || success) && (
        <div className="mb-3">
          {error && (
            <Alert variant="danger" className="shadow-sm rounded-4 mb-2">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="shadow-sm rounded-4 mb-0">
              {success}
            </Alert>
          )}
        </div>
      )}

      <div className="row g-4">
        {/* Left: Profile Summary */}
        <div className="col-12 col-lg-4">
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex flex-column align-items-center text-center">
                {/* Avatar */}
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                  style={{
                    width: 96,
                    height: 96,
                    fontSize: 28,
                    background: "linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)",
                    boxShadow: "0 10px 22px rgba(13,110,253,0.25)",
                  }}
                >
                  {initials}
                </div>

                <h5 className="fw-bold mt-3 mb-1">{admin?.name}</h5>
                <div className="text-muted">{admin?.email}</div>

                <div className="d-flex gap-2 mt-3 flex-wrap justify-content-center">
                  <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                    Joined:{" "}
                    {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "-"}
                  </Badge>
                </div>

                <hr className="w-100 my-4" />

                {!editingProfile && !changingPassword && (
                  <div className="d-grid gap-2 w-100">
                    <Button
                      variant="primary"
                      className="rounded-pill py-2"
                      onClick={() => setEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline-warning"
                      className="rounded-pill py-2"
                      onClick={() => setChangingPassword(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                )}

                {(editingProfile || changingPassword) && (
                  <div className="d-grid gap-2 w-100">
                    <Button
                      variant="outline-secondary"
                      className="rounded-pill py-2"
                      onClick={() => {
                        setEditingProfile(false);
                        setChangingPassword(false);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Back to Overview
                    </Button>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Right: Forms / Details */}
        <div className="col-12 col-lg-8">
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4 p-md-5">
              {/* Overview */}
              {!editingProfile && !changingPassword && (
                <>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">Account Details</h5>
                      <div className="text-muted">Your current profile information.</div>
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                      Read Only
                    </Badge>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-4 border bg-light">
                        <div className="text-muted small">Full Name</div>
                        <div className="fw-semibold">{admin?.name}</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-4 border bg-light">
                        <div className="text-muted small">Email</div>
                        <div className="fw-semibold">{admin?.email}</div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-3 rounded-4 border bg-light">
                        <div className="text-muted small">Role</div>
                        <div className="fw-semibold">{admin?.role || "Administrator"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4 flex-wrap">
                    <Button variant="primary" className="rounded-pill px-4" onClick={() => setEditingProfile(true)}>
                      Edit Profile
                    </Button>
                    <Button
                      variant="warning"
                      className="rounded-pill px-4"
                      onClick={() => setChangingPassword(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </>
              )}

              {/* Edit Profile */}
              {editingProfile && (
                <>
                  <div className="mb-3">
                    <h5 className="fw-bold mb-1">Edit Profile</h5>
                    <div className="text-muted">Update your name and email.</div>
                  </div>

                  <Form onSubmit={handleUpdateProfile}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="py-2 rounded-3"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-12 col-md-6">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="py-2 rounded-3"
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between gap-2 mt-4">
                      <Button
                        variant="outline-secondary"
                        className="rounded-pill px-4"
                        onClick={() => setEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="rounded-pill px-4"
                        disabled={updating}
                      >
                        {updating ? "Updating..." : "Save Changes"}
                      </Button>
                    </div>
                  </Form>
                </>
              )}

              {/* Change Password */}
              {changingPassword && (
                <>
                  <div className="mb-3">
                    <h5 className="fw-bold mb-1">Change Password</h5>
                    <div className="text-muted">
                      Choose a strong password and don’t share it with anyone.
                    </div>
                  </div>

                  <Form onSubmit={handleChangePassword}>
                    <div className="row g-3">
                      <div className="col-12">
                        <Form.Group>
                          <Form.Label className="fw-semibold">Old Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.oldPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, oldPassword: e.target.value })
                            }
                            required
                            className="py-2 rounded-3"
                          />
                        </Form.Group>
                      </div>

                      <div className="col-12">
                        <Form.Group>
                          <Form.Label className="fw-semibold">New Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                            required
                            className="py-2 rounded-3"
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between gap-2 mt-4">
                      <Button
                        variant="outline-secondary"
                        className="rounded-pill px-4"
                        onClick={() => setChangingPassword(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="warning"
                        className="rounded-pill px-4"
                        disabled={updating}
                      >
                        {updating ? "Changing..." : "Change Password"}
                      </Button>
                    </div>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
