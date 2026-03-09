import React, { useEffect, useState } from "react";
import api from "../../../../api/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function StudentAttendanceHistory() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (teacherId) fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/classes/by-teacher/${teacherId}`);
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      setMessage("⚠️ Please select both class and date.");
      return;
    }

    setLoading(true);
    setMessage("");
    setAttendanceData([]);
    setChartData([]);

    try {
      const res = await api.get(`/api/attendance/${selectedClass}/${selectedDate}`);
      const data = res.data.attendance || [];
      setAttendanceData(data);

      const presentCount = data.filter((d) => d.status === "Present").length;
      const absentCount = data.filter((d) => d.status === "Absent").length;

      setChartData([
        { name: "Present", value: presentCount },
        { name: "Absent", value: absentCount },
      ]);
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage("No attendance found for this class on this date.");
      } else {
        setMessage("Failed to fetch attendance. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#28a745", "#dc3545"];

  return (
    <div className="container-fluid px-2 px-md-4 mt-4 mb-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-3 p-md-4">
          <h3 className="text-center text-primary mb-4 fs-5 fs-md-3">
            <i className="bi bi-bar-chart-line me-2"></i>
            Attendance History
          </h3>

          {/* 🔹 Selection Section */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-5">
              <label className="form-label fw-semibold">Select Class</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">-- Select --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    Class {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Select Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  return d.toISOString().split("T")[0];
                })()}
              />
            </div>

            <div className="col-12 col-md-3 d-grid">
              <button className="btn btn-primary" onClick={fetchAttendance}>
                <i className="bi bi-search me-2"></i>View Attendance
              </button>
            </div>
          </div>

          {/* 🔹 Result Section */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : message ? (
            <div className="alert alert-warning text-center">{message}</div>
          ) : attendanceData.length > 0 ? (
            <>
              {/* 📊 Responsive Chart */}
              <div className="d-flex justify-content-center mt-4">
                <div style={{ width: "100%", maxWidth: 400, height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 📋 Attendance Table */}
              <div className="table-responsive mt-4">
                <table className="table table-bordered align-middle text-nowrap">
                  <thead className="table-primary text-center">
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((entry, index) => (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td className="fw-medium">
                          {entry.studentId?.name || "N/A"}
                        </td>
                        <td className="small">
                          {entry.studentId?.email || "N/A"}
                        </td>
                        <td
                          className={`fw-bold text-center ${
                            entry.status === "Present"
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {entry.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="alert alert-info text-center">
              Select a class and date to view attendance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
