import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

// --- STYLES (Inline for simplicity) ---
const styles = {
  banner: {
    background: "linear-gradient(135deg, #0f172a 0%, #3b6ea5 100%)",
    height: "120px",
    borderRadius: "12px 12px 0 0",
  },
  avatarContainer: {
    marginTop: "-60px",
    display: "flex",
    justifyContent: "center",
  },
  avatar: {
    width: "120px",
    height: "120px",
    border: "4px solid white",
    objectFit: "cover",
  },
  cardHeader: {
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "1rem",
    marginBottom: "1rem",
  },
  label: {
    fontSize: "0.85rem",
    color: "#64748b", // Slate-500
    marginBottom: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600",
  },
  value: {
    fontSize: "1rem",
    color: "#1e293b", // Slate-800
    fontWeight: "500",
  },
};

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
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Loading profile...</p>
      </div>
    );

  if (!profile)
    return (
      <div className="text-center mt-5 p-5 bg-white shadow-sm rounded">
        <i className="bi bi-exclamation-circle text-danger fs-1"></i>
        <h4 className="mt-3">Profile not found</h4>
        <p className="text-muted">We couldn't retrieve your student data.</p>
      </div>
    );

  const { student, info } = profile;

  return (
    <div className="container-fluid p-0">
      
      {/* Page Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">My Profile</h4>
          <span className="text-muted small">Manage your personal information</span>
        </div>
        </div>

      <div className="row g-4">
        
        {/* --- LEFT COLUMN: Identity Card --- */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            {/* Gradient Banner */}
            <div style={styles.banner}></div>
            
            <div className="card-body text-center pt-0">
              {/* Avatar */}
              <div style={styles.avatarContainer}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" // Replace with real image URL if available
                  alt="Student"
                  className="rounded-circle shadow-sm bg-white"
                  style={styles.avatar}
                />
              </div>

              {/* Name & ID */}
              <h4 className="fw-bold mt-3 mb-0 text-dark">{student.name}</h4>
              <p className="text-primary fw-medium mb-1">Class {student.studentClass || "N/A"}</p>
              <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
                ID: {student.studentId || "N/A"}
              </span>

              <hr className="my-4 text-muted opacity-25" />

              {/* Quick Status Stats */}
              <div className="row text-center">
                <div className="col-6 border-end">
                  <small className="text-muted d-block mb-1">Status</small>
                  <span className="badge bg-success-subtle text-success rounded-pill px-3">
                    Active
                  </span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block mb-1">Academic Year</small>
                  <span className="fw-semibold text-dark">2024-25</span>
                </div>
              </div>

              {/* Contact Quick Link */}
              <div className="mt-4 d-grid">
                <a href={`mailto:${student.email}`} className="btn btn-light text-start text-truncate">
                  <i className="bi bi-envelope me-2 text-primary"></i>
                  {student.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Details --- */}
        <div className="col-lg-8">
          
          {/* Section 1: Personal Information */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <div style={styles.cardHeader} className="d-flex align-items-center">
                <i className="bi bi-person-lines-fill fs-4 text-primary me-3"></i>
                <h5 className="fw-bold m-0">Personal Details</h5>
              </div>
              
              <div className="row g-4">
                <InfoItem label="Date of Birth" value={info?.dob ? new Date(info.dob).toLocaleDateString() : null} icon="bi-calendar-event" />
                <InfoItem label="Gender" value={info?.gender} icon="bi-gender-ambiguous" />
                <InfoItem label="Blood Group" value={info?.bloodGroup} icon="bi-droplet-half" />
                <InfoItem label="Caste / Category" value={info?.cast} icon="bi-people" />
                <InfoItem label="Address" value={info?.address} col="12" icon="bi-geo-alt" />
              </div>
            </div>
          </div>

          {/* Section 2: Parent / Guardian Information */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <div style={styles.cardHeader} className="d-flex align-items-center">
                <i className="bi bi-people-fill fs-4 text-primary me-3"></i>
                <h5 className="fw-bold m-0">Guardian Information</h5>
              </div>

              <div className="row g-4">
                {/* Father */}
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <h6 className="fw-bold text-dark mb-3"><i className="bi bi-person-standing me-2"></i>Father</h6>
                    <div className="d-flex flex-column gap-3">
                      <SmallInfo label="Name" value={info?.fatherName} />
                      <SmallInfo label="Occupation" value={info?.fatherOccupation} />
                      <SmallInfo label="Phone" value={info?.fatherMobile} isLink />
                      <SmallInfo label="Income" value={info?.fatherIncome} />
                    </div>
                  </div>
                </div>

                {/* Mother */}
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <h6 className="fw-bold text-dark mb-3"><i className="bi bi-person-standing-dress me-2"></i>Mother</h6>
                    <div className="d-flex flex-column gap-3">
                      <SmallInfo label="Name" value={info?.motherName} />
                      <SmallInfo label="Occupation" value={info?.motherOccupation} />
                      <SmallInfo label="Phone" value={info?.motherMobile} isLink />
                      <SmallInfo label="Income" value={info?.motherIncome} />
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

// --- SUB-COMPONENTS for Clean Code ---

function InfoItem({ label, value, col = "6", icon }) {
  return (
    <div className={`col-sm-6 col-md-${col}`}>
      <div className="d-flex">
        {icon && (
          <div className="me-3 mt-1">
             <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary" style={{width:'35px', height:'35px'}}>
               <i className={`bi ${icon}`}></i>
             </div>
          </div>
        )}
        <div>
          <div style={styles.label}>{label}</div>
          <div style={styles.value}>{value || <span className="text-muted fst-italic">Not Provided</span>}</div>
        </div>
      </div>
    </div>
  );
}

function SmallInfo({ label, value, isLink }) {
  return (
    <div className="d-flex justify-content-between border-bottom pb-2">
      <span className="text-muted small">{label}</span>
      <span className="fw-medium text-dark text-end">
        {value ? (
           isLink ? <a href={`tel:${value}`} className="text-decoration-none">{value}</a> : value
        ) : (
          <span className="text-muted small">-</span>
        )}
      </span>
    </div>
  );
}