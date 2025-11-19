import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api"; // Axios instance
import "bootstrap/dist/css/bootstrap.min.css";

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
      // Send login request
      const res = await api.post("/api/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = res.data;

      // Save token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);
      

      // Save role-specific ID
      switch (user.role) {
        case "Admin":
          localStorage.setItem("adminId", user.id);
          break;
        case "Teacher":
          localStorage.setItem("teacherId", user.id);
          break;
        case "Student":
          localStorage.setItem("studentId", user.id);
          localStorage.setItem("studentClass", user.studentClass);
          localStorage.setItem("lastSeenAssignmentsTime", new Date().toISOString());
          
          
          
          break;
        default:
          break;
      }

      setSuccessMsg("Login successful! Redirecting...");

      // Redirect based on role
      setTimeout(() => {
        switch (user.role) {
          case "Admin":
            navigate("/Dashboard");
            break;
          case "Teacher":
            navigate("/teacher/dashboard");
            break;
          case "Student":
            navigate("/student/dashboard");
            break;
          default:
            navigate("/");
        }
      }, 1000);

    } catch (err) {
      console.error("Login Error:", err.response || err.message);
      if ([400, 401, 404].includes(err.response?.status)) {
        setErrors({ server: err.response.data.error });
      } else {
        setErrors({ server: "Server error, please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      <div className="container py-5 d-flex flex-column align-items-center justify-content-center flex-grow-1">
        <div className="row w-100 justify-content-center">

          {/* Left Image */}
          <div className="col-md-4 d-none d-md-flex align-items-center justify-content-center">
            <div
              className="rounded-4 w-100 h-100"
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCin_ezq1I7Ik4zO6OpuOUIAjiMnw9hJ8Q0f4tNULDrq0Nv_-w5HA3NTX4a9LOTR7cgde0M-KNUGJOkK4HCYTbyKAx8lBfUWpI02n40KUgSEyxJ4G1ULVzgagPLu49lYiGBNZY5ICAwQBoDERNjpD8J3iA93nByb9md3CPVzVoWAFEixKcHuPes692WdeL2jdaLhnqMZo2vMaXrgUHxP2j1YBloujPj7YsH7yhBK2J0R82Y6vzOnGj90gEGJBHAxlxmTSIBL5UH5h8')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "380px",
              }}
            ></div>
          </div>

          {/* Right Form */}
          <div className="col-md-6 col-lg-5 d-flex flex-column align-items-center">
            <h2 className="fw-bold text-center mb-4 mt-3">Welcome Back</h2>

            <form onSubmit={handleSubmit} className="w-100" style={{ maxWidth: "480px" }}>
              {/* Email */}
              <div className="mb-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={`form-control bg-light border-0 p-3 rounded-3 ${errors.email ? "is-invalid" : ""}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Password */}
              <div className="mb-3">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className={`form-control bg-light border-0 p-3 rounded-3 ${errors.password ? "is-invalid" : ""}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-check mb-3 d-flex justify-content-between align-items-center px-2">
                <label className="form-check-label">
                  
                </label>
                <a href="/forgot-password" className="text-decoration-underline">
                  Forgot password?
                </a>
              </div>

              {/* Server Error */}
              {errors.server && <div className="alert alert-danger">{errors.server}</div>}

              {/* Success Message */}
              {successMsg && <div className="alert alert-success">{successMsg}</div>}

              {/* Submit */}
              <div className="d-flex justify-content-center mb-3">
                <button type="submit" className="btn btn-primary px-5 py-2 fw-bold rounded-3" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </div>

              <p className="text-center text-muted mt-3 mb-0">
                Don't have an account? <a href="/register" className="text-decoration-underline">Sign up</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
