import React, { useEffect, useState } from "react";
import api from "../../../api/api"; // Axios instance
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
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminTeacherAttendance() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [historyData, setHistoryData] = useState([]); // Last 7 days attendance

  // Load attendance for selected date
  const loadAttendanceForDate = async (d) => {
    setMessage("");
    try {
      setLoading(true);
      const res = await api.get(`/api/teacher-attendance/date/${d}`);
      setAttendanceRecords(res.data?.attendance || []);
      if (!res.data?.attendance?.length) {
        setMessage("No attendance found for this date.");
      }
    } catch (err) {
      console.error(err);
      setAttendanceRecords([]);
      setMessage("No attendance found or error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Load last 7 days history
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
        const present = attendance.filter((a) => a.status === "Present").length || 0;
        const absent = attendance.filter((a) => a.status === "Absent").length || 0;
        history.push({ date: d, present, absent });
      } catch {
        history.push({ date: d, present: 0, absent: 0 });
      }
    }

    // Only keep history if there is at least one day with attendance
    const hasData = history.some((h) => h.present > 0 || h.absent > 0);
    setHistoryData(hasData ? history : []);
  };

  useEffect(() => {
    loadAttendanceForDate(date);
    loadAttendanceHistory();
  }, [date]);

  // Stats
  const presentCount = attendanceRecords.filter((a) => a.status === "Present").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "Absent").length;

  // Bar chart data
  const barData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        label: "Teachers",
        data: [presentCount, absentCount],
        backgroundColor: ["#28a745", "#dc3545"],
      },
    ],
  };

  // Line chart data
  const lineData = {
    labels: historyData.map((h) => h.date),
    datasets: [
      {
        label: "Present",
        data: historyData.map((h) => h.present),
        fill: false,
        borderColor: "#28a745",
        tension: 0.2,
      },
      {
        label: "Absent",
        data: historyData.map((h) => h.absent),
        fill: false,
        borderColor: "#dc3545",
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Mange Teacher Attendance</h3>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Select Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="col-md-3 d-flex align-items-end">
          <button
            className="btn btn-info"
            onClick={() => loadAttendanceForDate(date)}
            disabled={loading}
          >
            Load Attendance
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {/* Graphs */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Bar Chart</div>
            <div className="card-body">
              <Bar
                data={barData}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
              <p className="mt-2 text-center">
                Count of Present vs Absent teachers for {date}
              </p>
            </div>
          </div>
        </div>

        {/* Only render line chart if there is history data */}
        {historyData.length > 0 && (
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Line Chart (Last 7 Days)</div>
              <div className="card-body">
                <Line data={lineData} options={{ responsive: true }} />
                <p className="mt-2 text-center">Attendance trend over the last 7 days</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-header">
          Attendance for {date} ({attendanceRecords.length} records)
        </div>
        <div className="card-body p-0">
          <table className="table mb-0 table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Teacher Name</th>
                <th>Teacher ID</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    No attendance records found.
                  </td>
                </tr>
              )}
              {attendanceRecords.map((a, idx) => (
                <tr key={a.teacherId?._id || idx}>
                  <td>{idx + 1}</td>
                  <td>{a.teacherId?.name}</td>
                  <td>{a.teacherId?.teacherId}</td>
                  <td>{a.teacherId?.email || "-"}</td>
                  <td>
                    {a.status === "Present" ? (
                      <span className="badge bg-success">Present</span>
                    ) : (
                      <span className="badge bg-danger">Absent</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
