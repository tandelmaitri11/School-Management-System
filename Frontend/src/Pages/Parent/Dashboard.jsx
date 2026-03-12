import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function ParentDashboard() {
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [report, setReport] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [profileRes, studentsRes] = await Promise.all([
          api.get("/api/parent/me"),
          api.get("/api/parent/students"),
        ]);

        const nextStudents = studentsRes.data?.students || [];
        setProfile(profileRes.data?.parent || null);
        setStudents(nextStudents);
        setSelectedStudentId(nextStudents[0]?.id || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load parent dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadStudentDetails = async () => {
      if (!selectedStudentId) {
        setAttendance([]);
        setReport(null);
        setFees(null);
        return;
      }

      try {
        setDetailLoading(true);
        const [attendanceRes, reportRes, feesRes] = await Promise.all([
          api.get(`/api/parent/student/${selectedStudentId}/attendance`),
          api.get(`/api/parent/student/${selectedStudentId}/report`),
          api.get(`/api/parent/student/${selectedStudentId}/fees`),
        ]);
        setAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
        setReport(reportRes.data || null);
        setFees(feesRes.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load student details");
      } finally {
        setDetailLoading(false);
      }
    };

    loadStudentDetails();
  }, [selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || null;
  const presentDays = attendance.filter((row) => row.status === "Present").length;
  const attendancePct = attendance.length ? ((presentDays / attendance.length) * 100).toFixed(2) : "0.00";
  const totalDue = Number(fees?.feeSummary?.totalDue || 0);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-medium">Loading parent dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4 bg-light min-vh-100">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Parent Dashboard</h2>
          <div className="text-secondary d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
            </svg>
            <span className="fw-medium">{profile?.name || "Parent"}</span> 
            {profile?.parentId && <span className="badge bg-secondary bg-opacity-10 text-secondary border">{profile.parentId}</span>}
          </div>
        </div>

        <div className="bg-white p-2 rounded-3 shadow-sm border" style={{ minWidth: "300px" }}>
          <label className="form-label small text-muted mb-1 px-1 fw-semibold">Select Child to View</label>
          <select
            className="form-select border-0 shadow-none fw-medium text-dark bg-light"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm border-0 border-start border-danger border-4 rounded-3 d-flex align-items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
          <div>{error}</div>
        </div>
      )}

      {!students.length ? (
        <div className="alert alert-warning shadow-sm border-0 border-start border-warning border-4 rounded-3 d-flex align-items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-info-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          <div>Admin has not linked this parent account to any student yet. Please contact school admin.</div>
        </div>
      ) : (
        <>
          {/* 4 Top KPI Cards */}
          <div className="row g-4 mb-4">
            {/* Student Info */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-body p-4 position-relative">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Selected Student</div>
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                      </svg>
                    </div>
                  </div>
                  <h4 className="fw-bold text-dark mb-1 text-truncate">{selectedStudent?.name || "-"}</h4>
                  <div className="text-muted small mb-1">
                    Class {selectedStudent?.className || "-"} {selectedStudent?.section ? `| Sec ${selectedStudent.section}` : ""}
                  </div>
                  <div className="text-muted small">
                    <span className="badge bg-light text-dark border">
                      {selectedStudent?.stream ? `Stream ${selectedStudent.stream}` : "General"}
                    </span>
                    {selectedStudent?.relation ? <span className="ms-2 badge bg-light text-dark border">{selectedStudent.relation}</span> : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Attendance</div>
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                      </svg>
                    </div>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">{attendancePct}%</h3>
                  <div className="text-muted small">{presentDays} present records</div>
                </div>
              </div>
            </div>

            {/* Overall Result */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Overall Result</div>
                    <div className="bg-info bg-opacity-10 text-info p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z"/>
                      </svg>
                    </div>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">{report?.overallResult?.score || 0}</h3>
                  <div className="text-muted small">{report?.overallResult?.label || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Fees Due */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Fees Due</div>
                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                      </svg>
                    </div>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">Rs {totalDue}</h3>
                  <div className={`small fw-medium ${fees?.fees?.feeStatus === 'Paid' ? 'text-success' : 'text-danger'}`}>
                    {fees?.fees?.feeStatus || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid Content */}
          <div className="row g-4">
            {/* Teacher Remarks */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Teacher Remarks</h5>
                  {detailLoading ? (
                    <div className="d-flex justify-content-center align-items-center py-4">
                      <div className="spinner-border spinner-border-sm text-secondary me-2" role="status"></div>
                      <span className="text-muted">Loading remarks...</span>
                    </div>
                  ) : (
                    <div className="bg-light p-4 rounded-3 text-secondary" style={{ fontStyle: "italic", borderLeft: "4px solid #0d6efd" }}>
                      "{report?.teacherRemarks || "No remarks available at this time."}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Students List */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Linked Students</h5>
                  <div className="d-flex flex-column gap-2">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        className={`btn text-start p-3 border rounded-3 transition-all ${
                          student.id === selectedStudentId 
                            ? "border-primary bg-primary bg-opacity-10 shadow-sm" 
                            : "border-light bg-white hover-bg-light"
                        }`}
                        onClick={() => setSelectedStudentId(student.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className={`fw-bold ${student.id === selectedStudentId ? "text-primary" : "text-dark"}`}>
                              {student.name}
                            </div>
                            <div className="small text-muted mt-1">
                              {student.studentId} | Class {student.className} {student.section ? `| Sec ${student.section}` : ""}
                            </div>
                          </div>
                          {student.id === selectedStudentId && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-primary bi bi-check-circle-fill" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Student Contact Profile */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Student Contact Profile</h5>
                  <ul className="list-unstyled mb-4">
                    <li className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Student ID</span>
                      <span className="fw-semibold text-dark">{selectedStudent?.studentId || "-"}</span>
                    </li>
                    <li className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Email Address</span>
                      <span className="fw-semibold text-dark">{selectedStudent?.email || "-"}</span>
                    </li>
                    <li className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Access Level</span>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold border">
                        {selectedStudent?.accessLevel || "view_only"}
                      </span>
                    </li>
                  </ul>
                  <a href="/parent/profile" className="btn btn-outline-primary px-4 rounded-pill">
                    View Full Profile
                  </a>
                </div>
              </div>
            </div>

            {/* Performance Snapshot */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Performance Snapshot</h5>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Exam Average</span>
                      <span className="fw-bold small">{report?.academicPerformance?.averagePercentage || 0}%</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div className="progress-bar bg-primary rounded-pill" role="progressbar" style={{ width: `${report?.academicPerformance?.averagePercentage || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Assignments Submitted</span>
                      <span className="fw-bold small">{report?.assignments?.submissionRate || 0}%</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div className="progress-bar bg-success rounded-pill" role="progressbar" style={{ width: `${report?.assignments?.submissionRate || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">LMS Progress</span>
                      <span className="fw-bold small">{report?.lms?.completionRate || 0}%</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div className="progress-bar bg-info rounded-pill" role="progressbar" style={{ width: `${report?.lms?.completionRate || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-light p-3 rounded-3 d-flex justify-content-between align-items-center border">
                    <span className="text-muted fw-medium">Current Fee Status</span>
                    <span className={`fw-bold ${fees?.fees?.feeStatus === 'Paid' ? 'text-success' : 'text-danger'}`}>
                      {fees?.fees?.feeStatus || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}