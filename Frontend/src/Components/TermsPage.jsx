import React from "react";
import HomeNavbar from "../Pages/Home/HomeNavbar";

function TermsPage() {
  return (
    <div className="bg-light min-vh-100 py-5">
      <HomeNavbar />
      <div className="container">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5">
            <h1 className="fw-bold mb-3">Terms and Conditions</h1>
            <p className="text-muted mb-4">Last updated: February 21, 2026</p>

            <h5 className="fw-semibold mt-4">1. Acceptance of Terms</h5>
            <p className="text-muted mb-3">
              By using SchoolY, you agree to these terms. If you do not agree, do not use the platform.
            </p>

            <h5 className="fw-semibold mt-4">2. User Responsibilities</h5>
            <p className="text-muted mb-3">
              Users must provide accurate information, keep credentials secure, and use the platform only for lawful
              educational and administrative purposes.
            </p>

            <h5 className="fw-semibold mt-4">3. Data and Content</h5>
            <p className="text-muted mb-3">
              Schools remain responsible for the data they upload and must ensure proper authorization for student and
              staff records.
            </p>

            <h5 className="fw-semibold mt-4">4. Service Availability</h5>
            <p className="text-muted mb-3">
              We aim for reliable service but do not guarantee uninterrupted access. Maintenance and outages may occur.
            </p>

            <h5 className="fw-semibold mt-4">5. Limitation of Liability</h5>
            <p className="text-muted mb-3">
              To the maximum extent permitted by law, SchoolY is not liable for indirect or consequential damages
              arising from use of the platform.
            </p>

            <h5 className="fw-semibold mt-4">6. Changes to Terms</h5>
            <p className="text-muted mb-3">
              We may update these terms periodically. Continued use after updates means you accept the revised terms.
            </p>

            <h5 className="fw-semibold mt-4">7. Contact</h5>
            <p className="text-muted mb-0">
              For legal questions, contact <strong>legal@schooly.com</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
