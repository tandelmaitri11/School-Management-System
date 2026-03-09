import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) otpRefs.current[index + 1].focus();
  };

  const fullOtp = otp.join("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    setLoading(true);
    try {
      const res = await api.post("/api/forgot-password", { email });
      setToast({ message: res.data.message, type: "success" });
      setStep(2);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Error sending OTP",
        type: "danger",
      });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    setLoading(true);
    try {
      const res = await api.post("/api/verify-otp", { email, otp: fullOtp });
      setToast({ message: res.data.message, type: "success" });
      setStep(3);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Invalid OTP",
        type: "danger",
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    setLoading(true);
    try {
      const res = await api.post("/api/reset-password", {
        email,
        otp: fullOtp,
        newPassword,
      });
      setToast({ message: res.data.message, type: "success" });
      setStep(4);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Error resetting password",
        type: "danger",
      });
    }
    setLoading(false);
  };

  const StepPill = ({ n, label, active, done }) => (
    <div className="d-flex align-items-center gap-2">
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
          done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-light text-muted border"
        }`}
        style={{ width: 32, height: 32, fontSize: 14 }}
      >
        {done ? <i className="bi bi-check-lg" /> : n}
      </div>
      <div className={`small fw-semibold ${active ? "text-dark" : "text-muted"}`}>{label}</div>
    </div>
  );

  return (
    <div
      className="min-vh-100 d-flex align-items-stretch"
      style={{
        background: "linear-gradient(135deg, rgba(13,110,253,0.10) 0%, rgba(111,66,193,0.10) 100%)",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div className="container py-4 py-md-5 d-flex align-items-center">
        <div className="row g-4 w-100 align-items-stretch justify-content-center">
          {/* Left info panel */}
          <div className="col-lg-5 d-none d-lg-block">
            <div
              className="h-100 rounded-5 shadow-sm overflow-hidden p-5 text-white position-relative"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
                minHeight: 560,
              }}
            >
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
                  <i className="bi bi-shield-lock-fill fs-4" />
                </div>
                <div>
                  <div className="fw-bold fs-4" style={{ lineHeight: 1.1 }}>
                    Password Recovery
                  </div>
                  <div className="opacity-75" style={{ lineHeight: 1.1 }}>
                    Secure OTP Verification
                  </div>
                </div>
              </div>

              <h2 className="fw-bold mb-2">Reset your password</h2>
              <p className="opacity-75 mb-0" style={{ maxWidth: 430 }}>
                Enter your registered email, verify OTP, and set a new password. Your account stays secure.
              </p>

              <div className="d-flex gap-3 mt-5 flex-column">
                <StepPill n={1} label="Email" active={step === 1} done={step > 1} />
                <StepPill n={2} label="OTP" active={step === 2} done={step > 2} />
                <StepPill n={3} label="New Password" active={step === 3} done={step > 3} />
                <StepPill n={4} label="Done" active={step === 4} done={step > 4} />
              </div>

              <div className="position-absolute bottom-0 start-0 end-0 p-4">
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Encrypted</span>
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">OTP Based</span>
                  <span className="badge rounded-pill text-bg-light border px-3 py-2">Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="col-12 col-md-10 col-lg-6">
            <div className="card border-0 shadow-sm rounded-5 overflow-hidden">
              <div className="p-4 p-md-5 border-bottom bg-white">
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div className="fw-bold fs-3 mb-1">Forgot Password</div>
                    <div className="text-muted">
                      {step === 1 && "We will send an OTP to your email."}
                      {step === 2 && "Enter the 4-digit OTP sent to your email."}
                      {step === 3 && "Create a new strong password."}
                      {step === 4 && "Password updated successfully."}
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                    Step {step}/4
                  </span>
                </div>

                {toast.message && (
                  <div className={`alert alert-${toast.type} mt-4 mb-0 rounded-4`}>
                    {toast.message}
                  </div>
                )}
              </div>

              <div className="p-4 p-md-5">
                {/* Step 1 – Email */}
                {step === 1 && (
                  <form onSubmit={handleSendOtp}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold mb-1">Email</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text border-0 bg-light rounded-start-4">
                          <i className="bi bi-envelope" />
                        </span>
                        <input
                          type="email"
                          className="form-control form-control-lg border-0 bg-light shadow-sm rounded-end-4"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      className="btn btn-lg w-100 rounded-pill fw-bold"
                      disabled={loading}
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
                        border: "none",
                        color: "#fff",
                        boxShadow: "0 12px 26px rgba(13,110,253,0.20)",
                      }}
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </button>

                    <div className="text-center mt-3">
                      <span className="text-muted small">Remembered your password? </span>
                      <Link to="/login" className="fw-semibold text-decoration-none small">
                        Go to Login
                      </Link>
                    </div>
                  </form>
                )}

                {/* Step 2 – Verify OTP */}
                {step === 2 && (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="mb-3">
                      <div className="text-muted small">
                        We sent a 4-digit OTP to <span className="fw-semibold text-dark">{email}</span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, index)}
                          className="form-control text-center border-0 bg-light shadow-sm rounded-4"
                          style={{
                            height: 58,
                            width: 64,
                            fontSize: 22,
                            fontWeight: 700,
                          }}
                          inputMode="numeric"
                          required
                        />
                      ))}
                    </div>

                    <button
                      className="btn btn-success btn-lg w-100 rounded-pill fw-bold"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-link mt-3 text-decoration-none"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      ← Back
                    </button>
                  </form>
                )}

                {/* Step 3 – Reset Password */}
                {step === 3 && (
                  <form onSubmit={handleResetPassword}>
                    <div className="alert alert-success rounded-4 py-2">
                      <i className="bi bi-check-circle-fill me-2" />
                      OTP verified successfully
                    </div>

                    <div className="mb-3">
                      <label className="small text-muted fw-semibold mb-1">New Password</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text border-0 bg-light rounded-start-4">
                          <i className="bi bi-key" />
                        </span>
                        <input
                          type="password"
                          className="form-control form-control-lg border-0 bg-light shadow-sm rounded-end-4"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-text">
                        Use at least 8 characters, mix letters & numbers.
                      </div>
                    </div>

                    <button
                      className="btn btn-warning btn-lg w-100 rounded-pill fw-bold"
                      disabled={loading}
                      style={{ boxShadow: "0 12px 26px rgba(255,193,7,0.25)" }}
                    >
                      {loading ? "Updating..." : "Reset Password"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-link mt-3 text-decoration-none"
                      onClick={() => setStep(2)}
                      disabled={loading}
                    >
                      ← Back
                    </button>
                  </form>
                )}

                {/* Step 4 – Success */}
                {step === 4 && (
                  <div className="text-center py-4">
                    <div
                      className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center"
                      style={{ width: 72, height: 72 }}
                    >
                      <i className="bi bi-check2 fs-1" />
                    </div>
                    <h4 className="fw-bold text-success mt-3 mb-1">
                      Password Reset Successful!
                    </h4>
                    <p className="text-muted mb-0">Redirecting you to login...</p>

                    <div className="mt-3">
                      <Link to="/login" className="btn btn-outline-primary rounded-pill px-4">
                        Go to Login
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 px-md-5 pb-4">
                <div className="small text-muted text-center">
                  SchoolY • Secure password recovery
                </div>
              </div>
            </div>

            {/* Mobile step indicator */}
            <div className="d-lg-none mt-3">
              <div className="card border-0 shadow-sm rounded-5">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <StepPill n={1} label="Email" active={step === 1} done={step > 1} />
                  <div className="text-muted">—</div>
                  <StepPill n={2} label="OTP" active={step === 2} done={step > 2} />
                  <div className="text-muted">—</div>
                  <StepPill n={3} label="Password" active={step === 3} done={step > 3} />
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
