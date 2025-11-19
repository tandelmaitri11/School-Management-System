import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

export default function ViewAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) {
          setError("Student ID not found. Please login again.");
          setLoading(false);
          return;
        }

        const res = await api.get(`/api/attendance/student/${studentId}`);
        const data = res.data;

        setAttendanceData(data);
        setFilteredData(data);
        calculateMonthlySummary(data);
        calculateOverallPercentage(data);
      } catch (err) {
        console.error("❌ Error fetching attendance:", err);
        setError(err.response?.data?.message || "Failed to fetch attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const calculateMonthlySummary = (data) => {
    const summary = {};
    data.forEach((entry) => {
      if (!entry.date || entry.date === "N/A") return;
      const month = new Date(entry.date).toLocaleString("default", { month: "short" });
      if (!summary[month]) summary[month] = { Present: 0, Absent: 0 };
      if (entry.status === "Present") summary[month].Present++;
      else if (entry.status === "Absent") summary[month].Absent++;
    });
    setMonthlySummary(summary);
  };

  const calculateOverallPercentage = (data) => {
    const totalDays = data.length;
    const presentDays = data.filter((a) => a.status === "Present").length;
    const percentage = totalDays ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
    setAttendancePercentage(percentage);
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);

    if (month === "All") {
      setFilteredData(attendanceData);
      calculateOverallPercentage(attendanceData);
    } else {
      const filtered = attendanceData.filter((entry) => {
        const entryMonth = new Date(entry.date).toLocaleString("default", { month: "short" });
        return entryMonth === month;
      });
      setFilteredData(filtered);
      calculateOverallPercentage(filtered);
    }
  };

  // 🎨 Chart Colors (modern pastel + accessible)
  const chartData = {
    labels: Object.keys(monthlySummary),
    datasets: [
      {
        label: "Present",
        data: Object.values(monthlySummary).map((m) => m.Present),
        backgroundColor: "rgba(40, 167, 69, 0.8)", // Bootstrap success green
        borderColor: "#28a745",
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Absent",
        data: Object.values(monthlySummary).map((m) => m.Absent),
        backgroundColor: "rgba(220, 53, 69, 0.8)", // Bootstrap danger red
        borderColor: "#dc3545",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#343a40", font: { size: 13, weight: "600" } },
      },
      title: {
        display: true,
        text: "Monthly Attendance Summary",
        color: "#212529",
        font: { size: 18, weight: "bold" },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "#f8f9fa",
        titleColor: "#212529",
        bodyColor: "#212529",
        borderColor: "#dee2e6",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#495057", font: { size: 12 } },
      },
      y: {
        grid: { color: "#e9ecef" },
        ticks: { color: "#495057", font: { size: 12 } },
      },
    },
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-secondary" role="status"></div>
        <p className="mt-2 fw-semibold text-muted">Loading attendance...</p>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-danger mt-5 text-center container">
        {error}
      </div>
    );

  const allMonths = ["All", ...Object.keys(monthlySummary)];

  return (
    <div className="container my-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="fw-bold text-dark mb-2">Attendance Overview</h2>
        <p className="text-muted">
          Track class attendance and monthly performance summary
        </p>
        <hr className="w-25 mx-auto border-secondary" />
      </div>

      {/* Overview & Filter */}
      <div className="row align-items-center mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="card border-0 shadow-sm p-3 bg-white">
            <h6 className="fw-semibold text-secondary mb-3">Attendance Progress</h6>
            <div className="progress" style={{ height: "20px" }}>
              <div
                className={`progress-bar ${
                  attendancePercentage >= 75
                    ? "bg-success"
                    : attendancePercentage >= 50
                    ? "bg-warning text-dark"
                    : "bg-danger"
                }`}
                role="progressbar"
                style={{ width: `${attendancePercentage}%` }}
              >
                {attendancePercentage}%
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 text-md-end">
          <div className="input-group w-auto shadow-sm">
            <label className="input-group-text bg-light text-dark fw-semibold border-0">
              Month
            </label>
            <select
              className="form-select border-0 bg-white"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {allMonths.map((m, idx) => (
                <option key={idx} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light fw-semibold text-dark">
          Attendance Records
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-semibold text-secondary">
                        {new Date(item.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="text-muted">{item.className}</td>
                      <td>
                        <span
                          className={`badge px-3 py-2 rounded-pill ${
                            item.status === "Present"
                              ? "bg-success-subtle text-success fw-semibold"
                              : "bg-danger-subtle text-danger fw-semibold"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-muted">
                      No attendance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card shadow-sm border-0">
        <div className="card-body" style={{ height: "420px" }}>
          {Object.keys(monthlySummary).length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="alert alert-secondary text-center mb-0">
              No data available for chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
