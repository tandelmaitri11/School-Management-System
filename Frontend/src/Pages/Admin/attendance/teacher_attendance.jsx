import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function AdminTeacherAttendance() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const loadAttendanceForDate = async (d) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/teacher-attendance/date/${d}`);
      setAttendanceRecords(res.data?.attendance || []);
    } catch (err) {
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    const history = [];
    for (let d of last7Days) {
      try {
        const res = await api.get(`/api/teacher-attendance/date/${d}`);
        const attendance = res.data?.attendance || [];
        const present = attendance.filter((a) => a.status === "Present").length;
        const absent = attendance.filter((a) => a.status === "Absent").length;
        history.push({ date: d, present, absent });
      } catch {
        history.push({ date: d, present: 0, absent: 0 });
      }
    }
    setHistoryData(history.some(h => h.present > 0 || h.absent > 0) ? history : []);
  };

  useEffect(() => {
    loadAttendanceForDate(date);
    loadAttendanceHistory();
  }, [date]);

  const presentCount = attendanceRecords.filter((a) => a.status === "Present").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "Absent").length;
  const totalCount = attendanceRecords.length;
  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 600; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .btn-brand { background: #ffffff; color: #4f46e5; border: none; transition: all 0.2s; font-weight: 700; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-people-fill me-1"></i> Faculty Management
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Teacher Attendance</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Monitor and analyze daily faculty presence and trends.</p>
            </div>
            
            {/* Glassmorphism Control Panel */}
            <div className="d-flex align-items-center gap-3 p-3 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3 py-1">
                <span className="small fw-bold text-white me-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>Date:</span>
                <input
                  type="date"
                  className="form-control input-premium bg-transparent text-white border-0 shadow-none px-0"
                  style={{ width: "150px", colorScheme: 'dark' }}
                  value={date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in">
          {/* Quick Stats Widgets */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-primary">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Staff</div>
                <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.5rem' }}>{totalCount}</div>
                <div className="text-muted small mt-2 fw-medium">Registered faculty members</div>
              </div>
            </div>
            
            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-success">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Present Today</div>
                <div className="fw-bolder text-success lh-1" style={{ fontSize: '2.5rem' }}>{presentCount}</div>
                <div className="text-muted small mt-2 fw-medium">Available on campus</div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-danger">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Absent Today</div>
                <div className="fw-bolder text-danger lh-1" style={{ fontSize: '2.5rem' }}>{absentCount}</div>
                <div className="text-muted small mt-2 fw-medium">Requires coverage</div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-info">
                <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Attendance Rate</div>
                <div className="fw-bolder text-info lh-1" style={{ fontSize: '2.5rem' }}>{attendanceRate}%</div>
                <div className="progress mt-3" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#e2e8f0' }}>
                  <div className="progress-bar bg-info" style={{ width: `${attendanceRate}%`, borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-4">
              <div className="premium-card p-4 h-100 d-flex flex-column">
                <div className="mb-4">
                  <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Daily Distribution</div>
                  <h6 className="fw-bolder text-dark m-0">Present vs Absent</h6>
                </div>
                <div className="flex-grow-1" style={{ minHeight: "250px" }}>
                  <Bar
                    data={{
                      labels: ["Present", "Absent"],
                      datasets: [{
                        data: [presentCount, absentCount],
                        backgroundColor: ["#10b981", "#ef4444"],
                        borderRadius: 8,
                        barThickness: 50,
                      }]
                    }}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { 
                        x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } },
                        y: { beginAtZero: true, grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } } 
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-8">
              <div className="premium-card p-4 h-100 d-flex flex-column">
                <div className="mb-4">
                  <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>7-Day Trend</div>
                  <h6 className="fw-bolder text-dark m-0">Faculty Presence Over Time</h6>
                </div>
                <div className="flex-grow-1" style={{ minHeight: "250px" }}>
                  <Line
                    data={{
                      labels: historyData.map((h) => h.date.split('-').slice(1).join('/')),
                      datasets: [
                        {
                          label: "Present Staff",
                          data: historyData.map((h) => h.present),
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          fill: true,
                          tension: 0.4,
                          borderWidth: 3,
                          pointRadius: 4,
                          pointBackgroundColor: "#ffffff",
                          pointBorderColor: "#10b981",
                        },
                      ]
                    }}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { titleFont: { family: "'Inter', sans-serif" }, bodyFont: { family: "'Inter', sans-serif" } } },
                      scales: { 
                        x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } },
                        y: { grid: { color: "#f1f5f9" }, ticks: { font: { family: "'Inter', sans-serif" } } } 
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="premium-card overflow-hidden">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h5 className="fw-bolder text-dark mb-3 mb-sm-0 d-flex align-items-center">
                <i className="bi bi-card-list text-primary me-2"></i> Staff Attendance Roster
              </h5>
              <button className="btn bg-light border text-primary fw-bold px-4 rounded-pill shadow-sm" onClick={() => loadAttendanceForDate(date)}>
                <i className="bi bi-arrow-clockwise me-2"></i> Refresh List
              </button>
            </div>
            
            <div className="table-responsive border-0">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">Teacher Information</th>
                    <th>Staff ID</th>
                    <th>Contact</th>
                    <th className="text-center pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                          <i className="bi bi-calendar-x text-muted opacity-50 fs-2"></i>
                        </div>
                        <h6 className="fw-bolder text-dark mb-1">No Records Found</h6>
                        <p className="text-muted small fw-medium mb-0">There is no attendance data for the selected date.</p>
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((a, idx) => (
                      <tr key={a.teacherId?._id || idx}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary fw-bolder shadow-sm border" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                              {a.teacherId?.name?.charAt(0).toUpperCase() || "T"}
                            </div>
                            <div>
                              <div className="fw-bolder text-dark lh-sm mb-1">{a.teacherId?.name || "Unknown Faculty"}</div>
                              <div className="small text-muted fw-medium font-monospace" style={{ fontSize: '0.75rem' }}>Faculty Member</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-bold text-secondary font-monospace bg-light px-2 py-1 rounded border">
                            {a.teacherId?.teacherId || "---"}
                          </span>
                        </td>
                        <td>
                          <div className="small text-muted fw-medium d-flex align-items-center" style={{ fontSize: '0.8rem' }}>
                            <i className="bi bi-envelope-fill me-2 opacity-50"></i> {a.teacherId?.email || "N/A"}
                          </div>
                        </td>
                        <td className="text-center pe-4">
                          <span className={`badge rounded-pill px-3 py-2 fw-bold shadow-sm ${a.status === "Present" ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25" : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"}`} style={{ minWidth: '85px' }}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Loading Overlay */}
        {loading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg border text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <h5 className="fw-bolder text-dark mb-1">Processing...</h5>
              <p className="text-muted small fw-medium mb-0">Fetching attendance records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}