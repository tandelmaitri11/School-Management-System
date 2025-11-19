import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

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
            <h2 className="fw-bold text-center mb-4 mt-3 text-primary">
              Forgot Password
            </h2>

            {/* Step 1 – Email */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="w-100" style={{ maxWidth: "480px" }}>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control bg-light border-0 p-3 rounded-3"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-center mb-3">
                  <button
                    className="btn btn-primary px-5 py-2 fw-bold rounded-3 w-100"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>

                <p className="text-center text-muted small mt-2">
                  Remembered your password?{" "}
                  <a href="/login" className="text-decoration-underline">
                    Go to Login
                  </a>
                </p>
              </form>
            )}

            {/* Step 2 – Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="w-100" style={{ maxWidth: "480px" }}>
                <p className="text-muted small mb-3">
                  We’ve sent a 4-digit OTP to <strong>{email}</strong>
                </p>

                <div className="d-flex justify-content-between mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      className="form-control text-center mx-1 bg-light border-0 rounded-3 shadow-sm"
                      style={{
                        width: "60px",
                        height: "60px",
                        fontSize: "22px",
                      }}
                      required
                    />
                  ))}
                </div>

                <button
                  className="btn btn-success w-100 fw-bold rounded-3"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
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
              <form onSubmit={handleResetPassword} className="w-100" style={{ maxWidth: "480px" }}>
                <p className="text-success fw-semibold mb-3">
                  OTP Verified Successfully!
                </p>

                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control bg-light border-0 p-3 rounded-3"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-center mb-3">
                  <button
                    className="btn btn-warning px-5 py-2 fw-bold rounded-3 w-100"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4 – Success Message */}
            {step === 4 && (
              <div className="text-center mt-4">
                <h5 className="text-success fw-bold mb-2">
                 Password Reset Successful!
                </h5>
                <p className="text-muted small">Redirecting you to login...</p>
              </div>
            )}

            {/* Toast Message */}
            {toast.message && (
              <div
                className={`alert alert-${toast.type} mt-4 text-center py-2 fw-semibold`}
                style={{ fontSize: "14px" }}
              >
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
