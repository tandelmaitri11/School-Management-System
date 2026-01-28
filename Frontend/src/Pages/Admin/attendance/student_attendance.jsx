import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

import { Pie, Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

export default function AdminClassAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setClasses(res.data);
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, []);

  const fetchAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/attendance/class/${selectedClass}`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
    setLoading(false);
  };

  // Monthly Bar Chart Data (Modern Colors + Animations)
  const monthlyChartData = (() => {
    if (!attendanceData.length) return null;

    const labels = attendanceData.map((rec) => rec.date);
    const presentCounts = attendanceData.map(
      (rec) => rec.attendance.filter((a) => a.status === "Present").length
    );
    const absentCounts = attendanceData.map(
      (rec) => rec.attendance.filter((a) => a.status === "Absent").length
    );

    return {
      labels,
      datasets: [
        {
          label: "Present",
          data: presentCounts,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          borderRadius: 8
        },
        {
          label: "Absent",
          data: absentCounts,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    };
  })();

  // ✅ Trend Line Graph (Smooth Curve)
  const trendChartData = (() => {
    if (!attendanceData.length) return null;

    const labels = attendanceData.map((rec) => rec.date);
    const presentCounts = attendanceData.map(
      (rec) => rec.attendance.filter((a) => a.status === "Present").length
    );

    return {
      labels,
      datasets: [
        {
          label: "Attendance Trend",
          data: presentCounts,
          fill: false,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8
        }
      ]
    };
  })();

  // ✅ Animation Settings
  const chartOptions = {
    responsive: true,
    animation: {
      duration: 1200,
      easing: "easeInOutQuart"
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="fw-bold mb-3">📊 Class Wise Attendance</h3>

      {/* Class Dropdown */}
      <div className="mb-3">
        <label className="form-label">Select Class:</label>
        <select
          className="form-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Select --</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.className}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary mb-4"
        onClick={fetchAttendance}
        disabled={!selectedClass}
      >
        Load Attendance
      </button>

      {loading && <p>Loading...</p>}

      {/* ✅ Monthly Attendance Bar Chart */}
      {!loading && attendanceData.length > 0 && (
        <div className="mb-5">
          <h5 className="fw-bold text-center">📅 Monthly Attendance Summary</h5>
          <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* ✅ Trend Line Chart */}
      {!loading && attendanceData.length > 0 && (
        <div className="mb-5">
          <h5 className="fw-bold text-center">📈 Attendance Trend</h5>
          <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {!loading && attendanceData.length > 0 && (
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Total Students</th>
              <th>Present</th>
              <th>Absent</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((rec) => {
              const present = rec.attendance.filter(a => a.status === "Present").length;
              const absent = rec.attendance.length - present;

              return (
                <tr key={rec._id}>
                  <td>{rec.date}</td>
                  <td>{rec.attendance.length}</td>
                  <td className="text-success fw-bold">{present}</td>
                  <td className="text-danger fw-bold">{absent}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => setSelectedRecord(rec)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* No Records Display */}
      {!loading && selectedClass && attendanceData.length === 0 && (
        <p className="text-muted">No attendance records found.</p>
      )}

      {/* ✅ Modal */}
      {selectedRecord && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">
                  Attendance Details - {selectedRecord.date}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setSelectedRecord(null)}
                ></button>
              </div>

              <div className="modal-body">

                {/* ✅ Pie Chart with Modern Colors */}
                {(() => {
                  const present = selectedRecord.attendance.filter(a => a.status === "Present").length;
                  const absent = selectedRecord.attendance.length - present;

                  return (
                    <div className="text-center mb-4">
                      <h6 className="fw-bold">Attendance Summary</h6>
                      <div style={{ width: "260px", margin: "0 auto" }}>
                        <Pie
                          data={{
                            labels: ["Present", "Absent"],
                            datasets: [
                              {
                                data: [present, absent],
                                backgroundColor: [
                                  "rgba(75, 192, 192, 0.7)",
                                  "rgba(255, 99, 132, 0.7)"
                                ],
                                borderColor: [
                                  "rgba(75, 192, 192, 1)",
                                  "rgba(255, 99, 132, 1)"
                                ],
                                borderWidth: 2
                              }
                            ]
                          }}
                          options={chartOptions}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Student List */}
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.attendance.map((std, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          {std?.studentId?.name}{" "}
                          <span className="text-muted">({std?.studentId?.studentId})</span>
                        </td>
                        <td>
                          {std.status === "Present" ? (
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

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}