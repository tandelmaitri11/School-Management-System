import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function AdminAnalysis() {
  const [data, setData] = useState(null);
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔄 FETCH DATA
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/analytics/admin", {
        params: { studentClass, section, search }
      });
      setData(res.data);
    } catch (err) {
      console.error("API ERROR:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Chart Configurations
  const barChartData = useMemo(() => {
    if (!data?.classPerformance) return null;
    return {
      labels: data.classPerformance.map((item) => `Class ${item.class}`),
      datasets: [
        {
          label: "Performance index",
          data: data.classPerformance.map((item) => item.performance),
          backgroundColor: "#4f46e5",
          borderRadius: 8,
          barThickness: 25,
        },
      ],
    };
  }, [data]);

  const trendChartData = useMemo(() => {
    if (!data?.attendanceTrend) return null;
    return {
      labels: data.attendanceTrend.map((item) => item.date),
      datasets: [
        {
          label: "Attendance Rate",
          data: data.attendanceTrend.map((item) => item.count),
          fill: true,
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          borderColor: "#4f46e5",
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#fff",
          borderWidth: 3,
        },
      ],
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { padding: 12, cornerRadius: 10, bodyFont: { family: "'Inter', sans-serif" } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", size: 11 } } },
      y: { grid: { borderDash: [5, 5], color: "#e2e8f0" }, ticks: { font: { family: "'Inter', sans-serif", size: 11 } } }
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        .input-premium { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Header Hero Section */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              <i className="bi bi-cpu me-2"></i> AI-Powered Analytics
            </span>
            <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Admin Intelligence Dashboard</h2>
            <p className="text-white opacity-75 fw-medium">Real-time student monitoring, risk assessments, and performance trends.</p>
          </div>
          
          {/* Glassmorphism Control Panel */}
          <div className="position-relative z-1 d-flex flex-column flex-lg-row gap-3 p-3 rounded-4" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div className="flex-grow-1 d-flex gap-2">
              <div className="position-relative flex-grow-1">
                <i className="bi bi-search position-absolute text-white opacity-50" style={{ top: '50%', transform: 'translateY(-50%)', left: '15px' }}></i>
                <input
                  type="text"
                  className="form-control border-0 text-white placeholder-white"
                  style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', paddingLeft: '40px', height: '48px' }}
                  placeholder="Search student records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select 
                className="form-select border-0 text-white w-auto" 
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', height: '48px' }}
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
              >
                <option value="" className="text-dark">Select Class</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1} className="text-dark">Class {i + 1}</option>
                ))}
              </select>
              <select 
                className="form-select border-0 text-white w-auto" 
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', height: '48px' }}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="" className="text-dark">Sec</option>
                <option value="A" className="text-dark">A</option>
                <option value="B" className="text-dark">B</option>
                <option value="C" className="text-dark">C</option>
              </select>
            </div>
            <button className="btn btn-light rounded-3 px-4 fw-bold" onClick={fetchData} style={{ height: '48px' }}>
              <i className="bi bi-lightning-charge-fill me-2"></i>Apply Analytics
            </button>
          </div>
        </div>

        {data && !loading && (
          <div className="animate-fade-in">
            {/* KPI Metrics */}
            <div className="row g-4 mb-4">
              <StatCard title="Total Students" value={data.totalStudents} icon="bi-people" color="#4f46e5" />
              <StatCard title="Overall Attendance" value={`${data.totalAttendance}%`} icon="bi-calendar-check" color="#10b981" />
              <StatCard title="Task Submissions" value={data.totalSubmissions} icon="bi-file-earmark-text" color="#f59e0b" />
              <StatCard title="At-Risk Students" value={data.riskStudents} icon="bi-exclamation-triangle" color="#ef4444" isRisk />
            </div>

            {/* AI Failure Prediction Banner */}
            <div className="premium-card p-4 mb-4 border-0 text-white position-relative overflow-hidden" 
                 style={{ background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" }}>
              <div className="position-relative z-1 d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-robot fs-2"></i>
                  </div>
                  <div>
                    <h5 className="fw-black mb-0">AI Predictive Warning</h5>
                    <p className="mb-0 opacity-90 fw-medium small">Machine Learning models flagged potential failures for the current term.</p>
                  </div>
                </div>
                <div className="text-center bg-white bg-opacity-10 px-4 py-2 rounded-4 border border-white border-opacity-20">
                  <div className="small fw-bold text-uppercase opacity-75">Flagged Students</div>
                  <h2 className="fw-black mb-0">{data.failPredictionCount || 0}</h2>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="row g-4 mb-4">
              {/* Performance Bar */}
              <div className="col-12 col-lg-7">
                <div className="premium-card p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h6 className="fw-bolder text-dark m-0"><i className="bi bi-bar-chart-line me-2 text-primary"></i>Academic Performance by Grade</h6>
                    <span className="badge bg-light text-muted border px-2 py-1 rounded-pill">Current Term</span>
                  </div>
                  <div style={{ height: "320px" }}>
                    {barChartData && <Bar data={barChartData} options={chartOptions} />}
                  </div>
                </div>
              </div>

              {/* Attendance Trend Line */}
              <div className="col-12 col-lg-5">
                <div className="premium-card p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h6 className="fw-bolder text-dark m-0"><i className="bi bi-graph-up me-2 text-primary"></i>Attendance Velocity</h6>
                    <div className="dropdown">
                      <button className="btn btn-sm btn-light border rounded-pill px-3 py-1 fw-bold small">Last 30 Days</button>
                    </div>
                  </div>
                  <div style={{ height: "320px" }}>
                    {trendChartData && <Line data={trendChartData} options={chartOptions} />}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Conditional Empty State */}
            {data.totalStudents === 0 && (
              <div className="text-center py-5">
                <img src="https://illustrations.popsy.co/gray/no-results.svg" alt="No data" style={{ width: '200px' }} className="mb-4 opacity-50" />
                <h4 className="fw-bold text-muted">No Data Found</h4>
                <p className="text-secondary">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        )}

        {/* Global Loading Overlay */}
        {loading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg border text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <h5 className="fw-bolder text-dark mb-1">Synthesizing Analytics...</h5>
              <p className="text-muted small fw-medium mb-0">Building intelligence reports</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ title, value, icon, color, isRisk }) {
  return (
    <div className="col-12 col-md-6 col-lg-3">
      <div className={`premium-card p-4 h-100 border-start border-4`} style={{ borderLeftColor: color + ' !important' }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="p-3 rounded-4" style={{ backgroundColor: color + '15', color: color }}>
            <i className={`bi ${icon} fs-4`}></i>
          </div>
          {isRisk && <div className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 fw-bold small">Critical</div>}
        </div>
        <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>{title}</div>
        <div className={`fw-black lh-1 ${isRisk ? 'text-danger' : 'text-dark'}`} style={{ fontSize: '2.2rem' }}>{value}</div>
        <div className="mt-3 d-flex align-items-center gap-1 text-success small fw-bold">
            <i className="bi bi-arrow-up-right"></i>
            <span>Live Data Sync</span>
        </div>
      </div>
    </div>
  );
}