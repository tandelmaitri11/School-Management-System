import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- MODERN ENTERPRISE LIGHT STYLES ---
const styles = {
  page: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "2rem 0", // Removed side padding here, relying on container-fluid padding
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.02)",
    overflow: "hidden",
  },
  banner: {
    background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", // Soft Indigo Gradient
    height: "130px",
    position: "relative",
  },
  avatarWrapper: {
    marginTop: "-65px",
    display: "flex",
    justifyContent: "center",
    position: "relative",
  },
  avatar: {
    width: "130px",
    height: "130px",
    border: "6px solid #ffffff",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    objectFit: "cover",
    boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
  },
  sectionHeader: {
    fontSize: "1.15rem",
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
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
  },
  infoValue: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  iconBox: {
    width: "42px",
    height: "42px",
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

  // --- API LOGIC ---
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
        <div className="spinner-border mb-3" style={{ color: "#4f46e5", width: "2.5rem", height: "2.5rem", borderWidth: "0.2em" }}></div>
        <div className="text-muted fw-semibold tracking-wider text-uppercase small" style={{ letterSpacing: "1px" }}>Loading Profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center bg-white p-5 rounded-4 border" style={{ borderColor: '#e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle bg-light" style={{ width: '80px', height: '80px' }}>
            <i className="bi bi-person-x fs-1 text-secondary opacity-50"></i>
          </div>
          <h4 className="fw-bold" style={{ color: '#0f172a' }}>Profile Not Found</h4>
          <p className="mb-0" style={{ color: '#64748b' }}>We couldn't retrieve your student data.</p>
        </div>
      </div>
    );
  }

  const { student, info } = profile;
  
  // Dynamic avatar based on student name if no image exists
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=e0e7ff&color=4f46e5&size=256&bold=true`;

  return (
    <div style={styles.page}>
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* --- PAGE HEADER --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 pb-3 gap-3">
          <div>
            <div className="badge mb-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', letterSpacing: "0.5px" }}>
              <i className="bi bi-person-badge me-2"></i> Student Portal
            </div>
            <h2 className="fw-bolder mb-0 display-6" style={{ color: '#0f172a', letterSpacing: "-1px" }}>My Profile</h2>
          </div>
          <div className="text-md-end">
            <p className="mb-0 fw-medium small" style={{ color: '#64748b' }}>Manage and review your personal academic records.</p>
          </div>
        </div>

        <div className="row g-4">
          
          {/* --- LEFT COLUMN: Digital Identity Card --- */}
          <div className="col-12 col-lg-4 col-xxl-3">
            <div style={styles.card} className="position-relative h-100">
              {/* Banner */}
              <div style={styles.banner}>
                 <div className="position-absolute top-0 end-0 p-3">
                    <span className="badge bg-white text-dark border px-3 py-2 rounded-pill shadow-sm fw-semibold d-flex align-items-center gap-1">
                       <span className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></span> Active
                    </span>
                 </div>
              </div>
              
              <div className="card-body text-center px-4 pb-5">
                {/* Avatar */}
                <div style={styles.avatarWrapper}>
                  <img
                    src={avatarUrl}
                    alt="Student Avatar"
                    style={styles.avatar}
                  />
                </div>

                {/* Core Identity */}
                <h3 className="fw-bolder mt-4 mb-1" style={{ color: '#0f172a', letterSpacing: "-0.5px" }}>{student.name}</h3>
                <div className="d-flex justify-content-center align-items-center gap-2 mb-4">
                  <span className="badge bg-light border px-3 py-2 rounded-pill fw-semibold" style={{ color: '#64748b' }}>
                    ID: <span style={{ color: '#0f172a' }}>{student.studentId || "N/A"}</span>
                  </span>
                </div>

                {/* Academic Placement */}
                <div className="rounded-4 p-3 mb-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                   <div className="d-flex justify-content-center gap-4 text-dark fw-bold" style={{ fontSize: "0.9rem" }}>
                      <div className="d-flex flex-column w-50">
                         <span style={styles.infoLabel}>Class</span>
                         <span style={{ color: '#0f172a' }}>{student.studentClass || "N/A"} {student.section ? `(${student.section})` : ""}</span>
                      </div>
                      <div style={{ width: '1px', backgroundColor: '#cbd5e1' }}></div>
                      <div className="d-flex flex-column w-50">
                         <span style={styles.infoLabel}>Stream</span>
                         <span style={{ color: '#0f172a' }}>{student.stream || "General"}</span>
                      </div>
                   </div>
                </div>

                <hr className="my-4" style={{ borderColor: '#e2e8f0' }} />

                {/* Contact quick actions */}
                <div className="d-flex flex-column gap-3 text-start">
                   <div style={styles.infoLabel}>Contact Info</div>
                   <a href={`mailto:${student.email}`} className="text-decoration-none contact-card p-3 rounded-4 border d-flex align-items-center gap-3 w-100 transition-all" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                     <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                        <i className="bi bi-envelope-fill"></i>
                     </div>
                     <div className="text-truncate flex-grow-1">
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Email Address</div>
                        <div className="fw-semibold text-truncate" style={{ color: '#0f172a', fontSize: '0.9rem' }}>{student.email || "No Email Provided"}</div>
                     </div>
                   </a>
                   <div className="contact-card p-3 rounded-4 border d-flex align-items-center gap-3 w-100 transition-all" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                     <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#ecfdf5', color: '#10b981' }}>
                        <i className="bi bi-telephone-fill"></i>
                     </div>
                     <div className="text-truncate flex-grow-1">
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Phone Number</div>
                        <div className="fw-semibold text-truncate" style={{ color: '#0f172a', fontSize: '0.9rem' }}>{info?.fatherMobile || info?.motherMobile || "No Phone Provided"}</div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Dossier Details --- */}
          <div className="col-12 col-lg-8 col-xxl-9 d-flex flex-column gap-4">
            
            {/* Section 1: Personal Information */}
            <div style={styles.card}>
              <div className="p-4 p-md-5">
                 <div style={styles.sectionHeader}>
                   <div style={{...styles.iconBox, backgroundColor: "#eff6ff", color: "#3b82f6"}}>
                     <i className="bi bi-file-person"></i>
                   </div>
                   Personal Details
                 </div>
                 
                 <div className="row g-4 mb-4">
                   <InfoItem label="Date of Birth" value={info?.dob ? new Date(info.dob).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric'}) : null} icon="bi-calendar2-event" bg="#f1f5f9" color="#475569" col="4" />
                   <InfoItem label="Gender" value={info?.gender} icon="bi-gender-ambiguous" bg="#e0f2fe" color="#0284c7" col="4" />
                   <InfoItem label="Blood Group" value={info?.bloodGroup} icon="bi-droplet" bg="#ffe4e6" color="#e11d48" col="4" />
                   <InfoItem label="Caste / Category" value={info?.cast} icon="bi-people" bg="#fef3c7" color="#d97706" col="4" />
                   <InfoItem label="Subject Choice" value={student?.subjectChoice} icon="bi-journal-bookmark" bg="#ecfdf5" color="#059669" col="4" />
                   <InfoItem label="Academic Year" value="2024-2025" icon="bi-mortarboard" bg="#f3f4f6" color="#374151" col="4" />
                 </div>

                 <div className="p-4 rounded-4 d-flex align-items-start gap-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{...styles.iconBox, backgroundColor: "#ffffff", color: "#64748b", border: '1px solid #e2e8f0'}}>
                       <i className="bi bi-geo-alt"></i>
                    </div>
                    <div>
                       <div style={styles.infoLabel}>Residential Address</div>
                       <div style={{...styles.infoValue, lineHeight: "1.6", marginTop: '4px'}}>
                         {info?.address || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not Provided</span>}
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Section 2: Guardian Information */}
            <div style={styles.card}>
              <div className="p-4 p-md-5">
                 <div style={styles.sectionHeader}>
                   <div style={{...styles.iconBox, backgroundColor: "#f5f3ff", color: "#8b5cf6"}}>
                     <i className="bi bi-house-door"></i>
                   </div>
                   Guardian Information
                 </div>

                 <div className="row g-4">
                   {/* Father's Info */}
                   <div className="col-md-6">
                     <div className="h-100 rounded-4 overflow-hidden" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                       <div className="px-4 py-3 d-flex align-items-center gap-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                         <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                            <i className="bi bi-person-standing"></i>
                         </div>
                         <h6 className="fw-semibold m-0" style={{ color: '#0f172a' }}>Father's Details</h6>
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
                     <div className="h-100 rounded-4 overflow-hidden" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                       <div className="px-4 py-3 d-flex align-items-center gap-3" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                         <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                            <i className="bi bi-person-standing-dress"></i>
                         </div>
                         <h6 className="fw-semibold m-0" style={{ color: '#0f172a' }}>Mother's Details</h6>
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
        .contact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05) !important;
          border-color: #cbd5e1 !important;
        }
        .info-row-border:not(:last-child) {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEAN LAYOUT ---

function InfoItem({ label, value, col = "6", icon, bg, color }) {
  return (
    <div className={`col-sm-6 col-lg-${col}`}>
      <div className="d-flex align-items-start gap-3">
        {icon && (
          <div style={{...styles.iconBox, backgroundColor: bg, color: color}}>
            <i className={`bi ${icon}`}></i>
          </div>
        )}
        <div>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue} className="text-truncate" title={typeof value === 'string' ? value : ''}>
            {value || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not Provided</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallInfo({ label, value, isLink }) {
  return (
    <div className="d-flex justify-content-between align-items-center info-row-border">
      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      <span className="fw-semibold text-end" style={{ color: '#0f172a', fontSize: '0.9rem' }}>
        {value ? (
           isLink ? <a href={`tel:${value}`} className="text-decoration-none" style={{ color: '#4f46e5' }}>{value}</a> : value
        ) : (
          <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontWeight: 400, fontSize: '0.85rem' }}>N/A</span>
        )}
      </span>
    </div>
  );
}