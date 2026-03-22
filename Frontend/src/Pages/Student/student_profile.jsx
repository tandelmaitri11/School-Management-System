import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- MODERN ENTERPRISE STYLES ---
const styles = {
  page: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "2rem 1rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)",
    overflow: "hidden",
  },
  banner: {
    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    height: "140px",
    position: "relative",
  },
  avatarWrapper: {
    marginTop: "-70px",
    display: "flex",
    justifyContent: "center",
    position: "relative",
  },
  avatar: {
    width: "140px",
    height: "140px",
    border: "6px solid #ffffff",
    borderRadius: "50%",
    backgroundColor: "#f8fafc",
    objectFit: "cover",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  sectionHeader: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "24px",
  },
  infoLabel: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  infoValue: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  iconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    flexShrink: 0,
  }
};

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- API LOGIC (UNCHANGED) ---
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

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="spinner-border text-primary mb-3" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "0.2em" }}></div>
        <div className="text-muted fw-semibold tracking-wider text-uppercase small" style={{ letterSpacing: "1px" }}>Loading Profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center bg-white p-5 rounded-4 shadow-sm border border-light-subtle">
          <i className="bi bi-person-x fs-1 text-secondary opacity-50 mb-3 d-block"></i>
          <h4 className="fw-bold text-dark">Profile Not Found</h4>
          <p className="text-muted mb-0">We couldn't retrieve your student data.</p>
        </div>
      </div>
    );
  }

  const { student, info } = profile;

  return (
    <div style={styles.page}>
      <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        
        {/* --- PAGE HEADER --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pb-3 border-bottom border-secondary border-opacity-10 gap-3">
          <div>
            <div className="badge bg-primary bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill fw-bold border border-primary border-opacity-25 shadow-sm" style={{ letterSpacing: "0.5px" }}>
              <i className="bi bi-person-badge me-2"></i> Student Portal
            </div>
            <h2 className="fw-bolder text-dark mb-0 display-6" style={{ letterSpacing: "-1px" }}>My Profile</h2>
          </div>
          <div className="text-md-end">
            <p className="text-secondary mb-0 fw-medium small">Manage and review your personal academic records.</p>
          </div>
        </div>

        <div className="row g-4">
          
          {/* --- LEFT COLUMN: Digital Identity Card --- */}
          <div className="col-12 col-lg-4">
            <div style={styles.card} className="position-relative h-100">
              {/* Banner */}
              <div style={styles.banner}>
                 <div className="position-absolute top-0 end-0 p-3">
                    <span className="badge bg-white text-dark bg-opacity-75 border px-3 py-2 rounded-pill shadow-sm fw-bold backdrop-blur">
                       <i className="bi bi-patch-check-fill text-success me-1"></i> Active
                    </span>
                 </div>
              </div>
              
              <div className="card-body text-center px-4 pb-5">
                {/* Avatar */}
                <div style={styles.avatarWrapper}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" // Replace with actual profile image
                    alt="Student Avatar"
                    style={styles.avatar}
                  />
                </div>

                {/* Core Identity */}
                <h3 className="fw-bolder mt-4 mb-1 text-dark" style={{ letterSpacing: "-0.5px" }}>{student.name}</h3>
                <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                  <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-semibold shadow-sm">
                    ID: <span className="text-dark">{student.studentId || "N/A"}</span>
                  </span>
                </div>

                {/* Academic Placement */}
                <div className="bg-light rounded-4 p-3 mb-4 border border-light-subtle">
                   <div className="d-flex justify-content-center gap-4 text-dark fw-bold" style={{ fontSize: "0.9rem" }}>
                      <div className="d-flex flex-column">
                         <span className="text-muted small text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Class</span>
                         <span>{student.studentClass || "N/A"} {student.section ? `(${student.section})` : ""}</span>
                      </div>
                      <div className="border-start border-secondary opacity-25"></div>
                      <div className="d-flex flex-column">
                         <span className="text-muted small text-uppercase mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>Stream</span>
                         <span>{student.stream || "General"}</span>
                      </div>
                   </div>
                </div>

                <hr className="my-4 border-secondary opacity-10" />

                {/* Contact quick actions */}
                <div className="d-flex flex-column gap-2 text-start">
                   <div className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Contact Info</div>
                   <a href={`mailto:${student.email}`} className="btn btn-light border w-100 text-start px-3 py-2 fw-medium text-dark btn-hover-lift d-flex align-items-center gap-3">
                     <div className="bg-primary bg-opacity-10 text-primary rounded p-2 d-flex align-items-center justify-content-center">
                        <i className="bi bi-envelope-fill"></i>
                     </div>
                     <span className="text-truncate">{student.email || "No Email Provided"}</span>
                   </a>
                   <div className="btn btn-light border w-100 text-start px-3 py-2 fw-medium text-dark d-flex align-items-center gap-3">
                     <div className="bg-success bg-opacity-10 text-success rounded p-2 d-flex align-items-center justify-content-center">
                        <i className="bi bi-telephone-fill"></i>
                     </div>
                     <span className="text-truncate">{info?.fatherMobile || info?.motherMobile || "No Phone Provided"}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Dossier Details --- */}
          <div className="col-12 col-lg-8 d-flex flex-column gap-4">
            
            {/* Section 1: Personal Information */}
            <div style={styles.card}>
              <div className="px-2">
                 <div style={styles.sectionHeader}>
                   <div style={{...styles.iconBox, backgroundColor: "rgba(13, 110, 253, 0.1)", color: "#0d6efd"}}>
                     <i className="bi bi-file-person-fill"></i>
                   </div>
                   Personal Details
                 </div>
                 
                 <div className="row g-4">
                   <InfoItem label="Date of Birth" value={info?.dob ? new Date(info.dob).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric'}) : null} icon="bi-calendar2-event" tone="primary" />
                   <InfoItem label="Gender" value={info?.gender} icon="bi-gender-ambiguous" tone="info" />
                   <InfoItem label="Blood Group" value={info?.bloodGroup} icon="bi-droplet-fill" tone="danger" />
                   <InfoItem label="Caste / Category" value={info?.cast} icon="bi-people-fill" tone="warning" />
                   <InfoItem label="Subject Choice" value={student?.subjectChoice} icon="bi-journal-bookmark-fill" tone="success" />
                   <InfoItem label="Academic Year" value="2024-2025" icon="bi-mortarboard-fill" tone="dark" />
                   <div className="col-12 mt-2">
                     <div className="p-3 bg-light rounded-4 border border-light-subtle d-flex align-items-start gap-3">
                        <div style={{...styles.iconBox, backgroundColor: "rgba(108, 117, 125, 0.1)", color: "#6c757d"}}>
                           <i className="bi bi-geo-alt-fill"></i>
                        </div>
                        <div>
                           <div style={styles.infoLabel}>Residential Address</div>
                           <div style={{...styles.infoValue, lineHeight: "1.5"}}>{info?.address || <span className="text-muted fst-italic fw-normal">Not Provided</span>}</div>
                        </div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Section 2: Guardian Information */}
            <div style={styles.card}>
              <div className="px-2">
                 <div style={styles.sectionHeader}>
                   <div style={{...styles.iconBox, backgroundColor: "rgba(111, 66, 193, 0.1)", color: "#6f42c1"}}>
                     <i className="bi bi-people-fill"></i>
                   </div>
                   Guardian Information
                 </div>

                 <div className="row g-4">
                   {/* Father's Info */}
                   <div className="col-md-6">
                     <div className="h-100 border border-light-subtle rounded-4 overflow-hidden">
                       <div className="bg-light px-4 py-3 border-bottom d-flex align-items-center gap-2">
                         <i className="bi bi-person-standing text-secondary"></i>
                         <h6 className="fw-bolder m-0 text-dark">Father's Details</h6>
                       </div>
                       <div className="p-4 d-flex flex-column gap-3">
                         <SmallInfo label="Name" value={info?.fatherName} />
                         <SmallInfo label="Occupation" value={info?.fatherOccupation} />
                         <SmallInfo label="Phone" value={info?.fatherMobile} isLink />
                         <SmallInfo label="Income" value={info?.fatherIncome} />
                       </div>
                     </div>
                   </div>

                   {/* Mother's Info */}
                   <div className="col-md-6">
                     <div className="h-100 border border-light-subtle rounded-4 overflow-hidden">
                       <div className="bg-light px-4 py-3 border-bottom d-flex align-items-center gap-2">
                         <i className="bi bi-person-standing-dress text-secondary"></i>
                         <h6 className="fw-bolder m-0 text-dark">Mother's Details</h6>
                       </div>
                       <div className="p-4 d-flex flex-column gap-3">
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

      {/* --- CUSTOM CSS STYLES --- */}
      <style>{`
        .btn-hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          background-color: #f8fafc !important;
        }
        .backdrop-blur {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEAN LAYOUT ---

function InfoItem({ label, value, col = "6", icon, tone = "primary" }) {
  return (
    <div className={`col-sm-6 col-md-${col}`}>
      <div className="d-flex align-items-start gap-3">
        {icon && (
          <div style={{...styles.iconBox, backgroundColor: `var(--bs-${tone}-bg-subtle)`, color: `var(--bs-${tone})`}}>
            <i className={`bi ${icon}`}></i>
          </div>
        )}
        <div>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue} className="text-truncate" title={typeof value === 'string' ? value : ''}>
            {value || <span className="text-muted fst-italic fw-normal">Not Provided</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallInfo({ label, value, isLink }) {
  return (
    <div className="d-flex justify-content-between align-items-center border-bottom border-light-subtle pb-2 last-child-no-border">
      <span className="text-muted small fw-medium">{label}</span>
      <span className="fw-bold text-dark text-end">
        {value ? (
           isLink ? <a href={`tel:${value}`} className="text-decoration-none text-primary">{value}</a> : value
        ) : (
          <span className="text-muted small fw-normal fst-italic">N/A</span>
        )}
      </span>
    </div>
  );
}