import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function StudentExamResult() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/student/exam-result/${examId}`);
        if (!res.data?.success) throw new Error();
        setData(res.data);
      } catch (err) {
        navigate("/student/exams");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, navigate]);

  const computed = useMemo(() => {
    if (!data) return null;
    const total = Number(data.exam.totalMarks || 0);
    const obtained = Number(data.result.obtainedMarks || 0);
    const percentage = Number(data.result.percentage || 0);
    const pass = percentage >= 40;
    const resultStatus = String(data.result.resultStatus || (pass ? "PASS" : "FAIL")).toUpperCase();
    const grade = String(data.result.grade || (pass ? "D" : "F")).toUpperCase();
    return { total, obtained, percentage, pass, grade, resultStatus };
  }, [data]);

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"/></div>;
  if (!data) return null;

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container" style={{maxWidth: '700px'}}>
        
        <div className="card border-0 shadow rounded-4 overflow-hidden">
          {/* Header Banner */}
          <div className={`p-5 text-center text-white ${computed.pass ? 'bg-success' : 'bg-danger'}`}>
             <div className="mb-2 opacity-75 text-uppercase fw-bold small tracking-wide">Result Statement</div>
             <h1 className="display-4 fw-bold mb-0">{computed.resultStatus}</h1>
             <p className="mb-0 opacity-75 mt-2">You have {computed.pass ? "successfully cleared" : "not cleared"} the exam.</p>
          </div>

          <div className="card-body p-5">
             <div className="text-center mb-5">
                <h3 className="fw-bold text-dark">{data.exam.title}</h3>
                <span className="badge bg-light text-secondary border fw-normal px-3 py-2 mt-2">{data.exam.subjectName}</span>
             </div>

             <div className="row g-4 text-center mb-5">
                <div className="col-4">
                   <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block text-uppercase" style={{fontSize: '0.7rem', fontWeight: 'bold'}}>Score</small>
                      <span className="fs-3 fw-bold text-primary">{computed.obtained}</span>
                      <span className="text-muted small">/{computed.total}</span>
                   </div>
                </div>
                <div className="col-4">
                   <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block text-uppercase" style={{fontSize: '0.7rem', fontWeight: 'bold'}}>Percentage</small>
                      <span className="fs-3 fw-bold text-dark">{computed.percentage}%</span>
                   </div>
                </div>
                <div className="col-4">
                   <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block text-uppercase" style={{fontSize: '0.7rem', fontWeight: 'bold'}}>Grade</small>
                      <span className={`fs-3 fw-bold ${computed.pass ? 'text-success' : 'text-danger'}`}>
                        {computed.grade}
                      </span>
                   </div>
                </div>
             </div>

             {/* Performance Bar */}
             <div className="mb-5">
                <div className="d-flex justify-content-between small text-muted mb-2 fw-bold">
                   <span>Performance Analysis</span>
                </div>
                <div className="progress" style={{height: '10px'}}>
                   <div 
                      className={`progress-bar ${computed.pass ? 'bg-success' : 'bg-danger'}`} 
                      style={{width: `${Math.max(0, Math.min(100, computed.percentage))}%`}}
                   ></div>
                </div>
                <div className="d-flex justify-content-between mt-2 small text-muted">
                   <span>0%</span>
                   <span>50%</span>
                   <span>100%</span>
                </div>
             </div>

             <div className="text-center border-top pt-4">
                <p className="text-muted small mb-4">Submitted on: {new Date(data.result.submittedAt).toLocaleString()}</p>
                <button onClick={() => navigate("/student/exams")} className="btn btn-dark rounded-pill px-5 fw-bold">
                   Back to Exams
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
