import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function ParentPerformance() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

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
    const loadReport = async () => {
      if (!selectedStudentId) return;
      try {
        setDetailLoading(true);
        const res = await api.get(`/api/parent/student/${selectedStudentId}/report`);
        setReport(res.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load report");
      } finally {
        setDetailLoading(false);
      }
    };
    loadReport();
  }, [selectedStudentId]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-medium">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-md-4 bg-light min-vh-100">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
              <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z"/>
            </svg>
            Performance Report
          </h2>
          <div className="text-secondary fw-medium">Academic, assignment, LMS, and teacher feedback summary.</div>
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
        <div className="alert alert-danger shadow-sm border-0 border-start border-danger border-4 rounded-3 d-flex align-items-center gap-3 mb-4">
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
      ) : detailLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-3 text-muted fw-medium">Loading report details...</span>
        </div>
      ) : !report ? (
        <div className="alert alert-info shadow-sm border-0 border-start border-info border-4 rounded-3 d-flex align-items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-info-circle-fill flex-shrink-0" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          <div>No performance report data is available for this student currently.</div>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="row g-4 mb-4">
            {/* Overall Score */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Overall Score</div>
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <div className="fw-bold fs-3 text-dark">{report.overallResult?.score || 0}</div>
                    <div className="small fw-medium text-muted bg-light px-2 py-1 rounded border">
                      {report.overallResult?.label || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Average */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Exam Average</div>
                    <div className="bg-info bg-opacity-10 text-info p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2zm1 12h2V2h-2v12zm-3 0V7H7v7h2zm-5 0v-3H2v3h2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-dark">{report.academicPerformance?.averagePercentage || 0}%</div>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
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
                  <div className="fw-bold fs-3 text-dark">{report.attendance?.percentage || 0}%</div>
                </div>
              </div>
            </div>

            {/* Assignment Submission */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Assignments</div>
                    <div className="bg-warning bg-opacity-10 text-warning p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-dark">{report.assignments?.submissionRate || 0}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Teacher Remarks */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3 d-flex align-items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                      <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z"/>
                      <path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                    Teacher Remarks
                  </h5>
                  <div className="bg-light p-4 rounded-3 text-secondary" style={{ fontStyle: "italic", borderLeft: "4px solid #0d6efd" }}>
                    "{report.teacherRemarks || "No remarks available at this time."}"
                  </div>
                </div>
              </div>
            </div>

            {/* AI Performance Insight */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden">
                {/* Decorative background element for AI */}
                <div className="position-absolute top-0 end-0 p-3 opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="text-info" viewBox="0 0 16 16">
                    <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.889a28.02 28.02 0 0 1 3.94 0C10.765 5.765 12 6.76 12 8.062v1.156a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 9.218V8.062Z"/>
                    <path d="M8 0a7.96 7.96 0 0 0-4.075 1.114q-.245.148-.487.31A8.004 8.004 0 0 0 0 8a8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-3.438-6.575q-.242-.162-.487-.31A7.96 7.96 0 0 0 8 0Zm4.5 5.064c.315.154.615.334.896.536A6.983 6.983 0 0 1 15 8a6.983 6.983 0 0 1-1.604 4.4A6.981 6.981 0 0 1 8 15a6.981 6.981 0 0 1-5.396-2.6A6.983 6.983 0 0 1 1 8a6.983 6.983 0 0 1 1.604-4.4c.281-.202.58-.382.896-.536A7.05 7.05 0 0 1 8 1a7.05 7.05 0 0 1 4.5 2.064Z"/>
                  </svg>
                </div>

                <div className="card-body p-4 position-relative z-1">
                  <h5 className="fw-bold text-dark mb-3 border-bottom pb-3 d-flex align-items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-info" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.732 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    </svg>
                    AI Performance Insight
                  </h5>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="text-muted fw-medium small">Risk Level:</span>
                    <span className={`badge px-3 py-2 rounded-pill ${
                      report.aiInsights?.riskLevel === 'High' ? 'bg-danger bg-opacity-10 text-danger border border-danger-subtle' :
                      report.aiInsights?.riskLevel === 'Medium' ? 'bg-warning bg-opacity-10 text-warning border border-warning-subtle' :
                      'bg-success bg-opacity-10 text-success border border-success-subtle'
                    }`}>
                      {report.aiInsights?.riskLevel || "Low"}
                    </span>
                  </div>
                  <p className="mb-0 text-secondary" style={{ lineHeight: "1.6" }}>
                    {report.aiInsights?.summary || "No AI insight available for this reporting period."}
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3 d-flex align-items-center gap-2">
                    <div className="bg-success bg-opacity-10 p-1 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                        <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01-.622-.636zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708z"/>
                      </svg>
                    </div>
                    Strengths
                  </h5>
                  {report.strengthsAndImprovements?.strengths?.length > 0 ? (
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                      {report.strengthsAndImprovements.strengths.map((item, index) => (
                        <li key={index} className="d-flex align-items-start gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-success mt-1 flex-shrink-0" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M10.854 3.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 5.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                          <span className="text-secondary">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted small">No specific strengths highlighted yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3 d-flex align-items-center gap-2">
                    <div className="bg-warning bg-opacity-10 p-1 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-warning" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                      </svg>
                    </div>
                    Needs Improvement
                  </h5>
                  {report.strengthsAndImprovements?.improvements?.length > 0 ? (
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                      {report.strengthsAndImprovements.improvements.map((item, index) => (
                        <li key={index} className="d-flex align-items-start gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-warning mt-1 flex-shrink-0" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                          </svg>
                          <span className="text-secondary">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted small">No specific areas for improvement highlighted.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-3">Attendance Details</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase text-muted">
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.attendance?.details?.length ? (
                      report.attendance.details.map((row, idx) => (
                        <tr key={idx}>
                          <td>{formatDate(row.date)}</td>
                          <td>
                            <span className={`badge ${row.status === "Present" ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-muted text-center py-3">No attendance records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Exam Results */}
          <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-3">Exam Results</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase text-muted">
                      <th>Date</th>
                      <th>Exam</th>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.academicPerformance?.details?.length ? (
                      report.academicPerformance.details.map((row, idx) => (
                        <tr key={idx}>
                          <td>{formatDate(row.date)}</td>
                          <td>{row.title}</td>
                          <td>{row.subject}</td>
                          <td>{row.obtainedMarks || 0} / {row.totalMarks || 0}</td>
                          <td>{row.percentage || 0}%</td>
                          <td>{row.grade || "-"}</td>
                          <td>
                            <span className={`badge ${row.resultStatus === "PASS" ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}>
                              {row.resultStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-muted text-center py-3">No exam results found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-3">Assignments</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase text-muted">
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Due Date</th>
                      <th>Submitted At</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.assignments?.details?.length ? (
                      report.assignments.details.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.title}</td>
                          <td>{row.subject || "-"}</td>
                          <td>{formatDate(row.dueDate)}</td>
                          <td>{formatDate(row.submittedAt)}</td>
                          <td>{row.grade || "Not Graded"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-muted text-center py-3">No assignments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* LMS Progress & Fees */}
          <div className="row g-4 mt-1">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-3">LMS Progress</h5>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Completion Rate</div>
                      <div className="fw-bold fs-4">{report.lms?.completionRate || 0}%</div>
                    </div>
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Average Progress</div>
                      <div className="fw-bold fs-4">{report.lms?.averageProgress || 0}%</div>
                    </div>
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Materials Completed</div>
                      <div className="fw-bold fs-4">{report.lms?.completedMaterials || 0} / {report.lms?.totalMaterials || 0}</div>
                    </div>
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Watch Time (sec)</div>
                      <div className="fw-bold fs-4">{report.lms?.totalWatchSeconds || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-3">Fee Status</h5>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Total Fees</div>
                      <div className="fw-bold fs-4">₹{report.feeStatus?.totalFees || 0}</div>
                    </div>
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Paid</div>
                      <div className="fw-bold fs-4">₹{report.feeStatus?.paidAmount || 0}</div>
                    </div>
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Pending</div>
                      <div className="fw-bold fs-4">₹{report.feeStatus?.pendingAmount || 0}</div>
                    </div>
                    <div className="bg-light rounded-3 p-3 flex-grow-1">
                      <div className="text-muted small">Status</div>
                      <div className="fw-bold fs-4">{report.feeStatus?.status || "N/A"}</div>
                    </div>
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
