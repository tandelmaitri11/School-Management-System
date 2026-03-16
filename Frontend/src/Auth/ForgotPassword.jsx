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

  // Modernized StepPill Component
  const StepPill = ({ n, label, active, done, lightText = false }) => (
    <div className="d-flex align-items-center gap-3 mb-3">
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm ${
          done 
            ? "bg-success text-white" 
            : active 
              ? "bg-primary text-white" 
              : "bg-light text-muted border"
        }`}
        style={{ width: 36, height: 36, fontSize: 15, transition: 'all 0.3s ease' }}
      >
        {done ? <i className="bi bi-check-lg" /> : n}
      </div>
      <div className={`fw-semibold ${lightText ? (active || done ? "text-white" : "text-white-50") : (active ? "text-dark" : "text-muted")}`}>
        {label}
      </div>
    </div>
  );

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#f3f4f6", // Matches new modern background
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="row g-0 align-items-stretch">
                
                {/* Left Side: Form Panel */}
                <div className="col-lg-6 p-4 p-md-5 bg-white d-flex flex-column justify-content-center">
                  
                  {/* Mobile Brand Header */}
                  <div className="d-lg-none mb-4 d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-shield-lock-fill fs-2"></i>
                  </div>

                  <div className="mb-4">
                    <h2 className="fw-bold text-dark mb-2">Password Recovery</h2>
                    <p className="text-muted">
                      {step === 1 && "We will send an OTP to your registered email."}
                      {step === 2 && "Enter the 4-digit OTP sent to your email."}
                      {step === 3 && "Create a new strong password for your account."}
                      {step === 4 && "Your password has been updated successfully."}
                    </p>
                  </div>

                  {/* Toast Alerts */}
                  {toast.message && (
                    <div className={`alert alert-${toast.type} d-flex align-items-center rounded-3 mb-4`} role="alert">
                      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-5`}></i>
                      <div>{toast.message}</div>
                    </div>
                  )}

                  {/* Step 1 – Email */}
                  {step === 1 && (
                    <form onSubmit={handleSendOtp}>
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                          Email Address
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="bi bi-envelope"></i>
                          </span>
                          <input
                            type="email"
                            className="form-control bg-light border-start-0 ps-0"
                            placeholder="name@schooly.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ boxShadow: 'none' }}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending OTP...</>
                        ) : (
                          "Send OTP"
                        )}
                      </button>

                      <div className="text-center mt-4">
                        <span className="text-muted small">Remembered your password? </span>
                        <Link to="/login" className="text-primary fw-bold text-decoration-none small ms-1">
                          Go to Login
                        </Link>
                      </div>
                    </form>
                  )}

                  {/* Step 2 – Verify OTP */}
                  {step === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="mb-4">
                        <div className="text-muted small mb-3">
                          We sent a 4-digit verification code to <span className="fw-bold text-dark">{email}</span>
                        </div>
                        <div className="d-flex justify-content-between gap-2">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => (otpRefs.current[index] = el)}
                              type="text"
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handleOtpChange(e.target.value, index)}
                              className="form-control text-center bg-light border-0 rounded-3 shadow-sm"
                              style={{
                                height: 65,
                                fontSize: 24,
                                fontWeight: 700,
                                boxShadow: 'none'
                              }}
                              inputMode="numeric"
                              required
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Verifying...</>
                        ) : (
                          "Verify OTP"
                        )}
                      </button>

                      <div className="text-center mt-3">
                        <button
                          type="button"
                          className="btn btn-link text-muted text-decoration-none small"
                          onClick={() => setStep(1)}
                          disabled={loading}
                        >
                          <i className="bi bi-arrow-left me-1"></i> Back to Email
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 3 – Reset Password */}
                  {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-secondary small text-uppercase">
                          New Password
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="bi bi-lock"></i>
                          </span>
                          <input
                            type="password"
                            className="form-control bg-light border-start-0 ps-0"
                            placeholder="Create a strong password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{ boxShadow: 'none' }}
                            required
                          />
                        </div>
                        <div className="form-text mt-2 small text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Use at least 8 characters, and mix letters & numbers.
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Updating...</>
                        ) : (
                          "Reset Password"
                        )}
                      </button>

                      <div className="text-center mt-3">
                        <button
                          type="button"
                          className="btn btn-link text-muted text-decoration-none small"
                          onClick={() => setStep(2)}
                          disabled={loading}
                        >
                          <i className="bi bi-arrow-left me-1"></i> Back to OTP
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 4 – Success */}
                  {step === 4 && (
                    <div className="text-center py-4">
                      <div
                        className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-4"
                        style={{ width: 80, height: 80 }}
                      >
                        <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem' }} />
                      </div>
                      <h3 className="fw-bold text-dark mb-2">Password Reset!</h3>
                      <p className="text-muted mb-4">Your password has been successfully updated. You will be redirected to the login page shortly.</p>

                      <Link to="/login" className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm">
                        Go to Login Now
                      </Link>
                    </div>
                  )}

                  {/* Mobile Step Indicator */}
                  <div className="d-lg-none mt-5">
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <div className={`rounded-circle ${step >= 1 ? 'bg-primary' : 'bg-light'} shadow-sm`} style={{ width: 12, height: 12 }}></div>
                      <div className={`bg-${step >= 2 ? 'primary' : 'light'} rounded-pill`} style={{ height: 3, width: 30 }}></div>
                      <div className={`rounded-circle ${step >= 2 ? 'bg-primary' : 'bg-light'} shadow-sm`} style={{ width: 12, height: 12 }}></div>
                      <div className={`bg-${step >= 3 ? 'primary' : 'light'} rounded-pill`} style={{ height: 3, width: 30 }}></div>
                      <div className={`rounded-circle ${step >= 3 ? 'bg-primary' : 'bg-light'} shadow-sm`} style={{ width: 12, height: 12 }}></div>
                      <div className={`bg-${step >= 4 ? 'primary' : 'light'} rounded-pill`} style={{ height: 3, width: 30 }}></div>
                      <div className={`rounded-circle ${step >= 4 ? 'bg-success' : 'bg-light'} shadow-sm`} style={{ width: 12, height: 12 }}></div>
                    </div>
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

                  <div className="position-relative h-100 d-flex flex-column justify-content-between p-5 text-white" style={{ zIndex: 2 }}>
                    
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-5">
                        <div className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: "50px", height: "50px" }}>
                          <i className="bi bi-mortarboard-fill fs-3"></i>
                        </div>
                        <h3 className="fw-bolder mb-0 tracking-tight">SchoolY</h3>
                      </div>

                      <h1 className="fw-bold display-6 mb-4 leading-tight">
                        Secure Account <br/> Recovery.
                      </h1>
                      <p className="opacity-75 fs-6 w-75 mb-5">
                        Regain access to your SchoolY dashboard quickly and securely using our 4-step OTP verification process.
                      </p>
                    </div>

                    {/* Progress Tracker integrated into the branding panel */}
                    <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-4 border border-white border-opacity-10">
                      <h6 className="fw-bold mb-4 text-white opacity-75 text-uppercase tracking-wider">Recovery Process</h6>
                      <div className="d-flex flex-column">
                        <StepPill n={1} label="Verify Email Address" active={step === 1} done={step > 1} lightText={true} />
                        <StepPill n={2} label="Enter OTP Sent to Email" active={step === 2} done={step > 2} lightText={true} />
                        <StepPill n={3} label="Create New Password" active={step === 3} done={step > 3} lightText={true} />
                        <StepPill n={4} label="Access Restored" active={step === 4} done={step > 4} lightText={true} />
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