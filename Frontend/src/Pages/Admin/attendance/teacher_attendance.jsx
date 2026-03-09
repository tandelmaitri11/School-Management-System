import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
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
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container">
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">Teacher Management</h2>
            <p className="text-muted mb-0">Monitor and analyze daily faculty presence.</p>
          </div>
          <div className="bg-white p-2 rounded-3 shadow-sm border d-flex align-items-center gap-2">
            <span className="small fw-bold text-muted ps-2">DATE:</span>
            <input
              type="date"
              className="form-control form-control-sm border-0 fw-bold"
              style={{ width: "150px" }}
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Stats Widgets */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 border-start border-primary border-5">
              <small className="text-uppercase text-muted fw-bold">Total Staff</small>
              <h3 className="fw-bold mb-0">{totalCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 border-start border-success border-5">
              <small className="text-uppercase text-muted fw-bold">Present Today</small>
              <h3 className="fw-bold mb-0 text-success">{presentCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 border-start border-danger border-5">
              <small className="text-uppercase text-muted fw-bold">Absent Today</small>
              <h3 className="fw-bold mb-0 text-danger">{absentCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 border-start border-info border-5">
              <small className="text-uppercase text-muted fw-bold">Attendance Rate</small>
              <h3 className="fw-bold mb-0 text-info">{attendanceRate}%</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row g-4 mb-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4">Daily Distribution</h6>
                <div style={{ height: "250px" }}>
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
                      scales: { y: { beginAtZero: true, grid: { display: false } } }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4">7-Day Attendance Trend</h6>
                <div style={{ height: "250px" }}>
                  <Line
                    data={{
                      labels: historyData.map((h) => h.date.split('-').slice(1).join('/')),
                      datasets: [
                        {
                          label: "Present",
                          data: historyData.map((h) => h.present),
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          fill: true,
                          tension: 0.4,
                        },
                      ]
                    }}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                      scales: { x: { grid: { display: false } } }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">Staff Attendance Roster</h6>
            <button className="btn btn-sm btn-outline-primary fw-bold px-3 shadow-none rounded-pill" onClick={() => loadAttendanceForDate(date)}>
              Refresh List
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="small text-uppercase text-muted fw-bold">
                  <th className="ps-4">Teacher Information</th>
                  <th>Staff ID</th>
                  <th>Contact</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      No records found for the selected date.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((a, idx) => (
                    <tr key={a.teacherId?._id || idx}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="avatar me-3 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: '38px', height: '38px'}}>
                            {a.teacherId?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{a.teacherId?.name}</div>
                            <div className="small text-muted">Faculty Member</div>
                          </div>
                        </div>
                      </td>
                      <td><code className="bg-light px-2 py-1 rounded text-dark">{a.teacherId?.teacherId}</code></td>
                      <td className="small text-muted">{a.teacherId?.email || "N/A"}</td>
                      <td className="text-center">
                        <span className={`badge rounded-pill px-3 py-2 ${a.status === "Present" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
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
    </div>
  );
}