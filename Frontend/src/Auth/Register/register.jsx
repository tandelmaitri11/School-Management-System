import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { validateRegister } from "../validation";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    studentClass: "",
  });

  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  const [generatedId, setGeneratedId] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setClasses(res.data);
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegister(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      // Send studentClass as number
      if (formData.role === "Student") {
        if (!formData.studentClass) {
          setErrors({ studentClass: "Student class is required!" });
          return;
        }
        payload.studentClass = Number(formData.studentClass);
      }

      const res = await api.post("/api/register", payload);

      setGeneratedId(res.data.studentId || res.data.teacherId);
      setShowSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);

    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ email: error.response.data.error });
      } else {
        setErrors({ server: error.response?.data?.error || "Server error, try again later." });
      }
    }
  };

  const inputClass =
    "form-control bg-[#f0f2f4] border-0 rounded-lg h-14 p-4 text-[#111418] placeholder-[#617589]";

  return (
    <div className="d-flex min-vh-100 bg-white" style={{ fontFamily: "Inter, Noto Sans, sans-serif" }}>
      <div className="container py-5 d-flex flex-column align-items-center justify-content-center flex-grow-1">
        <div className="row w-100 justify-content-center">
          {/* Left Image */}
          <div className="col-md-4 d-none d-md-flex align-items-center justify-content-center">
            <div
              className="rounded-4 w-100 h-100"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDGu6mJWwhFrxlDRaqQc6xwCOO8L_0uXhxIOjyE0sMcI7eja927MYYFrFRm0g-bZV4xI6PUeUWgM0HxEg5159b_s2N31pR2R4aYt3foDeqT6ZqP3W9NhGuktcR6e46bRv-7qnyPzjAFLPnhvTfgugRPb0ZvyvQiVWaPKO5_LquN6nShrteoecMhdSb0DEy2ULwS3NpTnF8FwwFy6TfVmzh6rT3oIZq9wT7uqVpgU9FweOdIo89NK4odoMpTpbQzsrAnT7kx3TlO-98')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "380px",
              }}
            ></div>
          </div>

          {/* Right Form */}
          <div className="col-md-6 col-lg-5 d-flex flex-column align-items-center">
            <h2 className="fw-bold text-center mb-4 mt-3">Create your account</h2>

            <form onSubmit={handleSubmit} className="w-100" style={{ maxWidth: "480px" }}>
              {/* Name */}
              <div className="mb-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  className={`${inputClass} ${errors.name ? "is-invalid" : ""}`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="mb-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={`${inputClass} ${errors.email ? "is-invalid" : ""}`}
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
                  className={`${inputClass} ${errors.password ? "is-invalid" : ""}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              {/* Role */}
              <div className="mb-3">
                <select
                  name="role"
                  className={`${inputClass} ${errors.role ? "is-invalid" : ""}`}
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Select role</option>
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                </select>
                {errors.role && <div className="invalid-feedback">{errors.role}</div>}
              </div>

              {/* Student Class */}
              {formData.role === "Student" && (
                <div className="mb-3">
                  <select
                    name="studentClass"
                    className={`${inputClass} ${errors.studentClass ? "is-invalid" : ""}`}
                    value={formData.studentClass}
                    onChange={handleChange}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={Number(cls.className)}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                  {errors.studentClass && <div className="invalid-feedback">{errors.studentClass}</div>}
                </div>
              )}

              {/* Server Error */}
              {errors.server && <div className="alert alert-danger">{errors.server}</div>}

              <div className="d-flex justify-content-center">
                <button type="submit" className="btn btn-primary px-5 py-2 fw-bold rounded-3">
                  Register
                </button>
              </div>

              <p className="text-center text-muted mt-3 mb-0">
                Already have an account?{" "}
                <Link to="/login" className="text-decoration-underline">
                  Sign in
                </Link>
              </p>
            </form>

            {/* Success Alert */}
            {showSuccess && (
              <div className="alert alert-success mt-3 text-center">
                Registered ID: <strong>{generatedId}</strong>. Redirecting to login...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
