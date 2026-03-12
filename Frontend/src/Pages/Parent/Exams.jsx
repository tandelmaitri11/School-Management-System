import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const normalizeUpper = (value) => String(value || "").trim().toUpperCase();
const formatSectionLabel = (value) => (normalizeUpper(value) === "BOTH" ? "Both" : normalizeUpper(value));

export default function ParentExams() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [exams, setExams] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
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
    const loadExams = async () => {
      if (!selectedStudentId) {
        setExams([]);
        setSelectedResult(null);
        return;
      }

      try {
        setDetailLoading(true);
        setSelectedResult(null);
        const res = await api.get(`/api/parent/student/${selectedStudentId}/exams`);
        setExams(res.data?.exams || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load exams");
      } finally {
        setDetailLoading(false);
      }
    };
    loadExams();
  }, [selectedStudentId]);

  const loadResult = async (examId) => {
    try {
      setResultLoading(true);
      const res = await api.get(`/api/parent/student/${selectedStudentId}/exam-result/${examId}`);
      setSelectedResult(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Result not available");
      setSelectedResult(null);
    } finally {
      setResultLoading(false);
    }
  };

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
    [exams]
  );

  const getStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(start.getTime() + Number(exam.duration || 0) * 60000);
    if (now < start) return "UPCOMING";
    if (now > end) return "ENDED";
    return "ONGOING";
  };

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || null;

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted fw-medium">Loading exams data...</div>
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
              <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
              <path d="M4.5 10a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Exam Details
          </h2>
          <div className="text-secondary fw-medium">View child exam schedule, submission status, and results.</div>
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
            <div className="col-12 col-md-4">
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
                    {selectedStudent?.studentId || "-"} | Class {selectedStudent?.className || "-"}
                    {selectedStudent?.section ? ` | Sec ${selectedStudent.section}` : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Exams */}
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Total Exams</div>
                    <div className="bg-info bg-opacity-10 text-info p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                        <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-dark">{sortedExams.length}</div>
                </div>
              </div>
            </div>

            {/* Submitted Results */}
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>Submitted Results</div>
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="fw-bold fs-3 text-success">
                    {sortedExams.filter((exam) => exam.attendanceStatus === "SUBMITTED").length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Exam List Table */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 rounded-4 h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">Exam List</h5>
                  {detailLoading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      <span className="text-muted fw-medium">Loading exams...</span>
                    </div>
                  ) : !sortedExams.length ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="opacity-50" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      </div>
                      <div className="text-muted fw-medium">No exams found for this student.</div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-secondary fw-semibold rounded-start py-3 px-3">Exam & Schedule</th>
                            <th className="text-secondary fw-semibold py-3 px-3">Status</th>
                            <th className="text-secondary fw-semibold py-3 px-3">Submission</th>
                            <th className="text-secondary fw-semibold rounded-end py-3 px-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="border-top-0">
                          {sortedExams.map((exam) => {
                            const status = getStatus(exam);
                            const canViewResult =
                              exam.attendanceStatus === "SUBMITTED" || exam.attendanceStatus === "ABSENT";

                            // Setup Badge Colors based on Exam Status
                            const statusColor = 
                              status === "UPCOMING" ? "bg-warning text-dark border-warning-subtle" :
                              status === "ONGOING" ? "bg-primary bg-opacity-10 text-primary border-primary-subtle" :
                              "bg-secondary bg-opacity-10 text-secondary border-secondary-subtle";

                            // Setup Badge Colors based on Submission Status
                            const subColor = 
                              exam.attendanceStatus === "SUBMITTED" ? "bg-success bg-opacity-10 text-success border-success-subtle" :
                              exam.attendanceStatus === "ABSENT" ? "bg-danger bg-opacity-10 text-danger border-danger-subtle" :
                              "bg-light text-dark border-light";

                            return (
                              <tr key={exam._id} className="transition-all">
                                <td className="px-3 py-3">
                                  <div className="fw-bold text-dark">{exam.title}</div>
                                  <div className="small text-muted mt-1">
                                    <span className="fw-medium">{exam.subjectName}</span> | {new Date(exam.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </div>
                                  <div className="small text-muted">
                                    Class {exam.className || "-"}
                                    {exam.section ? ` | Section ${formatSectionLabel(exam.section)}` : ""}
                                    {exam.stream ? ` | ${exam.stream}` : ""}
                                  </div>
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`badge border px-2 py-1 ${statusColor}`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`badge border px-2 py-1 ${subColor}`}>
                                    {exam.attendanceStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  {canViewResult ? (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-medium transition-all shadow-sm"
                                      onClick={() => loadResult(exam._id)}
                                    >
                                      View Result
                                    </button>
                                  ) : (
                                    <span className="badge bg-light text-muted fw-medium border px-3 py-2 rounded-pill">
                                      Not Available
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Result Details Panel */}
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-white">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">Result Details</h5>
                  
                  {resultLoading ? (
                    <div className="d-flex flex-column justify-content-center align-items-center py-5">
                      <div className="spinner-border text-primary mb-3" role="status"></div>
                      <span className="text-muted fw-medium">Loading result data...</span>
                    </div>
                  ) : !selectedResult ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="opacity-25" viewBox="0 0 16 16">
                          <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
                          <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 2.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5z"/>
                        </svg>
                      </div>
                      <div className="text-muted fw-medium px-4">Choose an exam result from the list to view its detailed breakdown.</div>
                    </div>
                  ) : (
                    <div className="fade-in">
                      <div className="mb-4">
                        <div className="fw-bold fs-5 text-dark">{selectedResult.exam?.title || "-"}</div>
                        <div className="text-secondary d-flex align-items-center gap-2 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          <span className="small fw-medium">{selectedResult.exam?.subjectName || "-"}</span>
                        </div>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-4">
                          <div className="p-3 bg-primary bg-opacity-10 border border-primary-subtle rounded-4 text-center h-100 d-flex flex-column justify-content-center">
                            <div className="small text-primary fw-semibold mb-1">Score</div>
                            <div className="fw-bold text-dark fs-5">
                              {selectedResult.result?.obtainedMarks || 0} <span className="text-muted fs-6 fw-medium">/ {selectedResult.exam?.totalMarks || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-3 bg-info bg-opacity-10 border border-info-subtle rounded-4 text-center h-100 d-flex flex-column justify-content-center">
                            <div className="small text-info fw-semibold mb-1">Percentage</div>
                            <div className="fw-bold text-dark fs-5">{selectedResult.result?.percentage || 0}%</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-3 bg-success bg-opacity-10 border border-success-subtle rounded-4 text-center h-100 d-flex flex-column justify-content-center">
                            <div className="small text-success fw-semibold mb-1">Grade</div>
                            <div className="fw-bold text-dark fs-5">{selectedResult.result?.grade || "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-light rounded-4 p-4 border">
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                          <li className="d-flex justify-content-between align-items-center">
                            <span className="text-muted fw-medium">Final Result</span>
                            <span className={`badge rounded-pill px-3 py-2 ${
                              selectedResult.result?.resultStatus === 'PASS' ? 'bg-success' : 
                              selectedResult.result?.resultStatus === 'FAIL' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {selectedResult.result?.resultStatus || "-"}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center">
                            <span className="text-muted fw-medium">Submission</span>
                            <span className="fw-bold text-dark">{selectedResult.result?.attendanceStatus || "-"}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center">
                            <span className="text-muted fw-medium">Submitted At</span>
                            <span className="small fw-semibold text-dark text-end">
                              {selectedResult.result?.submittedAt
                                ? new Date(selectedResult.result.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                                : "-"}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
