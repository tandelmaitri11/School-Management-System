import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { validateRegister } from "../validation";
import "bootstrap-icons/font/bootstrap-icons.css";

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

      setGeneratedId(res.data.studentId || res.data.teacherId);
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

  const inputBase = "form-control form-control-lg border-0 shadow-sm rounded-4 bg-light";
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
                  "linear-gradient(135deg, rgba(13,110,253,0.92) 0%, rgba(111,66,193,0.92) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDGu6mJWwhFrxlDRaqQc6xwCOO8L_0uXhxIOjyE0sMcI7eja927MYYFrFRm0g-bZV4xI6PUeUWgM0HxEg5159b_s2N31pR2R4aYt3foDeqT6ZqP3W9NhGuktcR6e46bRv-7qnyPzjAFLPnhvTfgugRPb0ZvyvQiVWaPKO5_LquN6nShrteoecMhdSb0DEy2ULwS3NpTnF8FwwFy6TfVmzh6rT3oIZq9wT7uqVpgU9FweOdIo89NK4odoMpTpbQzsrAnT7kx3TlO-98')",
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

                <h2 className="fw-bold mb-3">Create your account</h2>
                <p className="opacity-75 mb-0" style={{ maxWidth: 420 }}>
                  Register as a <b>Student</b> or <b>Teacher</b>. You’ll receive your unique ID after successful
                  registration.
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
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Secure</span>
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Fast Signup</span>
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Role Based Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="col-12 col-lg-6">
            <div className="h-100 d-flex align-items-center">
              <div className="w-100">
                <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
                  <div className="p-4 p-md-5 border-bottom" style={{ background: "#ffffff" }}>
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <div>
                        <div className="fw-bold fs-3 mb-1">Register</div>
                        <div className="text-muted">Fill details to create your account</div>
                      </div>
                      <span className="badge rounded-pill bg-light text-dark border px-3 py-2">New Account</span>
                    </div>

                    {showSuccess && (
                      <div className="alert alert-success mt-4 mb-0 rounded-4">
                        Registered ID: <strong>{generatedId}</strong>
                        {assignedSection && (
                          <>
                            {" "}
                            | Assigned Section: <strong>{assignedSection}</strong>
                          </>
                        )}
                        . Redirecting to login...
                      </div>
                    )}
                    {errors.server && <div className="alert alert-danger mt-3 mb-0 rounded-4">{errors.server}</div>}
                  </div>

                  <div className="p-4 p-md-5">
                    <form onSubmit={handleSubmit}>
                      {/* Name */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Full Name</label>
                          {errors.name && <small className="text-danger fw-semibold">{errors.name}</small>}
                        </div>
                        <div className="input-group input-group-lg mt-1">
                          <span className="input-group-text border-0 bg-light rounded-start-4">
                            <i className="bi bi-person" />
                          </span>
                          <input
                            type="text"
                            name="name"
                            placeholder="Enter full name"
                            className={`${inputBase} ${errors.name ? "is-invalid" : ""}`}
                            value={formData.name}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Email</label>
                          {errors.email && <small className="text-danger fw-semibold">{errors.email}</small>}
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
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Mobile Number (Optional)</label>
                          {errors.mobile && <small className="text-danger fw-semibold">{errors.mobile}</small>}
                        </div>
                        <div className="input-group input-group-lg mt-1">
                          <span className="input-group-text border-0 bg-light rounded-start-4">
                            <i className="bi bi-telephone" />
                          </span>
                          <input
                            type="text"
                            name="mobile"
                            placeholder="e.g., 9876543210"
                            className={`${inputBase} ${errors.mobile ? "is-invalid" : ""}`}
                            value={formData.mobile}
                            inputMode="numeric"
                            maxLength={10}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Password</label>
                          {errors.password && <small className="text-danger fw-semibold">{errors.password}</small>}
                        </div>
                        <div className="input-group input-group-lg mt-1">
                          <span className="input-group-text border-0 bg-light rounded-start-4">
                            <i className="bi bi-lock" />
                          </span>
                          <input
                            type="password"
                            name="password"
                            placeholder="Create a strong password"
                            className={`${inputBase} ${errors.password ? "is-invalid" : ""}`}
                            value={formData.password}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <label style={labelStyle}>Role</label>
                          {errors.role && <small className="text-danger fw-semibold">{errors.role}</small>}
                        </div>
                        <div className="input-group input-group-lg mt-1">
                          <span className="input-group-text border-0 bg-light rounded-start-4">
                            <i className="bi bi-person-badge" />
                          </span>
                          <select
                            name="role"
                            className={`${inputBase} ${errors.role ? "is-invalid" : ""}`}
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
                          >
                            <option value="">Select role</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                          </select>
                        </div>
                      </div>

                      {/* Student Fields */}
                      {isStudent && (
                        <>
                          {/* Class */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between">
                              <label style={labelStyle}>Student Class</label>
                              {errors.studentClass && (
                                <small className="text-danger fw-semibold">{errors.studentClass}</small>
                              )}
                            </div>
                            <div className="input-group input-group-lg mt-1">
                              <span className="input-group-text border-0 bg-light rounded-start-4">
                                <i className="bi bi-diagram-3" />
                              </span>
                              <select
                                name="studentClass"
                                className={`${inputBase} ${errors.studentClass ? "is-invalid" : ""}`}
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
                            {optionsLoading && (
                              <div className="small text-muted mt-2">
                                <i className="bi bi-arrow-repeat me-1"></i>Loading class options...
                              </div>
                            )}
                          </div>

                          {/* Stream */}
                          {shouldShowStream && (
                            <div className="mb-3">
                              <div className="d-flex justify-content-between">
                                <label style={labelStyle}>Stream</label>
                                {errors.stream && <small className="text-danger fw-semibold">{errors.stream}</small>}
                              </div>
                              <div className="input-group input-group-lg mt-1">
                                <span className="input-group-text border-0 bg-light rounded-start-4">
                                  <i className="bi bi-diagram-2" />
                                </span>
                                <select
                                  name="stream"
                                  className={`${inputBase} ${errors.stream ? "is-invalid" : ""}`}
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
                            </div>
                          )}

                          {/* Subject Choice */}
                          {shouldShowSubjectChoice && (
                            <div className="mb-3">
                              <div className="d-flex justify-content-between">
                                <label style={labelStyle}>Subject Choice (Optional)</label>
                                {errors.subjectChoice && (
                                  <small className="text-danger fw-semibold">{errors.subjectChoice}</small>
                                )}
                              </div>
                              <div className="input-group input-group-lg mt-1">
                                <span className="input-group-text border-0 bg-light rounded-start-4">
                                  <i className="bi bi-journal-bookmark" />
                                </span>
                                <select
                                  name="subjectChoice"
                                  className={`${inputBase} ${errors.subjectChoice ? "is-invalid" : ""}`}
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
                            </div>
                          )}

                          {/* Auto Section Note */}
                          {selectedClassNum && (
                            <div className="mb-3">
                              <div className="d-flex justify-content-between">
                                <label style={labelStyle}>Section</label>
                              </div>
                              <div className="alert alert-light border rounded-4 mb-0">
                                {previewStatus === "loading" && (
                                  <>
                                    <i className="bi bi-arrow-repeat me-1"></i>Checking available sections...
                                  </>
                                )}
                                {previewStatus !== "loading" && previewSection && (
                                  <>
                                    Assigned Section Preview: <strong>{previewSection}</strong>
                                  </>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "STREAM_REQUIRED" && (
                                  <>Select a stream to preview assigned section.</>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "INVALID_STREAM" && (
                                  <>Selected stream is invalid for this class.</>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "NO_ACTIVE_SECTIONS" && (
                                  <>No active sections available for this class/stream.</>
                                )}
                                {previewStatus === "ready" && !previewSection && previewReason === "SECTIONS_FULL" && (
                                  <>All sections are full for this class/stream.</>
                                )}
                                {previewStatus === "error" && <>Unable to preview section right now.</>}
                              </div>
                            </div>
                          )}
                          {showLockedWarning && (
                            <div className="alert alert-warning rounded-4">
                              All sections are locked or inactive for the selected class/stream.
                            </div>
                          )}
                          {showFullWarning && (
                            <div className="alert alert-warning rounded-4">
                              All sections are full for the selected class/stream.
                            </div>
                          )}
                        </>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 rounded-pill fw-bold"
                        disabled={isStudent && previewUnavailable}
                        style={{
                          background: "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
                          border: "none",
                          boxShadow: "0 12px 26px rgba(13,110,253,0.25)",
                        }}
                      >
                        Create Account
                      </button>

                      <div className="text-center mt-3">
                        <span className="text-muted">Already have an account? </span>
                        <Link to="/login" className="fw-semibold text-decoration-none">
                          Sign in
                        </Link>
                      </div>
                    </form>
                  </div>

                  <div className="px-4 px-md-5 pb-4">
                    <div className="small text-muted text-center">By registering, you agree to the school’s usage policy.</div>
                  </div>
                </div>

                {/* Mobile brand card */}
                <div className="d-lg-none mt-3">
                  <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
                    <div
                      className="p-4 text-white"
                      style={{ background: "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)" }}
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
