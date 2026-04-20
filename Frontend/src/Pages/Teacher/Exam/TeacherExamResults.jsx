import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { useParams, useNavigate } from "react-router-dom";

const TeacherExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get(`/api/teachers/exam-results/${examId}`);
        setExam(res.data.exam);
        setResults(res.data.results || []);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load results");
        navigate("/teacher/exams");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId, navigate]);

  /* ================= CALCULATIONS ================= */
  const stats = useMemo(() => {
    if (!results.length) return null;

    const submittedRows = results.filter((r) => String(r.attendanceStatus || "").toUpperCase() === "SUBMITTED");
    const notSubmittedRows = results.filter((r) => String(r.attendanceStatus || "").toUpperCase() === "NOT_SUBMITTED");
    const evaluatedRows = results.filter((r) => {
      const status = String(r.attendanceStatus || "").toUpperCase();
      return status === "SUBMITTED" || status === "ABSENT";
    });
    const totalStudents = results.length;
    const submittedCount = submittedRows.length;
    const highest = evaluatedRows.length ? Math.max(...evaluatedRows.map((r) => Number(r.obtainedMarks || 0))) : 0;
    const average = evaluatedRows.length
      ? (
          evaluatedRows.reduce((sum, r) => sum + Number(r.percentage || 0), 0) / evaluatedRows.length
        ).toFixed(2)
      : "0.00";
    const passed = evaluatedRows.filter(
      (r) => String(r.resultStatus || "").toUpperCase() === "PASS" || Number(r.percentage) >= 40
    ).length;
    const passRate = evaluatedRows.length ? ((passed / evaluatedRows.length) * 100).toFixed(2) : "0.00";

    return {
      totalStudents,
      submittedCount,
      notSubmittedCount: notSubmittedRows.length,
      highest,
      average,
      passed,
      passRate,
      evaluatedCount: evaluatedRows.length,
    };
  }, [results]);

  if (loading) {
    return <div className="p-4 text-center">Loading results...</div>;
  }

  return (
    <div className="container py-4">
      {/* Back */}
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>{"<- Back"}</button>

      {/* Exam Header */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="fw-bold">{exam.title}</h4>
          <p className="mb-1">Subject: <b>{exam.subjectName}</b></p>
          <p className="mb-0">Total Marks: <b>{exam.totalMarks}</b></p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Eligible Students</h6>
                <h3 className="fw-bold">{stats.totalStudents}</h3>
                <div className="small text-muted">
                  {stats.submittedCount} Submitted
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Not Submitted</h6>
                <h3 className="fw-bold text-warning">{stats.notSubmittedCount}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Highest Marks</h6>
                <h3 className="fw-bold">
                  {stats.highest} / {exam.totalMarks}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Average %</h6>
                <h3 className="fw-bold">{stats.average}%</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Pass Rate</h6>
                <h3 className="fw-bold">{stats.passRate}%</h3>
                <div className="small text-muted">
                  {stats.passed} / {stats.evaluatedCount} Passed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {results.length === 0 ? (
        <div className="alert alert-warning text-center">
          No student has submitted this exam yet.
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Submission</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, index) => (
                <tr key={r.studentId}>
                  <td className="fw-bold">
                    {String(r.attendanceStatus || "").toUpperCase() === "NOT_SUBMITTED"
                      ? "-"
                      : index + 1}
                    {String(r.attendanceStatus || "").toUpperCase() !== "NOT_SUBMITTED" && index === 0 && " (Top 1)"}
                    {String(r.attendanceStatus || "").toUpperCase() !== "NOT_SUBMITTED" && index === 1 && " (Top 2)"}
                    {String(r.attendanceStatus || "").toUpperCase() !== "NOT_SUBMITTED" && index === 2 && " (Top 3)"}
                  </td>

                  <td>{r.studentName}</td>

                  <td>
                    <span
                      className={`badge ${
                        String(r.attendanceStatus || "").toUpperCase() === "SUBMITTED"
                          ? "bg-success"
                          : String(r.attendanceStatus || "").toUpperCase() === "ABSENT"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {String(r.attendanceStatus || "NOT_SUBMITTED").toUpperCase()}
                    </span>
                  </td>

                  <td className="fw-bold">
                    {r.obtainedMarks} / {exam.totalMarks}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        String(r.attendanceStatus || "").toUpperCase() === "NOT_SUBMITTED"
                          ? "bg-secondary"
                          : r.percentage >= 40
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    >
                      {r.percentage}%
                    </span>
                  </td>

                  <td className="fw-bold">{r.grade || "-"}</td>

                  <td>
                    <span
                      className={`badge ${
                        String(r.resultStatus || "").toUpperCase() === "NOT_SUBMITTED"
                          ? "bg-secondary"
                          : String(r.resultStatus || "").toUpperCase() === "PASS" || Number(r.percentage) >= 40
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    >
                      {String(r.resultStatus || (Number(r.percentage) >= 40 ? "PASS" : "FAIL")).toUpperCase()}
                    </span>
                  </td>

                  <td>
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherExamResults;