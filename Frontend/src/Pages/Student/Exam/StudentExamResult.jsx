import React, { useEffect, useMemo, useState } from "react";
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
  successGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  warning: "#f59e0b", // Amber
  warningLight: "#fffbeb",
  danger: "#ef4444", // Red
  dangerLight: "#fef2f2",
  dangerGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  info: "#3b82f6", // Blue
  infoLight: "#eff6ff",
  bg: "#f8fafc", // Slate 50
  surface: "#ffffff",
  textMain: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#e2e8f0" // Slate 200
};

// --- SAAS UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.5s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 20px;
    border: 1px solid ${colors.border};
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  }

  /* Stat Boxes */
  .stat-box {
    background-color: ${colors.bg};
    border: 1px solid ${colors.border};
    border-radius: 16px;
    padding: 1.5rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .stat-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    border-color: #cbd5e1;
  }

  /* Progress Bar */
  .saas-progress-bg {
    background-color: #e2e8f0;
    border-radius: 999px;
    height: 12px;
    overflow: hidden;
  }
  .saas-progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Buttons */
  .btn-saas {
    transition: all 0.2s ease;
    font-weight: 600;
    padding: 0.75rem 2rem;
  }
  .btn-saas-outline {
    background-color: ${colors.surface};
    color: ${colors.textMain};
    border: 1px solid ${colors.border};
  }
  .btn-saas-outline:hover {
    background-color: ${colors.bg};
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  }

  .review-card {
    border: 1px solid ${colors.border};
    border-radius: 18px;
    background: ${colors.surface};
  }

  .option-pill {
    border: 1px solid ${colors.border};
    border-radius: 14px;
    background: ${colors.bg};
  }
`;

const getAnswerState = (option, question) => {
  const selected = String(question.selectedAnswer || "").trim();
  const correct = String(question.correctAnswer || "").trim();
  const current = String(option || "").trim();

  if (current === correct) {
    return {
      bg: colors.successLight,
      border: "rgba(16, 185, 129, 0.25)",
      text: colors.success,
      icon: "bi-check-circle-fill",
      label: "Correct answer",
    };
  }

  if (selected && current === selected && selected !== correct) {
    return {
      bg: colors.dangerLight,
      border: "rgba(239, 68, 68, 0.2)",
      text: colors.danger,
      icon: "bi-x-circle-fill",
      label: "Your wrong answer",
    };
  }

  return {
    bg: colors.bg,
    border: colors.border,
    text: colors.textMain,
    icon: "",
    label: "",
  };
};

export default function StudentExamResult() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- LOGIC (UNCHANGED) ---
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
    const questions = Array.isArray(data.questions) ? data.questions : [];
    const correctCount = questions.filter((q) => q.isCorrect).length;
    const wrongCount = questions.filter((q) => q.selectedAnswer && !q.isCorrect).length;
    const unansweredCount = questions.filter((q) => !q.selectedAnswer).length;
    return { total, obtained, percentage, pass, grade, resultStatus, correctCount, wrongCount, unansweredCount };
  }, [data]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border mb-3" style={{ color: colors.primary, width: '3rem', height: '3rem', borderWidth: '0.2em' }} role="status"></div>
        <p className="mt-2 fw-medium text-uppercase" style={{ color: colors.textMuted, letterSpacing: '1px', fontSize: '0.85rem' }}>Loading Results...</p>
      </div>
    );
  }
  
  if (!data) return null;

  return (
    <div className="pb-5 pt-4 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container, centering the result card */}
      <div className="container-fluid px-4 px-xl-5 d-flex justify-content-center">
        
        <div className="saas-card overflow-hidden w-100" style={{ maxWidth: '800px', marginTop: '2rem' }}>
          
          {/* --- Header Banner --- */}
          <div 
            className="p-5 text-center text-white position-relative" 
            style={{ background: computed.pass ? colors.successGradient : colors.dangerGradient }}
          >
             {/* Decorative Background Circles */}
             <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '200px', height: '200px', top: '-50px', right: '-50px' }}></div>
             <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '100px', height: '100px', bottom: '-20px', left: '10%' }}></div>
             
             <div className="position-relative z-index-1">
               <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25 mb-4" style={{ width: '80px', height: '80px', backdropFilter: 'blur(4px)' }}>
                 <i className={`bi ${computed.pass ? 'bi-trophy-fill' : 'bi-exclamation-octagon-fill'} fs-1`}></i>
               </div>
               <div className="mb-2 text-uppercase fw-bolder small" style={{ letterSpacing: '0.15em', opacity: 0.9 }}>Result Statement</div>
               <h1 className="display-4 fw-bolder mb-0" style={{ letterSpacing: '-1px' }}>{computed.resultStatus}</h1>
               <p className="mb-0 mt-3 fs-6" style={{ opacity: 0.9, fontWeight: 500 }}>
                 You have {computed.pass ? "successfully cleared" : "not cleared"} the exam.
               </p>
             </div>
          </div>

          <div className="p-4 p-md-5">
             
             {/* --- Exam Title Area --- */}
             <div className="text-center mb-5 border-bottom pb-4" style={{ borderColor: colors.border }}>
                <h3 className="fw-bolder mb-3" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>{data.exam.title}</h3>
                <span className="badge rounded-pill fw-medium px-4 py-2" style={{ backgroundColor: colors.primaryLight, color: colors.primary, border: `1px solid rgba(79,70,229,0.2)` }}>
                  <i className="bi bi-journal-bookmark me-2"></i>{data.exam.subjectName}
                </span>
             </div>

             {/* --- Stats Grid --- */}
             <div className="row g-4 text-center mb-5">
                <div className="col-12 col-md-4">
                   <div className="stat-box h-100 d-flex flex-column justify-content-center">
                      <span className="text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Score</span>
                      <div className="d-flex align-items-baseline justify-content-center">
                        <span className="fs-2 fw-bolder" style={{ color: colors.primary, letterSpacing: '-1px' }}>{computed.obtained}</span>
                        <span className="fw-medium ms-1" style={{ color: colors.textMuted, fontSize: '1.1rem' }}>/{computed.total}</span>
                      </div>
                   </div>
                </div>
                <div className="col-12 col-md-4">
                   <div className="stat-box h-100 d-flex flex-column justify-content-center">
                      <span className="text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Percentage</span>
                      <span className="fs-2 fw-bolder" style={{ color: colors.textMain, letterSpacing: '-1px' }}>{computed.percentage}%</span>
                   </div>
                </div>
                <div className="col-12 col-md-4">
                   <div className="stat-box h-100 d-flex flex-column justify-content-center">
                      <span className="text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Grade</span>
                      <span className="fs-2 fw-bolder" style={{ color: computed.pass ? colors.success : colors.danger, letterSpacing: '-1px' }}>
                        {computed.grade}
                      </span>
                   </div>
                </div>
             </div>

             <div className="row g-4 mb-5 text-center">
                <div className="col-12 col-md-4">
                  <div className="stat-box h-100 d-flex flex-column justify-content-center">
                    <span className="text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Correct</span>
                    <span className="fs-2 fw-bolder" style={{ color: colors.success, letterSpacing: '-1px' }}>{computed.correctCount}</span>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="stat-box h-100 d-flex flex-column justify-content-center">
                    <span className="text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Wrong</span>
                    <span className="fs-2 fw-bolder" style={{ color: colors.danger, letterSpacing: '-1px' }}>{computed.wrongCount}</span>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="stat-box h-100 d-flex flex-column justify-content-center">
                    <span className="text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Unanswered</span>
                    <span className="fs-2 fw-bolder" style={{ color: colors.warning, letterSpacing: '-1px' }}>{computed.unansweredCount}</span>
                  </div>
                </div>
             </div>

             {/* --- Performance Bar --- */}
             <div className="mb-5 p-4 rounded-4" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.border}` }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                   <span className="fw-bold" style={{ color: colors.textMain, fontSize: '0.95rem' }}>Performance Analysis</span>
                   <span className="fw-bold" style={{ color: computed.pass ? colors.success : colors.danger }}>{computed.percentage}%</span>
                </div>
                <div className="saas-progress-bg">
                   <div 
                      className="saas-progress-fill" 
                      style={{ 
                        width: `${Math.max(0, Math.min(100, computed.percentage))}%`,
                        backgroundColor: computed.pass ? colors.success : colors.danger
                      }}
                   ></div>
                </div>
                <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600 }}>
                   <span>0%</span>
                   <span>50%</span>
                   <span>100%</span>
                </div>
             </div>

             <div className="mb-5">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <div>
                    <h4 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>Question Review</h4>
                    <p className="mb-0" style={{ color: colors.textMuted }}>
                      View every question, your answer, and the correct answer.
                    </p>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: colors.successLight, color: colors.success }}>
                      Correct: {computed.correctCount}
                    </span>
                    <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: colors.dangerLight, color: colors.danger }}>
                      Wrong: {computed.wrongCount}
                    </span>
                    <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: colors.warningLight, color: colors.warning }}>
                      Unanswered: {computed.unansweredCount}
                    </span>
                  </div>
                </div>

                <div className="d-flex flex-column gap-4">
                  {(data.questions || []).map((question) => (
                    <div key={question.questionId} className="review-card p-4">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
                        <div>
                          <div className="d-inline-flex align-items-center rounded-pill px-3 py-2 mb-3" style={{ backgroundColor: colors.primaryLight, color: colors.primary, fontSize: '0.8rem', fontWeight: 700 }}>
                            Question {question.order}
                          </div>
                          <h5 className="fw-bold mb-0 lh-base" style={{ color: colors.textMain }}>{question.questionText}</h5>
                        </div>
                        <div className="text-md-end">
                          <span
                            className="badge rounded-pill px-3 py-2"
                            style={{
                              backgroundColor: question.selectedAnswer ? (question.isCorrect ? colors.successLight : colors.dangerLight) : colors.warningLight,
                              color: question.selectedAnswer ? (question.isCorrect ? colors.success : colors.danger) : colors.warning,
                              fontSize: '0.8rem',
                            }}
                          >
                            {question.selectedAnswer ? (question.isCorrect ? "Correct" : "Wrong") : "Not Answered"}
                          </span>
                          <div className="small mt-2" style={{ color: colors.textMuted, fontWeight: 600 }}>
                            {question.marksAwarded} / {question.marks} marks
                          </div>
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {question.options.map((option, index) => {
                          const answerState = getAnswerState(option, question);

                          return (
                            <div
                              key={`${question.questionId}-${index}`}
                              className="option-pill p-3"
                              style={{
                                backgroundColor: answerState.bg,
                                borderColor: answerState.border,
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3">
                                <div className="fw-medium" style={{ color: answerState.text }}>
                                  {option}
                                </div>
                                {answerState.label ? (
                                  <span className="d-inline-flex align-items-center small fw-bold" style={{ color: answerState.text }}>
                                    <i className={`bi ${answerState.icon} me-2`}></i>
                                    {answerState.label}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-12 col-md-6">
                          <div className="p-3 rounded-4 h-100" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                            <div className="text-uppercase mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textMuted, letterSpacing: '0.05em' }}>Your Answer</div>
                            <div className="fw-semibold" style={{ color: question.selectedAnswer ? (question.isCorrect ? colors.success : colors.danger) : colors.textMuted }}>
                              {question.selectedAnswer || "Not answered"}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="p-3 rounded-4 h-100" style={{ backgroundColor: colors.successLight, border: '1px solid rgba(16, 185, 129, 0.18)' }}>
                            <div className="text-uppercase mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.success, letterSpacing: '0.05em' }}>Correct Answer</div>
                            <div className="fw-semibold" style={{ color: colors.success }}>
                              {question.correctAnswer}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* --- Footer & Actions --- */}
             <div className="text-center pt-2">
                <div className="d-inline-flex align-items-center mb-4 px-3 py-2 rounded-pill" style={{ backgroundColor: colors.bg, color: colors.textMuted, fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="bi bi-clock-history me-2"></i>
                  Submitted on: {new Date(data.result.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div>
                  <button onClick={() => navigate("/student/exams")} className="btn btn-saas btn-saas-outline rounded-pill">
                     <i className="bi bi-arrow-left me-2"></i> Back to Exams
                  </button>
                </div>
             </div>
             
          </div>
        </div>

      </div>
    </div>
  );
}
