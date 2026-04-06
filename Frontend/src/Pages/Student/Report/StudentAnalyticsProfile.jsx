import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

export default function StudentAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    setLoading(true);
    api.get(`/api/analytics/student/${studentId}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching student analytics:", err);
        setLoading(false);
      });
  }, [studentId]);

  // Chart Logic
  const attendanceChartData = useMemo(() => {
    if (!data) return null;
    return {
      datasets: [{
        data: [data.attendancePercentage, 100 - data.attendancePercentage],
        backgroundColor: ["#6366f1", "#e2e8f0"],
        borderWidth: 0,
        cutout: "80%",
      }],
    };
  }, [data]);

  const performanceChartData = useMemo(() => {
    if (!data) return null;
    return {
      datasets: [{
        data: [data.performanceScore, 100 - data.performanceScore],
        backgroundColor: ["#10b981", "#e2e8f0"],
        borderWidth: 0,
        cutout: "80%",
      }],
    };
  }, [data]);

  if (loading) return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
      <div className="spinner-grow text-primary" role="status"></div>
      <p className="mt-3 fw-bold text-primary">Generating AI Insights...</p>
    </div>
  );

  if (!data) return <div className="p-5 text-center">No analytics data available.</div>;

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      <style>{`
        .glass-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .hero-banner { background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); border-radius: 24px; color: white; position: relative; overflow: hidden; }
        .stat-value { font-size: 2rem; font-weight: 800; color: #1e293b; }
        .subject-tag { background: #f1f5f9; border-radius: 12px; padding: 8px 16px; font-weight: 600; color: #475569; display: inline-block; margin: 4px; }
        .prediction-badge { padding: 10px 20px; border-radius: 14px; font-weight: 800; font-size: 1.1rem; }
        .animate-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1200px" }}>
        
        {/* --- HERO HEADER --- */}
        <div className="hero-banner p-4 p-md-5 mb-4 shadow-lg animate-up">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge mb-3" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                <i className="bi bi-stars me-2"></i>AI Powered Feedback
              </span>
              <h1 className="display-5 fw-black mb-2">Hello, Student!</h1>
              <p className="opacity-75 fs-5">Here is your current academic standing and AI-driven predictions for the semester.</p>
            </div>
            <div className="col-lg-4 text-center mt-4 mt-lg-0">
               <div className={`prediction-badge shadow-lg d-inline-block ${data.prediction === 'Fail' ? 'bg-danger' : 'bg-success'}`}>
                  <i className={`bi ${data.prediction === 'Fail' ? 'bi-exclamation-octagon' : 'bi-check-circle'} me-2`}></i>
                  Predicted Outcome: {data.prediction?.toUpperCase()}
               </div>
            </div>
          </div>
          {/* Decorative Circles */}
          <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
        </div>

        <div className="row g-4 mb-4 animate-up" style={{ animationDelay: '0.1s' }}>
          
          {/* --- KPI GAUGES --- */}
          <div className="col-md-6 col-xl-3">
            <div className="glass-card p-4 text-center h-100">
              <h6 className="text-muted fw-bold text-uppercase mb-4">Attendance</h6>
              <div className="position-relative mx-auto mb-3" style={{ width: "120px" }}>
                <Doughnut data={attendanceChartData} options={{ events: [], plugins: { legend: { display: false } } }} />
                <div className="position-absolute top-50 start-50 translate-middle fw-black fs-5">
                  {data.attendancePercentage.toFixed(0)}%
                </div>
              </div>
              <p className="small text-muted mb-0">Target: 75%</p>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="glass-card p-4 text-center h-100">
              <h6 className="text-muted fw-bold text-uppercase mb-4">Avg Performance</h6>
              <div className="position-relative mx-auto mb-3" style={{ width: "120px" }}>
                <Doughnut data={performanceChartData} options={{ events: [], plugins: { legend: { display: false } } }} />
                <div className="position-absolute top-50 start-50 translate-middle fw-black fs-5">
                  {data.performanceScore.toFixed(0)}%
                </div>
              </div>
              <p className="small text-muted mb-0">Aggregated Scores</p>
            </div>
          </div>

          {/* --- WEAK SUBJECTS --- */}
          <div className="col-md-12 col-xl-6">
            <div className="glass-card p-4 h-100">
              <h6 className="text-muted fw-bold text-uppercase mb-3"><i className="bi bi-lightning-charge text-warning me-2"></i>Areas for Improvement</h6>
              <p className="text-muted small">Our AI identified these subjects as your current weak spots based on recent assessments.</p>
              <div className="mt-3">
                {data.weakSubjects.length === 0 ? (
                  <div className="alert alert-success border-0 rounded-4 fw-bold">🚀 You are excelling in all subjects!</div>
                ) : (
                  data.weakSubjects.map((w, i) => (
                    <span key={i} className="subject-tag border shadow-sm">
                      <i className="bi bi-book me-2 text-primary"></i>{w}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- ALERTS SECTION --- */}
        <div className="row g-4 animate-up" style={{ animationDelay: '0.2s' }}>
          <div className="col-12">
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 bg-light border-bottom d-flex align-items-center">
                <i className="bi bi-bell-fill text-danger me-2"></i>
                <h6 className="mb-0 fw-black text-dark text-uppercase">Critical System Alerts</h6>
              </div>
              <div className="p-4">
                {data.alerts.length === 0 ? (
                  <p className="text-muted italic mb-0">No active alerts at this time.</p>
                ) : (
                  <div className="row g-3">
                    {data.alerts.map((a, i) => (
                      <div key={i} className="col-md-6">
                        <div className="alert alert-danger border-0 rounded-4 d-flex align-items-start gap-3 p-3 mb-0 shadow-sm" style={{ backgroundColor: '#fff5f5' }}>
                          <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                          <div className="fw-medium text-danger">{a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- SMART ADVICE CARD --- */}
          <div className="col-12">
            <div className="rounded-4 p-4 text-white d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-sm" style={{ background: '#1e293b' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary p-3 rounded-circle fs-3 text-white">🤖</div>
                <div>
                  <h5 className="fw-bold mb-1 text-white">AI Learning Tip</h5>
                  <p className="mb-0 opacity-75 small text-white">
                    {data.attendancePercentage < 75 
                      ? "Your attendance is dropping. Regular presence increases your chances of passing by 40%." 
                      : "Consistency is key! Maintain your current pace to secure an 'A' grade."}
                  </p>
                </div>
              </div>
              <button className="btn btn-outline-light rounded-pill px-4 btn-sm fw-bold">Get Study Plan</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}