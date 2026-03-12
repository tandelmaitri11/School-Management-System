import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const normalizeUpper = (value) => String(value || "").trim().toUpperCase();
const formatSectionLabel = (value) => (normalizeUpper(value) === "BOTH" ? "Both" : normalizeUpper(value));

export default function StudentExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/student/exams");
        if (!res.data?.success) throw new Error(res.data?.message);
        setExams(res.data.exams || []);
      } catch (err) {
        setErrMsg(err.response?.data?.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(start.getTime() + Number(exam.duration || 0) * 60000);
    if (now < start) return "UPCOMING";
    if (now > end) return "ENDED";
    return "ONGOING";
  };

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
    [exams]
  );

  const StatusBadge = ({ status }) => {
    const styles = {
      UPCOMING: "bg-warning-subtle text-warning-emphasis",
      ONGOING: "bg-success-subtle text-success-emphasis animate-pulse",
      ENDED: "bg-secondary-subtle text-secondary",
    };
    return (
      <span className={`badge rounded-pill px-3 py-2 fw-normal ${styles[status] || "bg-light text-dark"}`}>
        {status === "ONGOING" && <span className="spinner-grow spinner-grow-sm me-2" style={{width:'.5rem', height:'.5rem'}}/>}
        {status}
      </span>
    );
  };

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"/></div>;

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container">
        
        {/* Header */}
        <div className="mb-5 text-center text-md-start border-bottom pb-4">
          <h2 className="fw-bold text-dark">Examinations </h2>
          <p className="text-muted">View your schedule and access your assessments.</p>
        </div>

        {errMsg && <div className="alert alert-danger rounded-3 border-0 shadow-sm">{errMsg}</div>}

        {sortedExams.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted">No exams scheduled at the moment.</h5>
          </div>
        ) : (
          <div className="row g-4">
            {sortedExams.map((e) => {
              const status = getStatus(e);
              const startObj = new Date(e.startTime);

              return (
                <div className="col-md-6 col-lg-4" key={e._id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-shadow transition-all" style={{transition: '0.3s'}}>
                    <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-start">
                      <div className="d-flex flex-column">
                        <span className="text-uppercase fw-bold text-muted small" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>{e.subjectName}</span>
                        <h5 className="fw-bold text-dark mb-0 mt-1 text-truncate" style={{maxWidth: '200px'}}>{e.title}</h5>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="card-body px-4">
                      <div className="small text-muted mb-3">
                        Class {e.className || "-"}
                        {e.section ? ` • Section ${formatSectionLabel(e.section)}` : ""}
                        {e.stream ? ` • ${e.stream}` : ""}
                      </div>
                      <div className="d-flex align-items-center mb-3">
                         <div className="bg-light rounded-circle p-2 me-3 text-primary"><i className="bi bi-calendar-event"></i></div>
                         <div>
                           <small className="text-muted d-block">Date & Time</small>
                           <span className="fw-medium text-dark">{startObj.toLocaleDateString()} • {startObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                      </div>
                      <div className="d-flex align-items-center">
                         <div className="bg-light rounded-circle p-2 me-3 text-primary"><i className="bi bi-clock-history"></i></div>
                         <div>
                           <small className="text-muted d-block">Duration</small>
                           <span className="fw-medium text-dark">{e.duration} Minutes</span>
                         </div>
                      </div>
                    </div>

                    <div className="card-footer bg-light border-0 p-4 pt-0">
                      <hr className="text-muted opacity-25 mb-3" />
                      
                      {/* Logic for Buttons */}
                      {status === "ONGOING" && !e.submitted && (
                        <button onClick={() => navigate(`/student/start-exam/${e._id}`)} className="btn btn-primary w-100 rounded-pill shadow-sm fw-bold py-2">
                           {e.attempted ? "Resume Exam" : "Start Exam"} <i className="bi bi-arrow-right ms-2"></i>
                        </button>
                      )}

                      {status === "ENDED" && e.submitted && (
                        <button onClick={() => navigate(`/student/exam-result/${e._id}`)} className="btn btn-outline-dark w-100 rounded-pill fw-medium py-2">
                           View Result
                        </button>
                      )}

                      {status === "ENDED" && !e.submitted && (
                        <div className="alert alert-danger text-center py-2 mb-0 rounded-pill small fw-bold">Missed / Not Submitted</div>
                      )}

                      {status === "UPCOMING" && (
                        <button disabled className="btn btn-light w-100 rounded-pill text-muted border py-2">
                          <i className="bi bi-lock me-2"></i> Locked
                        </button>
                      )}
                      
                      {/* Attempt Status Tag */}
                      {e.submitted && status !== "ENDED" && <div className="text-center mt-2 small text-success fw-bold"><i className="bi bi-check-circle me-1"></i> Submitted</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
