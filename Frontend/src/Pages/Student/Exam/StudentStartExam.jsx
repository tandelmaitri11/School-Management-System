import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function StudentStartExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const didFetch = useRef(false);
  const autoSubmitted = useRef(false);

  // --- LOGIC REMAINS SAME ---
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const start = async () => {
      try {
        const res = await api.get(`/api/student/start-exam/${examId}`);
        if (res.data?.alreadySubmitted) {
          alert("Already submitted!");
          navigate(`/student/exam-result/${examId}`);
          return;
        }
        setExam(res.data.exam);
        setTimeLeft(res.data.remainingTimeMs || 0);
      } catch (err) {
        alert("Cannot start exam");
        navigate("/student/exams");
      } finally {
        setLoading(false);
      }
    };
    start();
  }, [examId, navigate]);

  useEffect(() => {
    if (!timeLeft || autoSubmitted.current) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(t);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const handleSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const submitExam = async () => {
    const payload = {
      answers: exam.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || "",
      })),
    };
    await api.post(`/api/student/submit-exam/${examId}`, payload);
  };

  const handleAutoSubmit = async () => {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    try {
      await submitExam();
      navigate(`/student/exam-result/${examId}`);
    } catch {
      navigate("/student/exams");
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to finish the exam?")) return;
    try {
      await submitExam();
      navigate(`/student/exam-result/${examId}`);
    } catch (err) {
      alert("Submit failed");
    }
  };

  const formatTime = (ms) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const attemptedCount = useMemo(() => exam?.questions?.reduce((acc, q) => acc + (answers[q._id] ? 1 : 0), 0) || 0, [answers, exam]);
  const progressPct = useMemo(() => exam?.questions?.length ? Math.round((attemptedCount / exam.questions.length) * 100) : 0, [attemptedCount, exam]);

  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"/></div>;
  if (!exam) return <div className="p-5 text-center">Exam data unavailable.</div>;

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Sticky Header */}
      <div className="sticky-top bg-white shadow-sm border-bottom">
        <div className="container py-3">
          <div className="d-flex justify-content-between align-items-center">
             <div>
               <h5 className="fw-bold mb-0 text-dark">{exam.title}</h5>
               <small className="text-muted">{exam.subjectName}</small>
             </div>
             <div className={`d-flex align-items-center px-4 py-2 rounded-pill ${timeLeft < 60000 ? 'bg-danger text-white' : 'bg-dark text-white'}`}>
                <i className="bi bi-stopwatch me-2"></i>
                <span className="fw-bold fs-5" style={{fontVariantNumeric: 'tabular-nums'}}>{formatTime(timeLeft)}</span>
             </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3">
             <div className="d-flex justify-content-between small text-muted mb-1">
               <span>Progress: {attemptedCount} / {exam.questions.length} attempted</span>
               <span>{progressPct}%</span>
             </div>
             <div className="progress" style={{height: '6px'}}>
               <div className="progress-bar bg-success" role="progressbar" style={{width: `${progressPct}%`}}></div>
             </div>
          </div>
        </div>
      </div>

      <div className="container mt-4" style={{maxWidth: '800px'}}>
        {exam.questions.map((q, i) => (
          <div className="card border-0 shadow-sm rounded-4 mb-4" key={q._id}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between mb-3">
                <span className="badge bg-light text-secondary border fw-normal">Question {i + 1}</span>
                <span className="text-muted small fw-bold">{q.marks} Marks</span>
              </div>
              
              <h5 className="fw-medium mb-4 text-dark lh-base">{q.questionText}</h5>

              <div className="d-flex flex-column gap-2">
                {q.options.map((opt, idx) => {
                  const isSelected = (answers[q._id] || "") === opt;
                  return (
                    <label 
                      key={idx} 
                      className={`d-flex align-items-center p-3 rounded-3 border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary-subtle' : 'bg-white hover-bg-light'}`}
                      style={{cursor: 'pointer', transition: '0.2s'}}
                    >
                      <input 
                        type="radio" 
                        name={q._id} 
                        className="form-check-input me-3 mt-0" 
                        checked={isSelected} 
                        onChange={() => handleSelect(q._id, opt)}
                        style={{transform: 'scale(1.2)'}}
                      />
                      <span className={isSelected ? 'text-primary fw-medium' : 'text-dark'}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <div className="card border-0 shadow-sm rounded-4 p-4 text-center mt-5">
           <h5 className="mb-3">All done?</h5>
           <p className="text-muted small mb-4">Please review your answers before submitting. You cannot change them after submission.</p>
           <button onClick={handleSubmit} className="btn btn-success btn-lg rounded-pill px-5 fw-bold shadow-sm">
             <i className="bi bi-check-circle-fill me-2"></i> Submit Exam
           </button>
        </div>
      </div>
    </div>
  );
}