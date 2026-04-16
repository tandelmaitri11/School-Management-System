import React, { useEffect, useState, useMemo } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function TeacherAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const teacherId = localStorage.getItem("teacherId");

  const downloadReport = async (format) => {
    if (!teacherId) return;
    try {
      const res = await api.get(`/api/analytics/teacher/report`, {
        params: { teacherId, format },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teacher_analytics_${teacherId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (!teacherId) {
      setData([]);
      setLoading(false);
      return;
    }
    api.get(`/api/analytics/teacher?teacherId=${teacherId}`)
      .then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Teacher Analytics Error:", err);
        setLoading(false);
      });
  }, [teacherId]);

  // Compute Aggregates for KPIs
  const stats = useMemo(() => {
    if (!data.length) return { avg: 0, total: 0, atRisk: 0 };
    const avg = data.reduce((acc, curr) => acc + curr.performance, 0) / data.length;
    const atRisk = data.filter(s => s.performance < 40).length;
    return { avg: avg.toFixed(1), total: data.length, atRisk };
  }, [data]);

  // Chart Data Configuration
  const mainChartData = {
    labels: data.map((s) => s.name),
    datasets: [
      {
        label: "Performance Score (%)",
        data: data.map((s) => s.performance),
        backgroundColor: data.map(s => s.performance < 40 ? "rgba(239, 68, 68, 0.8)" : "rgba(79, 70, 229, 0.8)"),
        borderRadius: 8,
        hoverBackgroundColor: "#4338ca",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: "'Inter', sans-serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
      }
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: "#f1f5f9" }, ticks: { font: { family: "'Inter', sans-serif" } } },
      x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } }
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Custom Styles */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: transform 0.2s; }
        .premium-card:hover { transform: translateY(-3px); border-color: #cbd5e1; }
        .hero-section { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); border-radius: 24px; color: white; position: relative; overflow: hidden; }
        .stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .animate-fade { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="container" style={{ maxWidth: "1300px" }}>
        
        {/* --- HEADER --- */}
        <div className="hero-section p-4 p-md-5 mb-4 shadow-sm animate-fade">
          <div className="row align-items-center">
            <div className="col-md-8 position-relative z-1">
              <span className="badge bg-primary bg-opacity-25 text-primary-emphasis border border-primary border-opacity-25 px-3 py-2 rounded-pill mb-3">
                <i className="bi bi-person-badge me-2"></i>Educator Workspace
              </span>
              <h1 className="display-6 fw-black mb-2">Classroom Insights</h1>
              <p className="opacity-75 mb-0">Track student progress, identify learning gaps, and manage performance trends.</p>
            </div>
            <div className="col-md-4 text-md-end mt-4 mt-md-0 position-relative z-1">
               <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                 <button className="btn btn-light rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={() => window.location.reload()}>
                   <i className="bi bi-arrow-clockwise me-2"></i>Refresh Data
                 </button>
                 <button className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={() => downloadReport("pdf")}>
                   <i className="bi bi-file-earmark-pdf me-2"></i>PDF
                 </button>
                 <button className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={() => downloadReport("csv")}>
                   <i className="bi bi-filetype-csv me-2"></i>CSV
                 </button>
               </div>
            </div>
          </div>
          {/* Decorative Background Element */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
        </div>

        {loading ? (
          <div className="d-flex flex-column justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted fw-medium">Loading classroom analytics...</p>
          </div>
        ) : (
          <div className="animate-fade">
            
            {/* --- KPI SECTION --- */}
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="premium-card p-4 d-flex align-items-center gap-3">
                  <div className="stat-icon bg-primary bg-opacity-10 text-primary"><i className="bi bi-people-fill"></i></div>
                  <div>
                    <h6 className="text-muted small fw-bold text-uppercase mb-1">Total Students</h6>
                    <h3 className="fw-black mb-0">{stats.total}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="premium-card p-4 d-flex align-items-center gap-3">
                  <div className="stat-icon bg-success bg-opacity-10 text-success"><i className="bi bi-graph-up-arrow"></i></div>
                  <div>
                    <h6 className="text-muted small fw-bold text-uppercase mb-1">Class Average</h6>
                    <h3 className="fw-black mb-0">{stats.avg}%</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="premium-card p-4 d-flex align-items-center gap-3">
                  <div className="stat-icon bg-danger bg-opacity-10 text-danger"><i className="bi bi-exclamation-triangle"></i></div>
                  <div>
                    <h6 className="text-muted small fw-bold text-uppercase mb-1">At Risk (Below 40%)</h6>
                    <h3 className="fw-black mb-0 text-danger">{stats.atRisk}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* --- MAIN CHART --- */}
            <div className="row">
              <div className="col-12">
                <div className="premium-card p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">Student Performance Distribution</h5>
                      <p className="text-muted small mb-0">Individual scoring index for the current semester</p>
                    </div>
                    <div className="d-flex gap-2">
                       <span className="badge bg-primary rounded-pill px-3 py-2 fw-semibold">Healthy</span>
                       <span className="badge bg-danger rounded-pill px-3 py-2 fw-semibold">Action Needed</span>
                    </div>
                  </div>
                  
                  <div style={{ height: "400px", minHeight: "300px" }}>
                    {data.length > 0 ? (
                      <Bar data={mainChartData} options={chartOptions} />
                    ) : (
                      <div className="h-100 d-flex align-items-center justify-content-center border rounded-4 bg-light border-dashed">
                        <p className="text-muted italic">No performance data found for this class.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* --- BOTTOM LIST SECTION --- */}
            <div className="row mt-4">
               <div className="col-12">
                 <div className="premium-card overflow-hidden">
                    <div className="px-4 py-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                       <h6 className="mb-0 fw-bold text-dark">Roster & Detailed Scores</h6>
                       <button className="btn btn-sm btn-outline-dark rounded-pill fw-bold">Export PDF</button>
                    </div>
                    <div className="table-responsive">
                       <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                             <tr className="small text-uppercase fw-bold text-muted">
                                <th className="ps-4">Student Name</th>
                                <th className="text-center">Score</th>
                                <th className="text-center">Status</th>
                                <th className="text-end pe-4">Trend</th>
                             </tr>
                          </thead>
                          <tbody>
                             {data.map((student, idx) => (
                                <tr key={idx}>
                                   <td className="ps-4 py-3 fw-bold text-dark">{student.name}</td>
                                   <td className="text-center fw-black">{student.performance}%</td>
                                   <td className="text-center">
                                      <span className={`badge rounded-pill px-3 py-2 ${student.performance >= 40 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                         {student.performance >= 40 ? 'On Track' : 'Needs Support'}
                                      </span>
                                   </td>
                                   <td className="text-end pe-4">
                                      <i className={`bi ${student.performance > 70 ? 'bi-arrow-up-right text-success' : 'bi-dash text-muted'} fs-5`}></i>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
