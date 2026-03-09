import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const validate = (data) => {
    const errors = {};
    if (!data.email.trim()) errors.email = "Email is required";
    if (!data.password) errors.password = "Password is required";
    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: "" });
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);

      if (user.role === "Admin") localStorage.setItem("adminId", user.id);
      if (user.role === "Teacher") localStorage.setItem("teacherId", user.id);
      if (user.role === "Student") {
        localStorage.setItem("studentId", user.id);
        localStorage.setItem("studentClass", user.studentClass);
        localStorage.setItem("studentSection", user.section || "");
        localStorage.setItem("studentStream", user.stream || "");
        localStorage.setItem("lastSeenAssignmentsTime", new Date().toISOString());
      }

      setSuccessMsg("Login successful! Redirecting...");

      setTimeout(() => {
        if (user.role === "Admin") navigate("/Dashboard");
        else if (user.role === "Teacher") navigate("/teacher/dashboard");
        else navigate("/student/dashboard");
      }, 1000);
    } catch (err) {
      setErrors({
        server: err.response?.data?.error || "Server error, please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "form-control form-control-lg border-0 bg-light shadow-sm rounded-4";

  const labelStyle = { fontSize: 13, color: "#6c757d", fontWeight: 600 };

  return (
    <div
      className="min-vh-100 d-flex align-items-stretch"
      style={{
        background: "linear-gradient(135deg, rgba(13,110,253,0.10) 0%, rgba(111,66,193,0.10) 100%)",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div className="container py-4 py-md-5 d-flex align-items-center">
        <div className="row g-4 w-100 align-items-stretch">
          {/* Left Branding Panel */}
          <div className="col-lg-6 d-none d-lg-block">
            <div
              className="h-100 rounded-5 shadow-sm overflow-hidden position-relative"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(13,110,253,0.92) 0%, rgba(111,66,193,0.92) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCin_ezq1I7Ik4zO6OpuOUIAjiMnw9hJ8Q0f4tNULDrq0Nv_-w5HA3NTX4a9LOTR7cgde0M-KNUGJOkK4HCYTbyKAx8lBfUWpI02n40KUgSEyxJ4G1ULVzgagPLu49lYiGBNZY5ICAwQBoDERNjpD8J3iA93nByb9md3CPVzVoWAFEixKcHuPes692WdeL2jdaLhnqMZo2vMaXrgUHxP2j1YBloujPj7YsH7yhBK2J0R82Y6vzOnGj90gEGJBHAxlxmTSIBL5UH5h8')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: 560,
              }}
            >
              <div className="p-5 text-white">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center"
                    style={{
                      width: 46,
                      height: 46,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    <i className="bi bi-mortarboard-fill fs-4" />
                  </div>
                  <div>
                    <div className="fw-bold fs-4" style={{ lineHeight: 1.1 }}>
                      SchoolY
                    </div>
                    <div className="opacity-75" style={{ lineHeight: 1.1 }}>
                      Smart Education System
                    </div>
                  </div>
                </div>

                <h2 className="fw-bold mb-3">Welcome Back</h2>
                <p className="opacity-75 mb-0" style={{ maxWidth: 440 }}>
                  Log in to access your dashboard. Admins manage school operations, teachers manage classes,
                  and students can view learning & fees.
                </p>
              </div>

              <div
                className="position-absolute bottom-0 start-0 end-0 p-4"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)",
                }}
              >
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Secure Login</span>
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Role Based Access</span>
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="col-12 col-lg-6">
            <div className="h-100 d-flex align-items-center">
              <div className="w-100">
                <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 p-md-5 border-bottom bg-white">
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <div>
                        <div className="fw-bold fs-3 mb-1">Login</div>
                        <div className="text-muted">Enter your credentials to continue</div>
                      </div>
                      <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                        Sign In
                      </span>
                    </div>

                    {errors.server && (
                      <div className="alert alert-danger mt-4 mb-0 rounded-4">
                        {errors.server}
                      </div>
                    )}

                    {successMsg && (
                      <div className="alert alert-success mt-3 mb-0 rounded-4">
                        {successMsg}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 p-md-5">
                    <form onSubmit={handleSubmit}>
                      {/* Email */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Email</label>
                          {errors.email && (
                            <small className="text-danger fw-semibold">{errors.email}</small>
                          )}
                        </div>
                        <div className="input-group input-group-lg mt-1">
                          <span className="input-group-text border-0 bg-light rounded-start-4">
                            <i className="bi bi-envelope" />
                          </span>
                          <input
                            type="email"
                            name="email"
                            placeholder="Enter email address"
                            className={`${inputBase} ${errors.email ? "is-invalid" : ""}`}
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Password</label>
                          {errors.password && (
                            <small className="text-danger fw-semibold">{errors.password}</small>
                          )}
                        </div>
                        <div className="input-group input-group-lg mt-1">
                          <span className="input-group-text border-0 bg-light rounded-start-4">
                            <i className="bi bi-lock" />
                          </span>
                          <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            className={`${inputBase} ${errors.password ? "is-invalid" : ""}`}
                            value={formData.password}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Remember + Forgot */}
                      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mt-3">
                      

                        <a href="/forgot-password" className="text-decoration-none fw-semibold">
                          Forgot password?
                        </a>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="btn btn-lg w-100 rounded-pill fw-bold mt-4"
                        disabled={loading}
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
                          border: "none",
                          color: "#fff",
                          boxShadow: "0 12px 26px rgba(13,110,253,0.25)",
                        }}
                      >
                        {loading ? "Logging in..." : "Log In"}
                      </button>

                      {/* Bottom */}
                      <div className="text-center mt-3">
                        <span className="text-muted">Don&apos;t have an account? </span>
                        <Link to="/register" className="fw-semibold text-decoration-none">
                          Sign up
                        </Link>
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="px-4 px-md-5 pb-4">
                    <div className="small text-muted text-center">
                      Protected by secure authentication • SchoolY
                    </div>
                  </div>
                </div>

                {/* Mobile brand card */}
                <div className="d-lg-none mt-3">
                  <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
                    <div
                      className="p-4 text-white"
                      style={{
                        background: "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-mortarboard-fill fs-4" />
                        <div className="fw-bold fs-5">SchoolY</div>
                      </div>
                      <div className="opacity-75 mt-2">Smart Education Management System</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* end right */}
        </div>
      </div>
    </div>
  );
}
