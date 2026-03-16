import React, { useEffect, useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaChalkboard,
  FaWallet,
  FaLayerGroup,
  FaProjectDiagram,
} from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";
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
  const [distribution, setDistribution] = useState({
    classWiseStudents: [],
    sectionWiseStudents: [],
    streamWiseStudents: [],
    classWiseFees: [],
    classSummary: { totalSections: 0, activeSections: 0, totalStreams: 0, activeStreams: 0 },
  });

  useEffect(() => {
    fetchTotalCounts();
    fetchMonthlyData();
    fetchAttendanceSummary();
    fetchFeeSummary();
    fetchDistributionData();
  }, []);

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

  const fetchMonthlyData = async () => {
    try {
      const res = await api.get("/api/dashboard/monthly");
      setMonthlyData(res.data);
    } catch (err) {
      console.error("Monthly data fetch error:", err);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const res = await api.get("/api/dashboard/attendance");
      setAttendanceSummary(res.data);
    } catch (err) {
      console.error("Attendance summary fetch error:", err);
    }
  };

  const fetchFeeSummary = async () => {
    try {
      const res = await api.get("/api/dashboard/fees-status");
      setFeeSummary(res.data);
    } catch (err) {
      console.error("Fee summary fetch error:", err);
    }
  };

  const fetchDistributionData = async () => {
    try {
      const res = await api.get("/api/dashboard/distribution");
      setDistribution({
        classWiseStudents: Array.isArray(res.data.classWiseStudents) ? res.data.classWiseStudents : [],
        sectionWiseStudents: Array.isArray(res.data.sectionWiseStudents) ? res.data.sectionWiseStudents : [],
        streamWiseStudents: Array.isArray(res.data.streamWiseStudents) ? res.data.streamWiseStudents : [],
        classWiseFees: Array.isArray(res.data.classWiseFees) ? res.data.classWiseFees : [],
        classSummary: res.data.classSummary || {
          totalSections: 0,
          activeSections: 0,
          totalStreams: 0,
          activeStreams: 0,
        },
      });
    } catch (err) {
      console.error("Distribution data fetch error:", err);
    }
  };

  const cards = [
    {
      title: "Students",
      value: data.students,
      sub: "registered",
      icon: <FaUserGraduate size={24} />,
      badge: "Records",
      link: "/Students/allstudents",
      ring: "rgba(243,168,71,.28)",
      tint: "rgba(243,168,71,.10)",
      color: "#f3a847",
    },
    {
      title: "Teachers",
      value: data.teachers,
      sub: "active",
      icon: <FaChalkboardTeacher size={24} />,
      badge: "Staff",
      link: "/teacher/allteacher",
      ring: "rgba(100,181,246,.28)",
      tint: "rgba(100,181,246,.10)",
      color: "#64b5f6",
    },
    {
      title: "Classes",
      value: data.classes,
      sub: "total",
      icon: <FaChalkboard size={24} />,
      badge: "Groups",
      link: "/classes/all",
      ring: "rgba(255,138,101,.28)",
      tint: "rgba(255,138,101,.10)",
      color: "#ff8a65",
    },
    {
      title: "Fees",
      value: data.fees,
      sub: "records",
      icon: <FaWallet size={24} />,
      badge: "Finance",
      link: "/studentfees",
      ring: "rgba(186,104,200,.28)",
      tint: "rgba(186,104,200,.10)",
      color: "#ba68c8",
    },
    {
      title: "Sections",
      value: distribution.classSummary.totalSections || 0,
      sub: `${distribution.classSummary.activeSections || 0} active`,
      icon: <FaLayerGroup size={24} />,
      badge: "Class Setup",
      link: "/classes/all",
      ring: "rgba(56,142,60,.28)",
      tint: "rgba(56,142,60,.10)",
      color: "#388e3c",
    },
    {
      title: "Streams",
      value: distribution.classSummary.totalStreams || 0,
      sub: `${distribution.classSummary.activeStreams || 0} active`,
      icon: <FaProjectDiagram size={24} />,
      badge: "Senior Setup",
      link: "/classes/all",
      ring: "rgba(0,121,107,.28)",
      tint: "rgba(0,121,107,.10)",
      color: "#00796b",
    },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const commonTooltip = {
    enabled: true,
    mode: "index",
    intersect: false,
    backgroundColor: "rgba(15, 23, 42, 0.9)", // Darker, sleeker tooltip
    titleColor: "#fff",
    bodyColor: "#f1f5f9",
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
  };

  const commonScales = {
    x: {
      grid: { display: false },
      ticks: { color: "#64748b", font: { weight: 500, family: "'Inter', sans-serif" } },
    },
    y: {
      beginAtZero: true,
      border: { dash: [4, 4], display: false },
      grid: { color: "rgba(0,0,0,0.04)" },
      ticks: { color: "#64748b", font: { family: "'Inter', sans-serif" } },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          color: "#475569",
          font: { weight: 600, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        ...commonTooltip,
        callbacks: {
          title: (items) => `Month: ${items?.[0]?.label || "-"}`,
          label: (ctx) => {
            const label = ctx.dataset.label || "Value";
            const val = ctx.parsed?.y ?? 0;
            if (label === "Fees") return `${label}: Rs ${Number(val).toLocaleString()}`;
            return `${label}: ${Number(val).toLocaleString()}`;
          },
        },
      },
    },
    scales: commonScales,
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          padding: 20,
          color: "#475569",
          font: { weight: 600, family: "'Inter', sans-serif" },
        },
      },
      tooltip: commonTooltip,
    },
    scales: commonScales,
  };

  const lineChartData = {
    labels: months,
    datasets: [
      {
        label: "Students",
        data: monthlyData.students,
        borderColor: "#f3a847",
        backgroundColor: "rgba(243,168,71,0.05)",
        tension: 0.4, // Smoother curves
        fill: true,
        borderWidth: 3,
        pointRadius: 0, // Cleaner look without heavy dots unless hovered
        pointHoverRadius: 6,
      },
      {
        label: "Teachers",
        data: monthlyData.teachers,
        borderColor: "#64b5f6",
        backgroundColor: "rgba(100,181,246,0.05)",
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: "Classes",
        data: monthlyData.classes,
        borderColor: "#ff8a65",
        backgroundColor: "rgba(255,138,101,0.05)",
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: "Fees",
        data: monthlyData.fees,
        borderColor: "#ba68c8",
        backgroundColor: "rgba(186,104,200,0.05)",
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        label: "Teacher Attendance",
        data: [attendanceSummary.present, attendanceSummary.absent],
        backgroundColor: ["#10b981", "#ef4444"], // Modern Tailwind greens/reds
        borderRadius: 6,
        barThickness: 50,
      },
    ],
  };

  const feeStatusData = {
    labels: ["Paid", "Pending"],
    datasets: [
      {
        label: "Fee Status",
        data: [feeSummary.paid, feeSummary.pending],
        backgroundColor: ["#3b82f6", "#f59e0b"], // Modern blues/ambers
        borderRadius: 6,
        barThickness: 50,
      },
    ],
  };

  const combinedStudentDistributionRows = [
    ...distribution.classWiseStudents.map((r) => ({
      label: `Class ${r.className}`,
      count: r.count,
      color: "#f59e0b",
    })),
    ...distribution.sectionWiseStudents.map((r) => ({
      label: `Section ${r.section}`,
      count: r.count,
      color: "#10b981",
    })),
    ...distribution.streamWiseStudents.map((r) => ({
      label: `Stream ${r.stream}`,
      count: r.count,
      color: "#3b82f6",
    })),
  ];

  const combinedStudentDistributionChart = {
    labels: combinedStudentDistributionRows.map((r) => r.label),
    datasets: [
      {
        label: "Students",
        data: combinedStudentDistributionRows.map((r) => r.count),
        backgroundColor: combinedStudentDistributionRows.map((r) => r.color),
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 40,
      },
    ],
  };

  const classFeeAmountChart = {
    labels: distribution.classWiseFees.map((r) => r.label),
    datasets: [
      {
        label: "Paid Amount",
        data: distribution.classWiseFees.map((r) => r.paidAmount),
        backgroundColor: "#10b981",
        borderRadius: 4,
      },
      {
        label: "Pending Amount",
        data: distribution.classWiseFees.map((r) => r.remainingAmount),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
      },
    ],
  };

  return (
    <div
      className="min-vh-100 py-4"
      style={{
        backgroundColor: "#f3f4f6",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="container-xxl">
        
        {/* Modern Header Banner */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 position-relative">
          <div
            className="p-4 p-md-5"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
            }}
          >
            {/* Decorative background shapes */}
            <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '200px', height: '200px', top: '-50px', right: '-50px' }}></div>
            <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '100px', height: '100px', bottom: '20px', right: '15%' }}></div>
            
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 position-relative z-1">
              <div className="text-white">
                <h2 className="mb-2 fw-bold tracking-tight">Admin Dashboard</h2>
                <div className="opacity-75 fs-6">
                  School analytics by fees, class, section, stream, and operational status.
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Badge bg="white" text="primary" className="rounded-pill px-3 py-2 fw-semibold shadow-sm">
                  <i className="bi bi-record-circle-fill text-danger me-2"></i>Live Overview
                </Badge>
                <Badge bg="dark" className="rounded-pill px-3 py-2 fw-semibold bg-opacity-50">
                  <i className="bi bi-graph-up me-2"></i>Analytics
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="row g-4 mb-4">
          {cards.map((c, idx) => (
            <div className="col-12 col-sm-6 col-xl-4" key={idx}>
              <Card 
                className="border-0 shadow-sm rounded-4 h-100 transition-all"
                style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
                }}
              >
                <Card.Body className="p-4">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <div className="text-muted small fw-semibold text-uppercase tracking-wider mb-2">{c.title}</div>
                      <div className="d-flex align-items-end gap-2">
                        <div className="fw-bold text-dark" style={{ fontSize: '2.25rem', lineHeight: 1 }}>
                          {c.value}
                        </div>
                      </div>
                      <div className="text-muted small mt-1">
                        <span style={{ color: c.color, fontWeight: 600 }}>{c.sub}</span> records
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center justify-content-center rounded-4"
                      style={{
                        width: 54,
                        height: 54,
                        background: c.tint,
                        color: c.color,
                      }}
                    >
                      {c.icon}
                    </div>
                  </div>

                  <hr className="text-muted opacity-25" />

                  <div className="d-flex align-items-center justify-content-between mt-2">
                    <Badge bg="light" text="secondary" className="border rounded-pill px-3 py-2 fw-medium">
                      {c.badge}
                    </Badge>
                    <Link to={c.link} className="text-decoration-none fw-semibold small" style={{ color: c.color }}>
                      View Details <i className="bi bi-arrow-right-short ms-1 fs-6 align-middle" />
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>

        {/* Charts - Row 1 */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4 p-lg-5">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-4">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">Monthly Trends</h5>
                    <div className="text-muted small">Students, teachers, classes and fees trend (month-wise).</div>
                  </div>
                  <Badge bg="light" text="secondary" className="border rounded-pill px-3 py-2 fw-medium">
                    <i className="bi bi-graph-up text-primary me-2"></i>Line Chart
                  </Badge>
                </div>
                <div style={{ height: "clamp(300px, 45vw, 420px)" }}>
                  <Line data={lineChartData} options={lineOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Charts - Row 2 */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4 p-lg-5">
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-4">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">Distribution Overview</h5>
                    <div className="text-muted small">
                      Students by Class, Section, and Stream combined.
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-3 py-2">Class</span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2">Section</span>
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2">Stream</span>
                  </div>
                </div>
                <div style={{ height: "360px" }}>
                  <Bar data={combinedStudentDistributionChart} options={barOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Charts - Row 3 */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-6">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 p-lg-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">Teacher Attendance</h5>
                    <div className="text-muted small">Present vs absent summary.</div>
                  </div>
                  <Badge bg="light" text="secondary" className="border rounded-pill px-3 py-2 fw-medium">
                     <i className="bi bi-bar-chart-fill text-success me-2"></i>Status
                  </Badge>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar data={attendanceData} options={barOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-12 col-lg-6">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 p-lg-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">Fee Status</h5>
                    <div className="text-muted small">Paid vs pending fee records.</div>
                  </div>
                  <Badge bg="light" text="secondary" className="border rounded-pill px-3 py-2 fw-medium">
                    <i className="bi bi-wallet2 text-primary me-2"></i>Finance
                  </Badge>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar data={feeStatusData} options={barOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Charts - Row 4 */}
        <div className="row g-4">
          <div className="col-12">
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4 p-lg-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">Class-wise Fee Amount</h5>
                    <div className="text-muted small">Total paid and pending amount split by class level.</div>
                  </div>
                  <Badge bg="light" text="secondary" className="border rounded-pill px-3 py-2 fw-medium">
                    <i className="bi bi-cash-stack text-success me-2"></i>Revenue
                  </Badge>
                </div>
                <div style={{ height: "360px" }}>
                  <Bar data={classFeeAmountChart} options={barOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;