import React from "react";
import HomeNavbar from "../Pages/Home/HomeNavbar";

function PrivacyPolicyPage() {
  return (
    <div className="bg-light min-vh-100 py-5">
      <HomeNavbar />
      <div className="container">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5">
            <h1 className="fw-bold mb-3">Privacy Policy</h1>
            <p className="text-muted mb-4">Last updated: February 21, 2026</p>

            <h5 className="fw-semibold mt-4">1. Information We Collect</h5>
            <p className="text-muted mb-3">
              We collect account details, academic records, attendance data, fee records, and system usage logs
              needed to provide school management services.
            </p>

            <h5 className="fw-semibold mt-4">2. How We Use Information</h5>
            <p className="text-muted mb-3">
              Data is used to manage classes, users, attendance, exams, timetable, communication, and billing
              workflows. We do not sell personal data.
            </p>

            <h5 className="fw-semibold mt-4">3. Data Sharing</h5>
            <p className="text-muted mb-3">
              We may share data with authorized school staff and trusted service providers strictly for platform
              operations, security, and compliance.
            </p>

            <h5 className="fw-semibold mt-4">4. Data Security</h5>
            <p className="text-muted mb-3">
              We apply technical and organizational safeguards to protect data from unauthorized access, loss, or
              misuse.
            </p>

            <h5 className="fw-semibold mt-4">5. Data Retention</h5>
            <p className="text-muted mb-3">
              Data is retained for operational and legal requirements, then securely deleted or anonymized when no
              longer required.
            </p>

            <h5 className="fw-semibold mt-4">6. Contact</h5>
            <p className="text-muted mb-0">
              For privacy questions, contact us at <strong>privacy@schooly.com</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
