// ✅ Dashboard.jsx (FULL CODE — UI-only chart upgrade, same API + same logic)
import React, { useEffect, useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { FaUserGraduate, FaChalkboardTeacher, FaChalkboard, FaWallet } from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import api from "../../api/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const [data, setData] = useState({ students: 0, teachers: 0, classes: 0, fees: 0 });

  const [monthlyData, setMonthlyData] = useState({
    students: Array(12).fill(0),
    teachers: Array(12).fill(0),
    classes: Array(12).fill(0),
    fees: Array(12).fill(0),
  });

  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0 });
  const [feeSummary, setFeeSummary] = useState({ paid: 0, pending: 0 });

  useEffect(() => {
    fetchTotalCounts();
    fetchMonthlyData();
    fetchAttendanceSummary();
    fetchFeeSummary();
  }, []);

  // Fetch total counts for cards
  const fetchTotalCounts = async () => {
    try {
      const res = await api.get("/api/dashboard/counts");
      setData({
        students: res.data.students || 0,
        teachers: res.data.teachers || 0,
        classes: res.data.classes || 0,
        fees: res.data.fees || 0,
      });
    } catch (err) {
      console.error("Dashboard counts fetch error:", err);
    }
  };

  // Fetch monthly trend data for line chart
  const fetchMonthlyData = async () => {
    try {
      const res = await api.get("/api/dashboard/monthly");
      setMonthlyData(res.data);
    } catch (err) {
      console.error("Monthly data fetch error:", err);
    }
  };

  // Fetch teacher attendance summary
  const fetchAttendanceSummary = async () => {
    try {
      const res = await api.get("/api/dashboard/attendance");
      setAttendanceSummary(res.data);
    } catch (err) {
      console.error("Attendance summary fetch error:", err);
    }
  };

  // Fetch fee payment summary
  const fetchFeeSummary = async () => {
    try {
      const res = await api.get("/api/dashboard/fees-status");
      setFeeSummary(res.data);
    } catch (err) {
      console.error("Fee summary fetch error:", err);
    }
  };

  // KPI cards UI config
  const cards = [
    {
      title: "Students",
      value: data.students,
      sub: "registered",
      icon: <FaUserGraduate size={26} />,
      badge: "Records",
      link: "/Students/allstudents",
      ring: "rgba(243,168,71,.28)",
      tint: "rgba(243,168,71,.10)",
    },
    {
      title: "Teachers",
      value: data.teachers,
      sub: "active",
      icon: <FaChalkboardTeacher size={26} />,
      badge: "Staff",
      link: "/teacher/allteacher",
      ring: "rgba(100,181,246,.28)",
      tint: "rgba(100,181,246,.10)",
    },
    {
      title: "Classes",
      value: data.classes,
      sub: "total",
      icon: <FaChalkboard size={26} />,
      badge: "Groups",
      link: "/classes/all",
      ring: "rgba(255,138,101,.28)",
      tint: "rgba(255,138,101,.10)",
    },
    {
      title: "Fees",
      value: data.fees,
      sub: "transactions",
      icon: <FaWallet size={26} />,
      badge: "Finance",
      link: "/studentfees",
      ring: "rgba(186,104,200,.28)",
      tint: "rgba(186,104,200,.10)",
    },
  ];

  // ---------------------------
  // ✅ Chart UI (updated only)
  // ---------------------------
  const commonTooltip = {
    enabled: true,
    mode: "index",
    intersect: false,
    backgroundColor: "rgba(33, 37, 41, 0.92)",
    titleColor: "#fff",
    bodyColor: "#fff",
    padding: 12,
    cornerRadius: 10,
    displayColors: true,
    callbacks: {
      title: (items) => `Month: ${items?.[0]?.label || "-"}`,
      label: (ctx) => {
        const label = ctx.dataset.label || "Value";
        const val = ctx.parsed?.y ?? 0;
        if (label === "Fees") return `${label}: ₹${Number(val).toLocaleString()}`;
        return `${label}: ${Number(val).toLocaleString()}`;
      },
    },
  };

  const commonScales = {
    x: {
      grid: { display: false },
      ticks: { color: "#6c757d", font: { weight: 600 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(0,0,0,0.06)" },
      ticks: { color: "#6c757d" },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          padding: 18,
          color: "#495057",
          font: { weight: 600 },
        },
      },
      tooltip: commonTooltip,
    },
    scales: commonScales,
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 16,
          color: "#495057",
          font: { weight: 600 },
        },
      },
      tooltip: {
        ...commonTooltip,
        callbacks: {
          title: (items) => items?.[0]?.label || "-",
          label: (ctx) => {
            const label = ctx.dataset.label || "Value";
            const val = ctx.parsed?.y ?? 0;
            return `${label}: ${Number(val).toLocaleString()}`;
          },
        },
      },
    },
    scales: commonScales,
  };

  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Students",
        data: monthlyData.students,
        borderColor: "#f3a847",
        backgroundColor: "rgba(243,168,71,0.12)",
        tension: 0.35,
        fill: true,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "Teachers",
        data: monthlyData.teachers,
        borderColor: "#64b5f6",
        backgroundColor: "rgba(100,181,246,0.12)",
        tension: 0.35,
        fill: true,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "Classes",
        data: monthlyData.classes,
        borderColor: "#ff8a65",
        backgroundColor: "rgba(255,138,101,0.12)",
        tension: 0.35,
        fill: true,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "Fees",
        data: monthlyData.fees,
        borderColor: "#ba68c8",
        backgroundColor: "rgba(186,104,200,0.12)",
        tension: 0.35,
        fill: true,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        label: "Teacher Attendance",
        data: [attendanceSummary.present, attendanceSummary.absent],
        backgroundColor: ["rgba(40,167,69,0.75)", "rgba(220,53,69,0.75)"],
        borderColor: ["#28a745", "#dc3545"],
        borderWidth: 1,
        borderRadius: 10,
        barThickness: 40,
      },
    ],
  };

  const feeData = {
    labels: ["Paid", "Pending"],
    datasets: [
      {
        label: "Fee Status",
        data: [feeSummary.paid, feeSummary.pending],
        backgroundColor: ["rgba(0,123,255,0.75)", "rgba(255,193,7,0.75)"],
        borderColor: ["#007bff", "#ffc107"],
        borderWidth: 1,
        borderRadius: 10,
        barThickness: 40,
      },
    ],
  };

  return (
    <div className="container-xxl py-4">
      {/* Page Header */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div
          className="p-4"
          style={{
            background: "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(111,66,193,1) 100%)",
          }}
        >
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div className="text-white">
              <h3 className="mb-1 fw-bold">Admin Dashboard</h3>
              <div className="opacity-75">Overview of your school’s key metrics and activities.</div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2">
                Live Overview
              </Badge>
              <Badge bg="dark" className="rounded-pill px-3 py-2">
                Analytics
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {cards.map((c, idx) => (
          <div className="col-12 col-sm-6 col-xl-3" key={idx}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div className="text-muted small">{c.title}</div>
                    <div className="d-flex align-items-end gap-2">
                      <div className="fw-bold" style={{ fontSize: 34, lineHeight: 1 }}>
                        {c.value}
                      </div>
                      <div className="text-muted mb-1">{c.sub}</div>
                    </div>
                  </div>

                  <div
                    className="d-flex align-items-center justify-content-center rounded-4"
                    style={{
                      width: 44,
                      height: 44,
                      background: c.tint,
                      boxShadow: `0 10px 24px ${c.ring}`,
                      border: `1px solid ${c.ring}`,
                    }}
                  >
                    {c.icon}
                  </div>
                </div>

                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mt-3">
                  <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2">
                    {c.badge}
                  </Badge>

                  <Button
                    href={c.link}
                    variant="primary"
                    className="rounded-pill px-4 w-100 w-sm-auto"
                    style={{ fontWeight: 600 }}
                  >
                    View <i className="bi bi-arrow-right-short ms-1" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Monthly Trends</h5>
                  <div className="text-muted">Students, teachers, classes and fees trend (month-wise).</div>
                </div>
                <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2">
                  Line Chart
                </Badge>
              </div>
              <div style={{ height: "clamp(260px, 45vw, 420px)" }}>
                <Line data={lineChartData} options={lineOptions} />
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Attendance & Fee Status */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Teacher Attendance</h5>
                  <div className="text-muted">Present vs absent summary.</div>
                </div>
                <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2">
                  Bar Chart
                </Badge>
              </div>
              <div style={{ height: "clamp(240px, 40vw, 320px)" }}>
                <Bar data={attendanceData} options={barOptions} />
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-12 col-lg-6">
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Fee Status</h5>
                  <div className="text-muted">Paid vs pending fee summary.</div>
                </div>
                <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2">
                  Bar Chart
                </Badge>
              </div>
              <div style={{ height: "clamp(240px, 40vw, 320px)" }}>
                <Bar data={feeData} options={barOptions} />
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
