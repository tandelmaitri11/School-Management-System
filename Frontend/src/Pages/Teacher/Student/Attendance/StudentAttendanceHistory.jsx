import React, { useEffect, useState } from "react";
import api from "../../../../api/api";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
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
  const teacherId = localStorage.getItem("teacherId");

  const [chartData, setChartData] = useState([]);

  // ✅ Fetch teacher's classes on load
  useEffect(() => {
    if (teacherId) fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/classes/by-teacher/${teacherId}`);
      setClasses(res.data);
      console.log("✅ Classes fetched:", res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  // ✅ Fetch attendance by class and date
  const fetchAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      setMessage("⚠️ Please select both class and date.");
      return;
    }

    console.log("📘 Selected class ID:", selectedClass);
    console.log("📅 Selected date:", selectedDate);

    setLoading(true);
    setMessage("");
    setAttendanceData([]);
    setChartData([]);

    try {
      const res = await api.get(`/api/attendance/${selectedClass}/${selectedDate}`);
      console.log("✅ Attendance response:", res.data);

      const data = res.data.attendance || [];
      setAttendanceData(data);

      // 🔢 Count Present vs Absent
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
      console.error("❌ Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#28a745", "#dc3545"]; // green for present, red for absent

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-lg border-0">
        <div className="card-body">
          <h3 className="text-center text-primary mb-4">
            <i className="bi bi-bar-chart-line me-2"></i>
            Attendance History
          </h3>

          {/* --- Selection Section --- */}
          <div className="row g-3 mb-4">
            <div className="col-md-5">
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

            <div className="col-md-4">
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

            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={fetchAttendance}
              >
                <i className="bi bi-search me-2"></i>View Attendance
              </button>
            </div>
          </div>

          {/* --- Result Section --- */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : message ? (
            <div className="alert alert-warning text-center mt-3">{message}</div>
          ) : attendanceData.length > 0 ? (
            <>
              {/* 📊 Attendance Chart */}
              <div className="d-flex justify-content-center mt-4">
                <PieChart width={300} height={260}>
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
              </div>

              {/* 📋 Attendance Table */}
              <div className="table-responsive mt-4">
                <table className="table table-bordered align-middle">
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
                        <td>{entry.studentId?.name || "N/A"}</td>
                        <td>{entry.studentId?.email || "N/A"}</td>
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
            <div className="alert alert-info text-center mt-3">
              Select a class and date to view attendance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
