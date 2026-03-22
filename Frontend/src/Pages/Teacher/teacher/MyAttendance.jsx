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
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0, rate: 0 });
  const [selectedMonth, setSelectedMonth] = useState("");

  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (teacherId) fetchAttendance();
  }, [teacherId]);

  useEffect(() => {
    applyMonthFilter(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, attendance]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/teacher-attendance/teacher/${teacherId}`);
      // Sort data descending by default (newest first)
      const sortedData = (res.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendance(sortedData);
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
    const total = present + absent;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    
    setSummary({ present, absent, rate });
  };

  const groupedByDate = filteredAttendance.reduce((acc, entry) => {
    const date = new Date(entry.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  // Sort dates descending for the timeline
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  // Chart configuration
  const lineData = {
    // Reverse so chart reads left-to-right (oldest to newest)
    labels: [...filteredAttendance].reverse().map((item) =>
      new Date(item.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })
    ),
    datasets: [
      {
        label: "Attendance Flow",
        data: [...filteredAttendance].reverse().map((i) => (i.status === "Present" ? 1 : 0)),
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13, 110, 253, 0.1)",
        borderWidth: 2,
        tension: 0.4, // Smooth curves
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1.2,
        ticks: { callback: (value) => (value === 1 ? 'Present' : value === 0 ? 'Absent' : '') },
        grid: { borderDash: [4, 4] }
      },
      x: { grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-3 px-md-5">
      
      {/* ---------- HEADER & FILTER ---------- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-calendar2-check text-primary me-2"></i>
            My Attendance
          </h2>
          <div className="text-muted small">Monitor your daily attendance history and performance metrics.</div>
        </div>
        
        <div style={{ minWidth: "200px" }}>
          <select
            className="form-select shadow-sm border-0"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All Months (Lifetime)</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- KPI CARDS ---------- */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold text-uppercase small">Attendance Rate</span>
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-graph-up fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold mb-0">{summary.rate}%</h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold text-uppercase small">Days Present</span>
                <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-check2-circle fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-success">{summary.present}</h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-semibold text-uppercase small">Days Absent</span>
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-x-circle fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-danger">{summary.absent}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- MAIN DASHBOARD GRID ---------- */}
      <div className="row g-4">
        
        {/* LEFT COLUMN: Chart & Table */}
        <div className="col-12 col-xl-8 d-flex flex-column gap-4">
          
          {/* Chart Card */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white py-3 border-bottom-0">
              <h6 className="fw-bold mb-0">Performance Trend</h6>
            </div>
            <div className="card-body pt-0">
              <div style={{ height: "250px", width: "100%" }}>
                <Line data={lineData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Data Table Card */}
          <div className="card border-0 shadow-sm rounded-4 flex-grow-1">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">Detailed Log</h6>
            </div>
            <div className="table-responsive" style={{ maxHeight: "350px" }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th className="ps-4">Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record, idx) => (
                      <tr key={idx}>
                        <td className="ps-4 fw-medium text-secondary">
                          {new Date(record.date).toLocaleDateString("en-IN", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td>
                          {record.status === "Present" ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">Present</span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">Absent</span>
                          )}
                        </td>
                        <td className="text-muted small">{record.remarks || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-5 text-muted">No records found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Timeline Activity Feed */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Activity Feed</h6>
            </div>
            <div className="card-body overflow-auto" style={{ maxHeight: "665px" }}>
              
              {loading ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : sortedDates.length > 0 ? (
                <div className="timeline">
                  {sortedDates.map((date, index) => {
                    const record = groupedByDate[date][0];
                    const isPresent = record.status === "Present";
                    return (
                      <div key={index} className="timeline-item">
                        <div className={`timeline-dot ${isPresent ? "bg-success" : "bg-danger"}`}>
                          <i className={`bi ${isPresent ? "bi-check" : "bi-x"} text-white`} style={{ fontSize: "12px" }}></i>
                        </div>
                        <div className="timeline-content border bg-light bg-opacity-50">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.9rem" }}>
                              {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </h6>
                            <span className={`small fw-semibold ${isPresent ? "text-success" : "text-danger"}`}>
                              {record.status}
                            </span>
                          </div>
                          <small className="text-muted d-block mt-1">
                            {record.remarks || "No remarks left for this day."}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted py-5 mt-4">
                  <i className="bi bi-inbox fs-1 mb-3 d-block opacity-50"></i>
                  <p>Your feed is empty.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modern Timeline CSS */}
      <style>{`
        .timeline {
          position: relative;
          padding-left: 1.5rem;
          border-left: 2px solid #e9ecef;
          margin-top: 0.5rem;
          margin-left: 0.5rem;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        .timeline-dot {
          position: absolute;
          left: -1.5rem;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 4px #fff;
          z-index: 1;
        }
        .timeline-content {
          padding: 0.85rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }
        .timeline-content:hover {
          background-color: #fff !important;
          box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
        }
      `}</style>
    </div>
  );
}