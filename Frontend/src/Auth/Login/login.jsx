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
      localStorage.setItem("user", JSON.stringify({
        id: user.id,
        role: (user.role || "").toLowerCase(), // VERY IMPORTANT
        name: user.name
      }));


      if (user.role === "Admin") localStorage.setItem("adminId", user.id);
      else if (user.role === "Teacher") localStorage.setItem("teacherId", user.id);
      else if (user.role === "Parent") {
        localStorage.setItem("parentId", user.parentId || user.id);
        localStorage.setItem("parentObjectId", user.id);
      }
      else if (user.role === "Student") {
        localStorage.setItem("studentId", user.id);
        localStorage.setItem("studentClass", user.studentClass);
        localStorage.setItem("studentSection", user.section || "");
        localStorage.setItem("studentStream", user.stream || "");
        localStorage.setItem("lastSeenAssignmentsTime", new Date().toISOString());
      }

      setSuccessMsg("Login successful! Redirecting...");
      const role = (user.role || "").toLowerCase();

      const routeMap = {
        admin: "/adminDashboard",
        teacher: "/teacher/dashboard",
        parent: "/parent/dashboard",
        student: "/student/dashboard"
      };

      setTimeout(() => {
       navigate(routeMap[role] || "/");
      }, 1000);
    } catch (err) {
      setErrors({
        server: err.response?.data?.error || "Server error, please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="row g-0 align-items-center">

                {/* Left Side: Form Panel */}
                <div className="col-lg-6 p-4 p-md-5 bg-white">
                  <div className="text-center mb-5">
                    {/* Mobile Brand Header */}
                    <div className="d-lg-none mb-4 d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" style={{ width: '60px', height: '60px' }}>
                      <i className="bi bi-mortarboard-fill fs-2"></i>
                    </div>

                    <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
                    <p className="text-muted">Enter your details to access your account.</p>
                  </div>

                  {/* Alerts */}
                  {errors.server && (
                    <div className="alert alert-danger d-flex align-items-center rounded-3 mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <div>{errors.server}</div>
                    </div>
                  )}

                  {successMsg && (
                    <div className="alert alert-success d-flex align-items-center rounded-3 mb-4" role="alert">
                      <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                      <div>{successMsg}</div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-secondary small text-uppercase" htmlFor="email">
                        Email Address
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-envelope"></i>
                        </span>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control bg-light border-start-0 ps-0 ${errors.email ? "is-invalid" : ""}`}
                          placeholder="name@schooly.edu"
                          value={formData.email}
                          onChange={handleChange}
                          style={{ boxShadow: 'none' }}
                        />
                      </div>
                      {errors.email && <div className="text-danger small mt-1 fw-medium">{errors.email}</div>}
                    </div>

                    {/* Password Input */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-secondary small text-uppercase" htmlFor="password">
                        Password
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          className={`form-control bg-light border-start-0 ps-0 ${errors.password ? "is-invalid" : ""}`}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          style={{ boxShadow: 'none' }}
                        />
                      </div>
                      {errors.password && <div className="text-danger small mt-1 fw-medium">{errors.password}</div>}
                    </div>

                    {/* Options Row */}
                    <div className="d-flex justify-content-between align-items-center mb-5">

                      <Link to="/forgot-password" className="text-primary text-decoration-none small fw-semibold">
                        Forgot password?
                      </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </form>

                  <div className="text-center mt-4">
                    <p className="text-muted small mb-0">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-primary fw-bold text-decoration-none ms-1">
                        Create account
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Right Side: Branding Panel */}
                <div
                  className="col-lg-6 d-none d-lg-block p-0 position-relative h-100"
                  style={{ minHeight: "600px" }}
                >
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                      opacity: 0.9
                    }}
                  ></div>

                  {/* Decorative Elements */}
                  <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 1 }}>
                    <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '300px', height: '300px', top: '-100px', right: '-100px' }}></div>
                    <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '200px', height: '200px', bottom: '-50px', left: '-50px' }}></div>
                  </div>

                  <div className="position-relative h-100 d-flex flex-column justify-content-center p-5 text-white" style={{ zIndex: 2 }}>
                    <div className="mb-auto">
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: "50px", height: "50px" }}>
                          <i className="bi bi-mortarboard-fill fs-3"></i>
                        </div>
                        <h3 className="fw-bolder mb-0 tracking-tight">SchoolY</h3>
                      </div>
                    </div>

                    <div className="mb-5">
                      <h1 className="fw-bold display-5 mb-4 leading-tight">
                        Empowering <br />
                        Education <br />
                        Management.
                      </h1>
                      <p className="lead opacity-75 fs-6 w-75">
                        The all-in-one platform connecting administrators, teachers, parents, and students seamlessly.
                      </p>
                    </div>

                    <div className="mt-auto d-flex gap-4">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-check2-circle text-info fs-5"></i>
                        <span className="small opacity-75">Secure Platform</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-check2-circle text-info fs-5"></i>
                        <span className="small opacity-75">Role-Based Access</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}