import React, { useEffect, useState } from "react";
import api from "../../api/api";

const styles = {
  pageBackground: {
    backgroundColor: "#f4f7f9",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  },
  cardHeader: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    padding: "1rem 1.5rem",
    borderTopLeftRadius: "0.5rem",
    borderTopRightRadius: "0.5rem",
  },
  avatarPlaceholder: {
    width: "80px",
    height: "80px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.5rem",
    fontSize: "2rem",
    fontWeight: "bold",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.25rem",
  },
  value: {
    fontSize: "0.95rem",
    color: "#0f172a",
    fontWeight: "500",
  }
};

export default function ParentProfile() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/parent/students");
        const rows = res.data?.students || [];
        setStudents(rows);
        setSelectedStudentId(rows[0]?.id || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load linked students");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!selectedStudentId) {
        setProfile(null);
        return;
      }

      try {
        setDetailLoading(true);
        const res = await api.get(`/api/parent/student/${selectedStudentId}/profile`);
        setProfile(res.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load student profile");
      } finally {
        setDetailLoading(false);
      }
    };

    loadProfile();
  }, [selectedStudentId]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={styles.pageBackground}>
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 fw-medium text-secondary">Retrieving records...</div>
      </div>
    );
  }

  const student = profile?.student || null;
  const info = profile?.info || null;

  return (
    <div style={styles.pageBackground}>
      {/* Top Navigation / Header */}
      <div style={styles.headerCard} className="py-3 px-4 px-md-5 mb-4 sticky-top">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 max-w-7xl mx-auto">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Student Profiles</h4>
            <span className="text-muted small">Parent & Guardian Access Portal</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-medium text-nowrap">View Record:</span>
            <select
              className="form-select border-secondary-subtle shadow-sm"
              style={{ minWidth: "250px" }}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {students.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} (ID: {row.studentId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-fluid px-4 px-md-5 pb-5 max-w-7xl mx-auto">
        {error && (
          <div className="alert alert-danger shadow-sm border-0 d-flex align-items-center gap-3 mb-4 rounded-3">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <span className="fw-medium">{error}</span>
          </div>
        )}

        {!students.length ? (
          <div className="alert alert-warning shadow-sm border-0 d-flex align-items-center gap-3 rounded-3 p-4">
            <div>
              <h5 className="fw-bold mb-1">No Students Linked</h5>
              <p className="mb-0 text-dark">Your parent account is currently not associated with any active student records. Please reach out to the administration office for assistance.</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="d-flex flex-column justify-content-center align-items-center py-5 my-5">
            <div className="spinner-border text-secondary" role="status"></div>
            <span className="mt-3 text-secondary fw-medium small text-uppercase tracking-wider">Loading profile data...</span>
          </div>
        ) : !student ? (
          <div className="alert alert-info shadow-sm border-0 rounded-3 p-4 text-center">
            <span className="fw-medium">The selected student profile could not be located.</span>
          </div>
        ) : (
          <div className="row g-4">
            
            {/* Left Column: Quick Overview */}
            <div className="col-xl-3 col-lg-4">
              <div style={styles.card} className="h-100">
                <div className="card-body p-4 d-flex flex-column align-items-center text-center">
                  <div style={styles.avatarPlaceholder} className="mb-3 shadow-sm">
                    {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                  </div>
                  <h5 className="fw-bold text-dark mb-1">{student.name}</h5>
                  <p className="text-muted small mb-3">ID: {student.studentId || "N/A"}</p>
                  
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill mb-4 w-100">
                    Active Status
                  </span>

                  <div className="w-100 text-start border-top pt-3">
                    <OverviewItem label="Class" value={student.studentClass ? `Class ${student.studentClass}` : "N/A"} />
                    <OverviewItem label="Section" value={student.section || "N/A"} />
                    <OverviewItem label="Stream" value={student.stream || "General"} />
                  </div>

                  {student.email && (
  <div className="w-100 mt-3 pt-3 border-top text-center text-break">
    <span className="text-secondary small fw-medium">{student.email}</span>
  </div>
)}
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Sections */}
            <div className="col-xl-9 col-lg-8">
              <div className="d-flex flex-column gap-4">
                
                {/* Academic & Personal Details */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h6 className="fw-bold m-0 text-dark">Demographic & Academic Information</h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="row g-0">
                      <DataCell label="Subject Choice" value={student.subjectChoice} />
                      <DataCell label="Date of Birth" value={info?.dob ? new Date(info.dob).toLocaleDateString() : null} />
                      <DataCell label="Gender" value={info?.gender} />
                      <DataCell label="Blood Group" value={info?.bloodGroup} />
                      <DataCell label="Category" value={info?.cast} />
                      <DataCell label="Contact Phone" value={student.phone || student.mobile || student.contactNumber} isPhone />
                      <div className="col-12 p-3 p-md-4 border-bottom">
                        <div style={styles.label}>Residential Address</div>
                        <div style={styles.value}>{info?.address || <span className="text-muted fst-italic">No address provided</span>}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian Details */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h6 className="fw-bold m-0 text-dark">Family & Guardian Contacts</h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="row g-0 h-100">
                      
                      {/* Father Column */}
                      <div className="col-md-6 border-end-md border-bottom border-bottom-md-0 p-4 bg-light bg-opacity-50">
                        <h6 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">
                          <span className="bg-primary bg-opacity-10 text-primary rounded px-2 py-1 small">Father</span>
                        </h6>
                        <div className="d-flex flex-column gap-3">
                          <GuardianField label="Full Name" value={info?.fatherName} />
                          <GuardianField label="Occupation" value={info?.fatherOccupation} />
                          <GuardianField label="Contact No." value={info?.fatherMobile} isPhone />
                          <GuardianField label="Annual Income" value={info?.fatherIncome} />
                        </div>
                      </div>

                      {/* Mother Column */}
                      <div className="col-md-6 p-4">
                        <h6 className="fw-bold text-info mb-4 d-flex align-items-center gap-2">
                           <span className="bg-info bg-opacity-10 text-info rounded px-2 py-1 small">Mother</span>
                        </h6>
                        <div className="d-flex flex-column gap-3">
                          <GuardianField label="Full Name" value={info?.motherName} />
                          <GuardianField label="Occupation" value={info?.motherOccupation} />
                          <GuardianField label="Contact No." value={info?.motherMobile} isPhone />
                          <GuardianField label="Annual Income" value={info?.motherIncome} />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Components for the New UI

function OverviewItem({ label, value }) {
  return (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
      <span className="text-secondary small fw-medium">{label}</span>
      <span className="text-dark fw-bold small">{value}</span>
    </div>
  );
}

function DataCell({ label, value, isPhone = false }) {
  return (
    <div className="col-sm-6 col-md-4 p-3 p-md-4 border-bottom border-end-sm">
      <div style={styles.label}>{label}</div>
      <div style={styles.value} className="text-truncate" title={value || ""}>
        {value ? (
          isPhone ? (
            <a href={`tel:${value}`} className="text-decoration-none text-primary">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-muted fst-italic fw-normal">Not Provided</span>
        )}
      </div>
    </div>
  );
}

function GuardianField({ label, value, isPhone = false }) {
  return (
    <div className="d-flex flex-column">
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>
        {value ? (
          isPhone ? (
            <a href={`tel:${value}`} className="text-decoration-none text-dark border-bottom border-dark border-opacity-25 pb-1">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-muted fst-italic small">Unavailable</span>
        )}
      </span>
    </div>
  );
}