import React, { useEffect, useState } from "react";
import { Card, Spinner, Alert, Button, Form } from "react-bootstrap";
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

  // Fetch first admin
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await api.get("/api/admin"); // gets all admins
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

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );

  if (error && !admin) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Admin Profile</h2>

      <Card className="shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: "600px" }}>
        {/* Avatar & Name */}
        <div className="d-flex flex-column align-items-center text-center mb-4">
          <div
            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "100px", height: "100px", fontSize: "36px" }}
          >
            {admin.name.charAt(0)}
          </div>
          <h4 className="fw-bold mt-3">{admin.name}</h4>
          <p className="text-muted mb-0">{admin.role || "Administrator"}</p>
        </div>

        <hr />

        {/* Success & Error Messages */}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Read-only view */}
        {!editingProfile && !changingPassword && (
          <div>
            <div className="mb-3">
              <h6 className="text-muted">Name</h6>
              <p>{admin.name}</p>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Email</h6>
              <p>{admin.email}</p>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Joined At</h6>
              <p>{new Date(admin.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <Button variant="primary" className="rounded-pill px-4" onClick={() => setEditingProfile(true)}>
                Edit Profile
              </Button>
              <Button variant="warning" className="rounded-pill px-4" onClick={() => setChangingPassword(true)}>
                Change Password
              </Button>
            </div>
          </div>
        )}

        {/* Edit Profile Form */}
        {editingProfile && (
          <Form onSubmit={handleUpdateProfile}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" className="rounded-pill px-4" onClick={() => setEditingProfile(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={updating}>
                {updating ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        )}

        {/* Change Password Form */}
        {changingPassword && (
          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label>Old Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" className="rounded-pill px-4" onClick={() => setChangingPassword(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="warning" className="rounded-pill px-4" disabled={updating}>
                {updating ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
