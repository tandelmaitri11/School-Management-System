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

  // -------- 📌 Group by Month --------
  const groupByMonth = (records) => {
    const monthMap = {};

    records.forEach((item) => {
      const date = new Date(item.date);
      const month = date.toLocaleString("en", { month: "short" });

      if (!monthMap[month]) {
        monthMap[month] = { month, present: 0, absent: 0 };
      }

      if (item.status === "Present") monthMap[month].present++;
      if (item.status === "Absent") monthMap[month].absent++;
    });

    setMonthlyData(Object.values(monthMap));
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4">
        <h3 className="text-center fw-bold text-primary mb-4">
          Multi-Month Attendance Comparison
        </h3>

        {/* ---------- BAR CHART (Animated) ---------- */}
        <h5 className="fw-bold mb-2">Bar Comparison</h5>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />

            <Bar
              dataKey="present"
              fill="#28a745"
              name="Present"
              barSize={40}
              animationDuration={1200}
            />
            <Bar
              dataKey="absent"
              fill="#dc3545"
              name="Absent"
              barSize={40}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>

        <hr />

        {/* ---------- LINE CHART (Animated) ---------- */}
        <h5 className="fw-bold mb-2">Trend Line Chart</h5>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="present"
              stroke="#28a745"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Present"
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke="#dc3545"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Absent"
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
