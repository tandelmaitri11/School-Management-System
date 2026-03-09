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

    const totalStudents = results.length;
    const highest = Math.max(...results.map(r => r.obtainedMarks));
    const average =
      (
        results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents
      ).toFixed(2);

    return { totalStudents, highest, average };
  }, [results]);

  if (loading) {
    return <div className="p-4 text-center">Loading results...</div>;
  }

  return (
    <div className="container py-4">
      {/* Back */}
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

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
          <div className="col-md-4 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Students Appeared</h6>
                <h3 className="fw-bold">{stats.totalStudents}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Highest Marks</h6>
                <h3 className="fw-bold">
                  {stats.highest} / {exam.totalMarks}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-2">
            <div className="card text-center shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Average %</h6>
                <h3 className="fw-bold">{stats.average}%</h3>
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
                <th>Marks</th>
                <th>Percentage</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, index) => (
                <tr key={r.studentId}>
                  <td className="fw-bold">
                    {index + 1}
                    {index === 0 && " 🥇"}
                    {index === 1 && " 🥈"}
                    {index === 2 && " 🥉"}
                  </td>

                  <td>{r.studentName}</td>

                  <td className="fw-bold">
                    {r.obtainedMarks} / {exam.totalMarks}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        r.percentage >= 40 ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {r.percentage}%
                    </span>
                  </td>

                  <td>
                    {new Date(r.submittedAt).toLocaleString()}
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
