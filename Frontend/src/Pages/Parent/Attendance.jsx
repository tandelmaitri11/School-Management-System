import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

export default function ParentAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [attendance, setAttendance] = useState([]);
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
    const loadAttendance = async () => {
      if (!selectedStudentId) return;
      try {
        setDetailLoading(true);
        const res = await api.get(`/api/parent/student/${selectedStudentId}/attendance`);
        setAttendance(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load attendance");
      } finally {
        setDetailLoading(false);
      }
    };
    loadAttendance();
  }, [selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || null;
  const summary = useMemo(() => {
    const present = attendance.filter((row) => row.status === "Present").length;
    const absent = attendance.filter((row) => row.status === "Absent").length;
    const total = attendance.length;
    const percentage = total ? ((present / total) * 100).toFixed(2) : "0.00";
    return { present, absent, total, percentage };
  }, [attendance]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-medium">Loading attendance data...</div>
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
              <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
            Attendance
          </h2>
          <div className="text-secondary fw-medium">Track child attendance history and monthly consistency.</div>
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
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="row g-4 mb-4">
            {/* Student Info */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Student</div>
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-5 text-dark text-truncate mb-1">{selectedStudent?.name || "-"}</div>
                  <div className="small text-muted fw-medium">
                    Class {selectedStudent?.className || "-"} {selectedStudent?.section ? `| Sec ${selectedStudent.section}` : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance % */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Attendance %</div>
                    <div className="bg-info bg-opacity-10 text-info p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.9 9.9a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zM13.657 13.657a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM3.757 3.757a.5.5 0 0 1-.707 0L1.636 2.343a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-dark">{summary.percentage}%</div>
                </div>
              </div>
            </div>

            {/* Present */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Present Days</div>
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-success">{summary.present}</div>
                </div>
              </div>
            </div>

            {/* Absent */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Absent Days</div>
                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-danger">{summary.absent}</div>
                </div>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">Attendance History</h5>
              
              {detailLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  <span className="text-muted fw-medium">Loading records...</span>
                </div>
              ) : !attendance.length ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-calendar-x opacity-50" viewBox="0 0 16 16">
                      <path d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708z"/>
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    </svg>
                  </div>
                  <div className="text-muted fw-medium">No attendance records found for this student.</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-secondary fw-semibold rounded-start py-3 px-3">Date</th>
                        <th className="text-secondary fw-semibold py-3 px-3">Class</th>
                        <th className="text-secondary fw-semibold py-3 px-3">Section</th>
                        <th className="text-secondary fw-semibold py-3 px-3">Stream</th>
                        <th className="text-secondary fw-semibold rounded-end py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {attendance.map((row, index) => (
                        <tr key={`${row.date}-${index}`}>
                          <td className="px-3 py-3 fw-medium text-dark">{row.date || "-"}</td>
                          <td className="px-3 py-3 text-muted">{row.className || "-"}</td>
                          <td className="px-3 py-3 text-muted">{row.section || "-"}</td>
                          <td className="px-3 py-3 text-muted">
                            {row.stream ? <span className="badge bg-light text-dark border">{row.stream}</span> : "-"}
                          </td>
                          <td className="px-3 py-3">
                            {row.status === "Present" ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="me-1 mb-1" viewBox="0 0 16 16">
                                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                </svg>
                                Present
                              </span>
                            ) : (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2 py-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="me-1 mb-1" viewBox="0 0 16 16">
                                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                </svg>
                                {row.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}