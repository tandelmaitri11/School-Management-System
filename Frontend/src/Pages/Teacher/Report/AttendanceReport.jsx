import React, { useEffect, useState } from "react";
import api from "../../../api/api";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MultiMonthAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, rate: 0 });
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (teacherId) fetchAttendance();
  }, [teacherId]);

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/api/teacher-attendance/teacher/${teacherId}`);
      const data = res.data || [];
      setAttendance(data);
      groupByMonth(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // -------- 📌 Group by Month & Calculate Summaries --------
  const groupByMonth = (records) => {
    const monthMap = {};
    let totalP = 0;
    let totalA = 0;

    records.forEach((item) => {
      const date = new Date(item.date);
      const month = date.toLocaleString("en", { month: "short" });

      if (!monthMap[month]) {
        monthMap[month] = { month, present: 0, absent: 0, total: 0, rate: 0 };
      }

      if (item.status === "Present") {
        monthMap[month].present++;
        totalP++;
      }
      if (item.status === "Absent") {
        monthMap[month].absent++;
        totalA++;
      }
      
      monthMap[month].total++;
      monthMap[month].rate = ((monthMap[month].present / monthMap[month].total) * 100).toFixed(1);
    });

    setMonthlyData(Object.values(monthMap));

    // Overall Summary
    const totalDays = totalP + totalA;
    setSummary({
      present: totalP,
      absent: totalA,
      rate: totalDays ? ((totalP / totalDays) * 100).toFixed(1) : 0,
    });
  };

  // Helper for status badges
  const getStatusBadge = (rate) => {
    if (rate >= 90) return <span className="badge bg-success">Excellent</span>;
    if (rate >= 75) return <span className="badge bg-warning text-dark">Good</span>;
    return <span className="badge bg-danger">Needs Attention</span>;
  };

  return (
    <div className="container mt-3 mt-md-4 px-2 px-md-3">
      <div className="card shadow-sm p-3 p-md-4 rounded-4 border-0 bg-light">
        <h3 className="fw-bold text-primary mb-4 fs-4 fs-md-3">
          SchoolY Teacher Performance Overview
        </h3>

        {/* ---------- KPI SUMMARY CARDS ---------- */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="card shadow-sm border-0 text-center p-3 h-100 rounded-3">
              <h6 className="text-muted text-uppercase fw-semibold mb-1">Overall Rate</h6>
              <h2 className={`fw-bold mb-0 ${summary.rate >= 80 ? 'text-success' : 'text-danger'}`}>
                {summary.rate}%
              </h2>
            </div>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="card shadow-sm border-0 text-center p-3 h-100 rounded-3">
              <h6 className="text-muted text-uppercase fw-semibold mb-1">Total Present</h6>
              <h2 className="fw-bold text-success mb-0">{summary.present} <span className="fs-6 text-muted">days</span></h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 text-center p-3 h-100 rounded-3">
              <h6 className="text-muted text-uppercase fw-semibold mb-1">Total Absent</h6>
              <h2 className="fw-bold text-danger mb-0">{summary.absent} <span className="fs-6 text-muted">days</span></h2>
            </div>
          </div>
        </div>

        <div className="row">
          {/* ---------- DATA TABLE ---------- */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 rounded-3 h-100 p-3">
              <h5 className="fw-bold mb-3 fs-6 fs-md-5">Monthly Breakdown</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Month</th>
                      <th className="text-center">Present</th>
                      <th className="text-center">Absent</th>
                      <th className="text-center">Rate</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.length > 0 ? (
                      monthlyData.map((data, index) => (
                        <tr key={index}>
                          <td className="fw-semibold">{data.month}</td>
                          <td className="text-center text-success fw-bold">{data.present}</td>
                          <td className="text-center text-danger fw-bold">{data.absent}</td>
                          <td className="text-center fw-bold">{data.rate}%</td>
                          <td className="text-center">{getStatusBadge(data.rate)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ---------- CHARTS ---------- */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 rounded-3 h-100 p-3">
              <ul className="nav nav-tabs mb-3" id="chartTabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button className="nav-link active fw-semibold" id="bar-tab" data-bs-toggle="tab" data-bs-target="#bar" type="button" role="tab" aria-controls="bar" aria-selected="true">Comparison</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link fw-semibold" id="line-tab" data-bs-toggle="tab" data-bs-target="#line" type="button" role="tab" aria-controls="line" aria-selected="false">Trend</button>
                </li>
              </ul>
              
              <div className="tab-content" id="chartTabsContent">
                <div className="tab-pane fade show active" id="bar" role="tabpanel" aria-labelledby="bar-tab">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                      <Legend />
                      <Bar dataKey="present" fill="#28a745" name="Present" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1200} />
                      <Bar dataKey="absent" fill="#dc3545" name="Absent" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1200} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="tab-pane fade" id="line" role="tabpanel" aria-labelledby="line-tab">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="#28a745" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Present" animationDuration={1500} />
                      <Line type="monotone" dataKey="absent" stroke="#dc3545" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Absent" animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}