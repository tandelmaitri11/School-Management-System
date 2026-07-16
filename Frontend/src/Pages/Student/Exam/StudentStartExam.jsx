import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
  success: "#10b981", // Emerald
  successLight: "#ecfdf5",
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  dangerLight: "#fef2f2",
  info: "#3b82f6", // Blue
  bg: "#f8fafc", // Slate 50
  surface: "#ffffff",
  textMain: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#e2e8f0" // Slate 200
};

// --- SAAS UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
  }

  /* Sticky Glass Header */
  .saas-glass-header {
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid ${colors.border};
    z-index: 1020;
  }

  /* Progress Bar */
  .saas-progress-bg {
    background-color: #e2e8f0;
    border-radius: 999px;
    height: 8px;
    overflow: hidden;
  }
  .saas-progress-fill {
    height: 100%;
    border-radius: 999px;
    background-color: ${colors.primary};
    transition: width 0.4s ease;
  }

  /* Custom Radio Selection Panels */
  .saas-radio-panel {
    display: flex;
    align-items: center;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    border: 1px solid ${colors.border};
    background-color: ${colors.surface};
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .saas-radio-panel:hover {
    background-color: ${colors.bg};
    border-color: #cbd5e1;
  }
  .saas-radio-panel.selected {
    background-color: ${colors.primaryLight};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 1px ${colors.primary};
  }
  
  /* Custom Radio Circle */
  .saas-radio-circle {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  .saas-radio-panel.selected .saas-radio-circle {
    border-color: ${colors.primary};
  }
  .saas-radio-panel.selected .saas-radio-circle::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${colors.primary};
  }
  
  /* Hidden default input */
  .saas-radio-input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  /* Buttons */
  .btn-saas {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-weight: 600;
  }
  .btn-saas:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
  }
  .pulse-danger {
    animation: pulseDanger 2s infinite;
  }
  @keyframes pulseDanger {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
`;

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

  if (loading) return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
      <div className="spinner-border mb-3" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} role="status"></div>
      <p className="mt-2 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Preparing Exam Environment...</p>
    </div>
  );

  if (!exam) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
       <div className="saas-card p-5 text-center">
          <i className="bi bi-file-earmark-x fs-1 mb-3 d-block" style={{ color: colors.textMuted, opacity: 0.5 }}></i>
          <h5 className="fw-semibold" style={{ color: colors.textMain }}>Exam data unavailable</h5>
       </div>
    </div>
  );

  const isTimeCritical = timeLeft < 60000; // Less than 1 minute

  return (
    <div className="pb-5 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* --- Sticky Glass Header --- */}
      <div className="sticky-top saas-glass-header shadow-sm">
        <div className="container-fluid px-4 px-xl-5 py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
             
             <div>
               <h4 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>{exam.title}</h4>
               <span className="badge rounded-pill fw-medium px-3 py-1" style={{ backgroundColor: colors.bg, color: colors.textMuted, border: `1px solid ${colors.border}` }}>
                 {exam.subjectName}
               </span>
             </div>

             <div className="d-flex align-items-center gap-4">
               {/* Progress Area */}
               <div className="d-none d-lg-block" style={{ width: '200px' }}>
                 <div className="d-flex justify-content-between small mb-1 fw-medium" style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                   <span>{attemptedCount} of {exam.questions.length} Answered</span>
                   <span style={{ color: colors.primary }}>{progressPct}%</span>
                 </div>
                 <div className="saas-progress-bg">
                   <div className="saas-progress-fill" style={{ width: `${progressPct}%` }}></div>
                 </div>
               </div>

               {/* Timer Badge */}
               <div 
                 className={`d-flex align-items-center px-4 py-2 rounded-pill fw-bold ${isTimeCritical ? 'pulse-danger' : ''}`}
                 style={{ 
                   backgroundColor: isTimeCritical ? colors.dangerLight : colors.textMain, 
                   color: isTimeCritical ? colors.danger : '#ffffff',
                   border: isTimeCritical ? `1px solid rgba(239,68,68,0.3)` : 'none'
                 }}
               >
                  <i className="bi bi-stopwatch me-2 fs-5"></i>
                  <span className="fs-5" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '1px' }}>
                    {formatTime(timeLeft)}
                  </span>
               </div>
             </div>

          </div>

          {/* Mobile Progress Bar (Visible only on small screens) */}
          <div className="d-block d-lg-none mt-3">
            <div className="d-flex justify-content-between small mb-1 fw-medium" style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
              <span>{attemptedCount} of {exam.questions.length} Answered</span>
              <span style={{ color: colors.primary }}>{progressPct}%</span>
            </div>
            <div className="saas-progress-bg">
              <div className="saas-progress-fill" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="container-fluid px-4 px-xl-5 mt-5 d-flex justify-content-center">
        {/* Constrain width for readability */}
        <div className="w-100" style={{ maxWidth: '800px' }}>
          
          {exam.questions.map((q, i) => (
            <div className="saas-card mb-4" key={q._id}>
              <div className="p-4 p-md-5">
                
                {/* Question Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: colors.border }}>
                  <span className="badge rounded-pill fw-bold px-3 py-2" style={{ backgroundColor: colors.primaryLight, color: colors.primary }}>
                    Question {i + 1}
                  </span>
                  <span className="fw-semibold small" style={{ color: colors.textMuted }}>
                    {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
                
                {/* Question Text */}
                <h5 className="fw-semibold mb-4 lh-base" style={{ color: colors.textMain, fontSize: '1.15rem' }}>
                  {q.questionText}
                </h5>

                {/* Options List */}
                <div className="d-flex flex-column gap-3">
                  {q.options.map((opt, idx) => {
                    const isSelected = (answers[q._id] || "") === opt;
                    
                    return (
                      <label 
                        key={idx} 
                        className={`saas-radio-panel ${isSelected ? 'selected' : ''}`}
                      >
                        <input 
                          type="radio" 
                          name={q._id} 
                          className="saas-radio-input" 
                          checked={isSelected} 
                          onChange={() => handleSelect(q._id, opt)}
                        />
                        <div className="saas-radio-circle"></div>
                        <span className="fw-medium" style={{ color: isSelected ? colors.primary : colors.textMain, fontSize: '0.95rem' }}>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>

              </div>
            </div>
          ))}

          {/* --- Submit Block --- */}
          <div className="saas-card p-5 text-center mt-5 mb-5" style={{ backgroundColor: '#ffffff' }}>
             <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3" style={{ backgroundColor: colors.successLight, color: colors.success }}>
               <i className="bi bi-flag-fill fs-2"></i>
             </div>
             <h4 className="fw-bold mb-2" style={{ color: colors.textMain }}>Ready to finish?</h4>
             <p className="small mb-4" style={{ color: colors.textMuted }}>
               Please review your answers before submitting. You cannot change them after submission.
             </p>
             <button 
               onClick={handleSubmit} 
               className="btn btn-saas rounded-pill px-5 py-3 fs-6 d-inline-flex align-items-center justify-content-center"
               style={{ backgroundColor: colors.success, color: '#ffffff', border: 'none', minWidth: '250px' }}
             >
               <i className="bi bi-check2-circle me-2 fs-5"></i> Submit Exam
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}