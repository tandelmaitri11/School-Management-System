import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { validateRegister } from "../validation";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
    studentClass: "",
    section: "",
    stream: "",
    subjectChoice: "",
    linkedStudentId: "",
    relation: "Parent",
  });

  const [classes, setClasses] = useState([]);
  const [classOptions, setClassOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [generatedId, setGeneratedId] = useState("");
  const [assignedSection, setAssignedSection] = useState("");
  const [previewSection, setPreviewSection] = useState("");
  const [previewReason, setPreviewReason] = useState("");
  const [previewStatus, setPreviewStatus] = useState("idle");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch class list (for dropdown)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        const raw = res.data || [];
        const uniq = Array.from(new Map(raw.map((c) => [Number(c.className), c])).values()).sort(
          (a, b) => Number(a.className) - Number(b.className)
        );
        setClasses(uniq);
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, []);

  const isStudent = formData.role === "Student";
  const isParent = formData.role === "Parent";
  const selectedClassNum = useMemo(() => {
    const n = Number(formData.studentClass);
    return Number.isInteger(n) ? n : null;
  }, [formData.studentClass]);

  // Fetch class options when class changes (student)
  useEffect(() => {
    const fetchOptions = async () => {
      if (!isStudent || !selectedClassNum) {
        setClassOptions(null);
        return;
      }
      try {
        setOptionsLoading(true);
        const res = await api.get(`/api/classes/registration-options/${selectedClassNum}`);
        setClassOptions(res.data);

        setFormData((p) => ({
          ...p,
          section: "",
          stream: "",
          subjectChoice: "",
        }));
      } catch (err) {
        setClassOptions(null);
        setErrors((p) => ({
          ...p,
          studentClass: err?.response?.data?.message || "Failed to load class options",
        }));
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, selectedClassNum]);

  const streamsToShow = classOptions?.streams || [];
  const selectedStreamObj = useMemo(() => {
    if (!streamsToShow.length) return null;
    return streamsToShow.find((s) => String(s.name) === String(formData.stream));
  }, [streamsToShow, formData.stream]);

  const subjectOptions = selectedStreamObj?.subjectOptions || [];

  const shouldShowStream =
    isStudent && selectedClassNum && classOptions?.isSenior === true && streamsToShow.length > 0;

  const shouldShowSubjectChoice = shouldShowStream && !!formData.stream && subjectOptions.length > 0;

  const previewUnavailable =
    previewStatus === "ready" &&
    !previewSection &&
    (previewReason === "NO_ACTIVE_SECTIONS" || previewReason === "SECTIONS_FULL");

  const showLockedWarning = previewStatus === "ready" && previewReason === "NO_ACTIVE_SECTIONS";
  const showFullWarning = previewStatus === "ready" && previewReason === "SECTIONS_FULL";

  const handleChange = (e) => {
    const { name, value } = e.target;
    const safeValue = name === "mobile" ? String(value || "").replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => {
      if (name === "studentClass") {
        return { ...prev, studentClass: safeValue, section: "", stream: "", subjectChoice: "" };
      }
      if (name === "stream") {
        return { ...prev, stream: safeValue, subjectChoice: "" };
      }
      return { ...prev, [name]: safeValue };
    });

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Preview assigned section (auto-allocate)
  useEffect(() => {
    const fetchPreview = async () => {
      if (!isStudent || !selectedClassNum) {
        setPreviewSection("");
        setPreviewReason("");
        setPreviewStatus("idle");
        return;
      }

      try {
        setPreviewStatus("loading");
        const res = await api.get(`/api/classes/registration-preview/${selectedClassNum}`, {
          params: { stream: formData.stream || "" },
        });

        setPreviewSection(res.data.assignedSection || "");
        setPreviewReason(res.data.reason || "");
        setPreviewStatus("ready");
      } catch (err) {
        setPreviewSection("");
        setPreviewReason("PREVIEW_FAILED");
        setPreviewStatus("error");
      }
    };

    fetchPreview();
  }, [isStudent, selectedClassNum, formData.stream]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegister({
      ...formData,
      hasStreams: streamsToShow.length > 0,
      hasSubjectOptions: subjectOptions.length > 0,
      isSenior: classOptions?.isSenior,
    });

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.mobile || "",
        mobile: formData.mobile || "",
        contactNumber: formData.mobile || "",
        password: formData.password,
        role: formData.role,
      };

      if (isStudent) {
        payload.studentClass = Number(formData.studentClass);
        payload.stream = formData.stream || "";
        payload.subjectChoice = formData.subjectChoice || "";
        payload.previewSection = previewSection || "";
      }
      const res = await api.post("/api/register", payload);

      setGeneratedId(res.data.studentId || res.data.teacherId || res.data.parentId);
      setAssignedSection(res.data.assignedSection || "");
      setShowSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      if (error.response?.status === 409) {
        const conflictMsg =
          error.response?.data?.error ||
          error.response?.data?.warning ||
          error.response?.data?.message ||
          "Conflict occurred.";
        if (/email/i.test(conflictMsg)) {
          setErrors({ email: conflictMsg, server: conflictMsg });
        } else {
          setErrors({ server: conflictMsg });
        }
      } else {
        setErrors({ server: error.response?.data?.error || "Server error, try again later." });
      }
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#f3f4f6", // Matches new login background
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="row g-0 align-items-stretch">
                
                {/* Left Side: Form Panel */}
                <div className="col-lg-6 p-4 p-md-5 bg-white">
                  <div className="text-center mb-5">
                    {/* Mobile Brand Header */}
                    <div className="d-lg-none mb-4 d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" style={{ width: '60px', height: '60px' }}>
                      <i className="bi bi-person-plus-fill fs-2"></i>
                    </div>
                    
                    <h2 className="fw-bold text-dark mb-2">Create Account</h2>
                    <p className="text-muted">Fill in the details to get started.</p>
                  </div>

                  {/* Alerts */}
                  {showSuccess && (
                    <div className="alert alert-success d-flex align-items-center rounded-3 mb-4" role="alert">
                      <i className="bi bi-check-circle-fill me-3 fs-4"></i>
                      <div>
                        Registered ID: <strong>{generatedId}</strong>
                        {assignedSection && (
                          <> | Assigned Section: <strong>{assignedSection}</strong></>
                        )}
                        <br/><small>Redirecting to login...</small>
                      </div>
                    </div>
                  )}

                  {errors.server && (
                    <div className="alert alert-danger d-flex align-items-center rounded-3 mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <div>{errors.server}</div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-secondary small text-uppercase" htmlFor="name">
                        Full Name
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className={`form-control bg-light border-start-0 ps-0 ${errors.name ? "is-invalid" : ""}`}
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          style={{ boxShadow: 'none' }}
                        />
                      </div>
                      {errors.name && <div className="text-danger small mt-1 fw-medium">{errors.name}</div>}
                    </div>

                    {/* Email */}
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

                    {/* Mobile */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-secondary small text-uppercase" htmlFor="mobile">
                        Mobile Number (Optional)
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-telephone"></i>
                        </span>
                        <input
                          type="text"
                          id="mobile"
                          name="mobile"
                          className={`form-control bg-light border-start-0 ps-0 ${errors.mobile ? "is-invalid" : ""}`}
                          placeholder="e.g., 9876543210"
                          value={formData.mobile}
                          inputMode="numeric"
                          maxLength={10}
                          onChange={handleChange}
                          style={{ boxShadow: 'none' }}
                        />
                      </div>
                      {errors.mobile && <div className="text-danger small mt-1 fw-medium">{errors.mobile}</div>}
                    </div>

                    {/* Password */}
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
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleChange}
                          style={{ boxShadow: 'none' }}
                        />
                      </div>
                      {errors.password && <div className="text-danger small mt-1 fw-medium">{errors.password}</div>}
                    </div>

                    {/* Role Selection */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-secondary small text-uppercase" htmlFor="role">
                        Select Role
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-person-badge"></i>
                        </span>
                        <select
                          id="role"
                          name="role"
                          className={`form-select bg-light border-start-0 ps-0 ${errors.role ? "is-invalid" : ""}`}
                          value={formData.role}
                          onChange={(e) => {
                            handleChange(e);
                            setFormData((p) => ({
                              ...p,
                              studentClass: "",
                              section: "",
                              stream: "",
                              subjectChoice: "",
                            }));
                            setClassOptions(null);
                          }}
                          style={{ boxShadow: 'none' }}
                        >
                          <option value="">Choose your role</option>
                          <option value="Student">Student</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Parent">Parent</option>
                        </select>
                      </div>
                      {errors.role && <div className="text-danger small mt-1 fw-medium">{errors.role}</div>}
                    </div>

                    {/* Student Specific Fields */}
                    {isStudent && (
                      <div className="p-3 bg-light rounded-4 mb-4 border">
                        <h6 className="fw-bold text-dark mb-3">Student Details</h6>
                        
                        {/* Class */}
                        <div className="mb-3">
                          <label className="form-label fw-semibold text-secondary small" htmlFor="studentClass">
                            Student Class
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-white text-muted">
                              <i className="bi bi-diagram-3"></i>
                            </span>
                            <select
                              id="studentClass"
                              name="studentClass"
                              className={`form-select bg-white ${errors.studentClass ? "is-invalid" : ""}`}
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
                          </div>
                          {errors.studentClass && <div className="text-danger small mt-1 fw-medium">{errors.studentClass}</div>}
                          {optionsLoading && (
                            <div className="small text-muted mt-2">
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Loading class options...
                            </div>
                          )}
                        </div>

                        {/* Stream */}
                        {shouldShowStream && (
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small" htmlFor="stream">
                              Stream
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-white text-muted">
                                <i className="bi bi-diagram-2"></i>
                              </span>
                              <select
                                id="stream"
                                name="stream"
                                className={`form-select bg-white ${errors.stream ? "is-invalid" : ""}`}
                                value={formData.stream}
                                onChange={handleChange}
                                disabled={optionsLoading}
                              >
                                <option value="">Select Stream</option>
                                {streamsToShow.map((st) => (
                                  <option key={st.name} value={st.name}>
                                    {st.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors.stream && <div className="text-danger small mt-1 fw-medium">{errors.stream}</div>}
                          </div>
                        )}

                        {/* Subject Choice */}
                        {shouldShowSubjectChoice && (
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small" htmlFor="subjectChoice">
                              Subject Choice (Optional)
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-white text-muted">
                                <i className="bi bi-journal-bookmark"></i>
                              </span>
                              <select
                                id="subjectChoice"
                                name="subjectChoice"
                                className={`form-select bg-white ${errors.subjectChoice ? "is-invalid" : ""}`}
                                value={formData.subjectChoice}
                                onChange={handleChange}
                                disabled={optionsLoading}
                              >
                                <option value="">Select</option>
                                {subjectOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors.subjectChoice && <div className="text-danger small mt-1 fw-medium">{errors.subjectChoice}</div>}
                          </div>
                        )}

                        {/* Auto Section Assignment Note */}
                        {selectedClassNum && (
                          <div className="mt-3">
                            <div className="alert alert-secondary border-0 small mb-0 d-flex align-items-center rounded-3">
                              <i className="bi bi-info-circle-fill text-primary me-2 fs-5"></i>
                              <div>
                                {previewStatus === "loading" && "Checking available sections..."}
                                {previewStatus !== "loading" && previewSection && (
                                  <>Assigned Section Preview: <strong className="text-dark">{previewSection}</strong></>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "STREAM_REQUIRED" && (
                                  "Select a stream to preview assigned section."
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "INVALID_STREAM" && (
                                  <span className="text-danger">Selected stream is invalid for this class.</span>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "NO_ACTIVE_SECTIONS" && (
                                  <span className="text-danger">No active sections available for this class/stream.</span>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "SECTIONS_FULL" && (
                                  <span className="text-danger">All sections are full for this class/stream.</span>
                                )}
                                {previewStatus === "error" && "Unable to preview section right now."}
                              </div>
                            </div>
                            
                            {showLockedWarning && (
                              <div className="alert alert-warning small mt-2 mb-0 rounded-3">
                                All sections are locked or inactive for the selected class/stream.
                              </div>
                            )}
                            {showFullWarning && (
                              <div className="alert alert-warning small mt-2 mb-0 rounded-3">
                                All sections are full for the selected class/stream.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Parent Specific Alert */}
                    {isParent && (
                      <div className="alert alert-info rounded-3 small d-flex mb-4">
                        <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                        <div>
                          Parent registration creates the login account first. After that, the admin will link the parent to the correct student.
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm mt-2"
                      disabled={isStudent && previewUnavailable}
                    >
                      Create Account
                    </button>
                  </form>

                  <div className="text-center mt-4">
                    <p className="text-muted small mb-0">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary fw-bold text-decoration-none ms-1">
                        Sign in here
                      </Link>
                    </p>
                    <div className="mt-3 small text-muted opacity-75">
                      By registering, you agree to the school’s usage policy.
                    </div>
                  </div>
                </div>

                {/* Right Side: Branding Panel */}
                <div
                  className="col-lg-6 d-none d-lg-flex flex-column position-relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                  }}
                >
                  {/* Decorative Elements */}
                  <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '300px', height: '300px', top: '-100px', right: '-100px', zIndex: 1 }}></div>
                  <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '300px', height: '300px', bottom: '-100px', left: '-100px', zIndex: 1 }}></div>

                  <div className="d-flex flex-column justify-content-center p-5 text-white flex-grow-1 position-relative" style={{ zIndex: 2 }}>
                    <div className="mb-auto">
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: "50px", height: "50px" }}>
                          <i className="bi bi-mortarboard-fill fs-3"></i>
                        </div>
                        <h3 className="fw-bolder mb-0 tracking-tight">SchoolY</h3>
                      </div>
                    </div>

                    <div className="my-5">
                      <h1 className="fw-bold display-5 mb-4 leading-tight">
                        Start your <br/>
                        Educational <br/>
                        Journey.
                      </h1>
                      <p className="lead opacity-75 fs-6 w-75">
                        Register as a Student, Teacher, or Parent. You’ll receive your unique ID securely right after successful registration.
                      </p>
                    </div>

                    <div className="mt-auto d-flex gap-4">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-shield-check text-info fs-5"></i>
                        <span className="small opacity-75">Secure Platform</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                         <i className="bi bi-lightning-charge text-info fs-5"></i>
                        <span className="small opacity-75">Fast Setup</span>
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