import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) return;
        const res = await api.get(`/api/students/profile/${studentId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching student profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-secondary" role="status"></div>
      </div>
    );

  if (!profile)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <h5 className="text-danger">Profile not found!</h5>
      </div>
    );

  const { student, info } = profile;

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 text-center">
        <h3 className="fw-semibold mb-0">Student Profile</h3>
        <small className="text-muted">View and manage your details</small>
      </header>

      {/* Profile Content */}
      <main className="container my-5 flex-grow-1">
        {/* Top Info */}
        <div className="d-flex flex-column flex-md-row align-items-center text-center text-md-start mb-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Profile"
            className="rounded-circle border mb-3 mb-md-0"
            width="110"
            height="110"
          />
          <div className="ms-md-4">
            <h4 className="fw-semibold text-dark mb-1">{student.name}</h4>
            <p className="mb-0 text-muted">Class: {student.studentClass || "N/A"}</p>
            <p className="mb-0 text-muted">Student ID: {student.studentId || "N/A"}</p>
          </div>
        </div>

        <hr />

        {/* Personal Info */}
        <Section title="Personal Details" />
        <div className="row g-3 mb-4">
          <Info label="Full Name" value={student.name} />
          <Info
            label="Date of Birth"
            value={info?.dob ? new Date(info.dob).toLocaleDateString() : "N/A"}
          />
          <Info label="Gender" value={info?.gender || "N/A"} />
          <Info label="Blood Group" value={info?.bloodGroup || "N/A"} />
          <Info label="Address" value={info?.address || "N/A"} />
          <Info label="Caste" value={info?.cast || "N/A"} />
        </div>

        {/* Contact Info */}
        <Section title="Contact Information" />
        <div className="row g-3 mb-4">
          <Info label="Email" value={student.email} />
        </div>

        {/* Parent Info */}
        <Section title="Parent / Guardian Information" />
        <div className="row g-3">
          <Info label="Father's Name" value={info?.fatherName || "N/A"} />
          <Info label="Father Mobile" value={info?.fatherMobile || "N/A"} />
          <Info label="Father Occupation" value={info?.fatherOccupation || "N/A"} />
          <Info label="Father Income" value={info?.fatherIncome || "N/A"} />
          <Info label="Mother's Name" value={info?.motherName || "N/A"} />
          <Info label="Mother Mobile" value={info?.motherMobile || "N/A"} />
          <Info label="Mother Occupation" value={info?.motherOccupation || "N/A"} />
          <Info label="Mother Income" value={info?.motherIncome || "N/A"} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white text-center text-secondary py-3 small border-top">
        © {new Date().getFullYear()} School Management System
      </footer>
    </div>
  );
}

function Section({ title }) {
  return (
    <h6 className="fw-bold text-dark text-uppercase border-start border-3 border-secondary ps-2 mt-3 mb-2">
      {title}
    </h6>
  );
}

function Info({ label, value }) {
  return (
    <div className="col-md-6">
      <div className="text-muted small">{label}</div>
      <div className="fw-semibold text-dark">{value}</div>
    </div>
  );
}
