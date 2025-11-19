import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0 });
  const [selectedMonth, setSelectedMonth] = useState("");

  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (teacherId) fetchAttendance();
  }, [teacherId]);

  useEffect(() => {
    applyMonthFilter(selectedMonth);
  }, [selectedMonth, attendance]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/teacher-attendance/teacher/${teacherId}`);
      const data = res.data || [];
      setAttendance(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyMonthFilter = (month) => {
    if (!month) {
      setFilteredAttendance(attendance);
      updateSummary(attendance);
      return;
    }

    const filtered = attendance.filter((a) => {
      const date = new Date(a.date);
      return date.getMonth() + 1 === parseInt(month);
    });

    setFilteredAttendance(filtered);
    updateSummary(filtered);
  };

  const updateSummary = (records) => {
    const present = records.filter((a) => a.status === "Present").length;
    const absent = records.filter((a) => a.status === "Absent").length;
    setSummary({ present, absent });
  };

  // Group by date for timeline
  const groupedByDate = filteredAttendance.reduce((acc, entry) => {
    const date = new Date(entry.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  // ------------------------------
  // 📌 Line Chart Data
  // ------------------------------
  const lineLabels = filteredAttendance.map((item) =>
    new Date(item.date).toLocaleDateString()
  );

  const presentData = filteredAttendance.map((item) =>
    item.status === "Present" ? 1 : 0
  );

  const absentData = filteredAttendance.map((item) =>
    item.status === "Absent" ? 1 : 0
  );

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Present",
        data: presentData,
        borderColor: "green",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4
      },
      {
        label: "Absent",
        data: absentData,
        borderColor: "red",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4
      }
    ]
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow border-0">
        <div className="card-body">
          <h3 className="text-center text-primary mb-4">
            <i className="bi bi-calendar-check me-2"></i>
            My Attendance Record
          </h3>

          {/* Summary Cards */}
          <div className="row text-center mb-2">
            <div className="col-md-6 mb-3">
              <div className="card border-success shadow-sm">
                <div className="card-body">
                  <h5 className="text-success mb-0">{summary.present}</h5>
                  <small className="text-muted">Days Present</small>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card border-danger shadow-sm">
                <div className="card-body">
                  <h5 className="text-danger mb-0">{summary.absent}</h5>
                  <small className="text-muted">Days Absent</small>
                </div>
              </div>
            </div>
          </div>

          {/* 📌 Line Chart */}
          <div className="card p-3 shadow-sm mb-4">
            <h5 className="text-center fw-bold mb-3">
              Attendance Trend (Day-wise)
            </h5>
            <Line data={lineData} height={80} />
          </div>

          {/* Month Filter */}
          <div className="mb-4 text-end">
            <select
              className="form-select w-25 ms-auto shadow-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          <hr />

          {/* Timeline Section */}
          <h5 className="fw-bold mb-3">
            <i className="bi bi-clock-history me-2"></i>
            Day-wise Attendance
          </h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : Object.keys(groupedByDate).length > 0 ? (
            <div className="timeline">
              {Object.keys(groupedByDate).map((date, index) => (
                <div key={index} className="timeline-item">
                  <div
                    className={`timeline-dot ${
                      groupedByDate[date][0].status === "Present"
                        ? "present"
                        : "absent"
                    }`}
                  ></div>

                  <div className="timeline-content">
                    <h6 className="fw-bold mb-2">{date}</h6>

                    <p
                      className={`fw-semibold ${
                        groupedByDate[date][0].status === "Present"
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {groupedByDate[date][0].status}
                    </p>

                    <small className="text-muted">
                      {groupedByDate[date][0].remarks || "No remarks"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info text-center">
              No attendance records found for selected month.
            </div>
          )}
        </div>
      </div>

      {/* Timeline CSS */}
      <style>{`
        .timeline {
          position: relative;
          margin-left: 25px;
          border-left: 2px solid #d1d5db;
          padding-left: 20px;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 25px;
        }
        .timeline-dot {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          position: absolute;
          left: -29px;
          top: 5px;
        }
        .timeline-dot.present { background-color: #4ade80; box-shadow: 0 0 10px #4ade80; }
        .timeline-dot.absent { background-color: #f87171; box-shadow: 0 0 10px #f87171; }
        .timeline-content {
          background: #fff;
          padding: 12px 18px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}
