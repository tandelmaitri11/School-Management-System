import React, { useEffect, useState } from "react";
import { Card, Badge } from "react-bootstrap";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaChalkboard,
  FaWallet,
  FaLayerGroup,
  FaProjectDiagram,
  FaEllipsisV,
} from "react-icons/fa";
import { Line, Bar, Doughnut, PolarArea } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import api from "../../api/api";

// Register all required Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
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
          totalSections: 0, activeSections: 0, totalStreams: 0, activeStreams: 0,
        },
      });
    } catch (err) {
      console.error("Distribution data fetch error:", err);
    }
  };

  // Modern Color Palette
  const colors = {
    students: { base: "#6366f1", light: "rgba(99, 102, 241, 0.15)", grad: "linear-gradient(135deg, #6366f1, #4f46e5)" },
    teachers: { base: "#10b981", light: "rgba(16, 185, 129, 0.15)", grad: "linear-gradient(135deg, #10b981, #059669)" },
    classes: { base: "#f59e0b", light: "rgba(245, 158, 11, 0.15)", grad: "linear-gradient(135deg, #f59e0b, #d97706)" },
    fees: { base: "#ec4899", light: "rgba(236, 72, 153, 0.15)", grad: "linear-gradient(135deg, #ec4899, #db2777)" },
    sections: { base: "#06b6d4", light: "rgba(6, 182, 212, 0.15)", grad: "linear-gradient(135deg, #06b6d4, #0891b2)" },
    streams: { base: "#8b5cf6", light: "rgba(139, 92, 246, 0.15)", grad: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  };

  const cards = [
    { title: "Students", value: data.students, sub: "Registered", icon: <FaUserGraduate size={22} />, link: "/Students/allstudents", theme: colors.students },
    { title: "Teachers", value: data.teachers, sub: "Active Staff", icon: <FaChalkboardTeacher size={22} />, link: "/teacher/allteacher", theme: colors.teachers },
    { title: "Classes", value: data.classes, sub: "Total Groups", icon: <FaChalkboard size={22} />, link: "/classes/all", theme: colors.classes },
    { title: "Fees", value: data.fees, sub: "Finance Records", icon: <FaWallet size={22} />, link: "/studentfees", theme: colors.fees },
    { title: "Sections", value: distribution.classSummary.totalSections || 0, sub: `${distribution.classSummary.activeSections || 0} Active`, icon: <FaLayerGroup size={22} />, link: "/classes/all", theme: colors.sections },
    { title: "Streams", value: distribution.classSummary.totalStreams || 0, sub: `${distribution.classSummary.activeStreams || 0} Active`, icon: <FaProjectDiagram size={22} />, link: "/classes/all", theme: colors.streams },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- Dynamic Gradient Helper ---
  const getGradient = (context, colorStart, colorEnd) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return null; 
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  // --- Enhanced Tooltips Formatter ---
  const commonTooltip = {
    enabled: true,
    mode: "index",
    intersect: false,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    titleColor: "#fff",
    bodyColor: "#cbd5e1",
    padding: 16,
    cornerRadius: 12,
    displayColors: true,
    titleFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' },
    bodyFont: { size: 14, family: "'Inter', sans-serif", weight: '500' },
    boxPadding: 6,
    usePointStyle: true,
    callbacks: {
      label: function(context) {
        let label = context.dataset.label || context.label || '';
        if (label) label += ': ';
        // Add commas to large numbers for professional readability
        if (context.parsed.y !== null && context.parsed.y !== undefined) {
          label += new Intl.NumberFormat('en-US').format(context.parsed.y);
        } else if (context.parsed !== null) {
          label += new Intl.NumberFormat('en-US').format(context.parsed);
        }
        return label;
      }
    }
  };

  const commonScales = {
    x: {
      grid: { display: false },
      ticks: { color: "#64748b", font: { family: "'Inter', sans-serif" } },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: "rgba(226, 232, 240, 0.6)", drawBorder: false, borderDash: [5, 5] },
      ticks: { color: "#64748b", font: { family: "'Inter', sans-serif" }, padding: 10 },
    },
  };

  // --- Custom Plugins for Text Inside Doughnuts ---

  // 1. Center Text for Full Doughnut (Attendance)
  const attendanceCenterText = {
    id: 'attendanceCenterText',
    beforeDraw(chart) {
      const { ctx, chartArea: { top, width, height } } = chart;
      ctx.save();
      const total = attendanceSummary.present + attendanceSummary.absent;
      const percentage = total > 0 ? Math.round((attendanceSummary.present / total) * 100) : 0;
      
      const centerX = chart.chartArea.left + width / 2;
      const centerY = top + height / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Percentage Text
      ctx.font = 'bolder 36px "Inter", sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`${percentage}%`, centerX, centerY - 10);
      
      // Subtext
      ctx.font = '500 14px "Inter", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Present', centerX, centerY + 20);
      ctx.restore();
    }
  };

  // 2. Center Text for Half Doughnut (Fee Status)
  const feeCenterText = {
    id: 'feeCenterText',
    beforeDraw(chart) {
      const { ctx, chartArea: { left, width, bottom } } = chart;
      ctx.save();
      const total = feeSummary.paid + feeSummary.pending;
      const percentage = total > 0 ? Math.round((feeSummary.paid / total) * 100) : 0;
      
      const centerX = left + width / 2;
      // For a half-doughnut, the center is near the bottom
      const centerY = bottom - 15; 

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Percentage Text
      ctx.font = 'bolder 36px "Inter", sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`${percentage}%`, centerX, centerY - 25);
      
      // Subtext
      ctx.font = '500 14px "Inter", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Collected', centerX, centerY);
      ctx.restore();
    }
  };

  // --- Chart Options ---
  
  // UPDATED: Dual Y-Axes configuration for the Line Chart
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 2500, easing: 'easeOutQuart' },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8, padding: 20, font: { family: "'Inter', sans-serif", weight: 500 } } },
      tooltip: commonTooltip,
    },
    scales: {
      x: commonScales.x,
      y: {
        ...commonScales.y,
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Counts (People/Classes)', font: { size: 12, weight: 'bold' } }
      },
      y1: {
        ...commonScales.y,
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false }, // Hides the grid lines for the right axis to keep it clean
        title: { display: true, text: 'Revenue (₹)', font: { size: 12, weight: 'bold' } },
        ticks: {
          color: "#64748b",
          font: { family: "'Inter', sans-serif" },
          padding: 10,
          callback: function(value) {
            // Format with Indian Rupee symbol
            return '₹' + new Intl.NumberFormat('en-IN').format(value); 
          }
        }
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "78%", 
    animation: { animateScale: true, animateRotate: true, duration: 1500, easing: "easeOutCirc" },
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { family: "'Inter', sans-serif", weight: 500 } } },
      tooltip: { ...commonTooltip, mode: "nearest" },
    },
  };

  const halfDoughnutOptions = {
    ...doughnutOptions,
    rotation: -90,
    circumference: 180,
    cutout: "78%",
  };

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateScale: true, animateRotate: true, duration: 1500 },
    scales: { r: { ticks: { display: false }, grid: { color: "rgba(226, 232, 240, 0.4)" } } },
    plugins: {
      legend: { position: "right", labels: { usePointStyle: true, padding: 15, font: { family: "'Inter', sans-serif", weight: 500 } } },
      tooltip: { ...commonTooltip, mode: "nearest" },
    },
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: 'easeOutBounce' },
    plugins: {
      legend: { position: "top", align: "end", labels: { usePointStyle: true, boxWidth: 8, font: { family: "'Inter', sans-serif" } } },
      tooltip: commonTooltip,
    },
    scales: {
      x: { ...commonScales.x, stacked: true },
      y: { ...commonScales.y, stacked: true },
    },
  };


  // --- Chart Datasets ---
  
  // UPDATED: Added yAxisID to bind each dataset to the correct axis
  const lineChartData = {
    labels: months,
    datasets: [
      { 
        label: "Students", data: monthlyData.students, yAxisID: 'y', borderColor: colors.students.base, 
        backgroundColor: (context) => getGradient(context, "rgba(99, 102, 241, 0.4)", "rgba(99, 102, 241, 0.0)"), 
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: "#fff"
      },
      { 
        label: "Teachers", data: monthlyData.teachers, yAxisID: 'y', borderColor: colors.teachers.base, 
        backgroundColor: (context) => getGradient(context, "rgba(16, 185, 129, 0.4)", "rgba(16, 185, 129, 0.0)"), 
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: "#fff"
      },
      { 
        label: "Classes", data: monthlyData.classes, yAxisID: 'y', borderColor: colors.classes.base, 
        backgroundColor: (context) => getGradient(context, "rgba(245, 158, 11, 0.4)", "rgba(245, 158, 11, 0.0)"), 
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: "#fff"
      },
      { 
        label: "Fees", data: monthlyData.fees, yAxisID: 'y1', borderColor: colors.fees.base, 
        backgroundColor: (context) => getGradient(context, "rgba(236, 72, 153, 0.4)", "rgba(236, 72, 153, 0.0)"), 
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointBackgroundColor: "#fff"
      },
    ],
  };

  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [{
      data: [attendanceSummary.present, attendanceSummary.absent],
      backgroundColor: [colors.teachers.base, "#f43f5e"],
      hoverBackgroundColor: ["#059669", "#e11d48"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const feeStatusData = {
    labels: ["Paid", "Pending"],
    datasets: [{
      data: [feeSummary.paid, feeSummary.pending],
      backgroundColor: [colors.sections.base, colors.classes.base],
      hoverBackgroundColor: ["#0284c7", "#d97706"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const combinedDistributionData = [
    ...distribution.classWiseStudents.map((r) => ({ label: `Class ${r.className}`, count: r.count, color: colors.classes.base })),
    ...distribution.sectionWiseStudents.map((r) => ({ label: `Sec ${r.section}`, count: r.count, color: colors.teachers.base })),
    ...distribution.streamWiseStudents.map((r) => ({ label: `Str ${r.stream}`, count: r.count, color: colors.students.base })),
  ];
  
  const distributionChart = {
    labels: combinedDistributionData.map((r) => r.label),
    datasets: [{
      data: combinedDistributionData.map((r) => r.count),
      backgroundColor: combinedDistributionData.map((r) => r.color + "80"),
      borderColor: combinedDistributionData.map((r) => r.color),
      borderWidth: 1,
      hoverBackgroundColor: combinedDistributionData.map((r) => r.color + "E6"),
    }],
  };

  const classFeeChart = {
    labels: distribution.classWiseFees.map((r) => r.label),
    datasets: [
      { label: "Paid", data: distribution.classWiseFees.map((r) => r.paidAmount), backgroundColor: colors.teachers.base, borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 }, borderSkipped: false },
      { label: "Pending", data: distribution.classWiseFees.map((r) => r.remainingAmount), backgroundColor: colors.classes.base, borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }, borderSkipped: false },
    ],
  };

  return (
    <div className="min-vh-100 py-4" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        .icon-box { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .stat-card:hover .icon-box { transform: scale(1.15) rotate(5deg); }
      `}</style>

      <div className="container-fluid px-4">
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 fade-in-up" style={{ animationDelay: "0ms" }}>
          <div>
            <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: "-0.5px" }}>SchoolY Dashboard</h2>
            <p className="text-muted mb-0">Welcome back! Here's what's happening across your institution today.</p>
          </div>
          
        </div>

        {/* Stats Grid */}
        <div className="row g-4 mb-5">
          {cards.map((c, idx) => (
            <div className="col-12 col-sm-6 col-xl-4 fade-in-up" key={idx} style={{ animationDelay: `${(idx + 1) * 75}ms` }}>
              <Card className="border-0 shadow-sm rounded-4 h-100 stat-card overflow-hidden">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-secondary fw-semibold mb-1 text-uppercase tracking-wider" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>{c.title}</p>
                      <h3 className="fw-bold text-dark mb-0" style={{ fontSize: "2.25rem", letterSpacing: "-1px" }}>{c.value.toLocaleString()}</h3>
                    </div>
                    <div className="icon-box d-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{ width: 54, height: 54, background: c.theme.grad, color: "white" }}>
                      {c.icon}
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top" style={{ borderColor: "#f1f5f9" }}>
                    <span className="badge rounded-pill fw-semibold px-3 py-2" style={{ background: c.theme.light, color: c.theme.base }}>
                      {c.sub}
                    </span>
                    <Link to={c.link} className="text-decoration-none small fw-bold text-secondary hover-primary">
                      View details →
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>

        {/* Charts Row 1: Line Chart */}
        <div className="row mb-4 fade-in-up" style={{ animationDelay: "500ms" }}>
          <div className="col-12">
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="fw-bold mb-1">Growth & Trends</h5>
                    <p className="text-muted small mb-0">Monthly analysis of student enrollments and fee collections.</p>
                  </div>
                  <button className="btn btn-light btn-sm rounded-circle"><FaEllipsisV className="text-muted"/></button>
                </div>
                <div style={{ height: "400px" }}>
                  <Line data={lineChartData} options={lineOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Charts Row 2: Doughnut & Gauge Charts with Custom Center Text */}
        <div className="row g-4 mb-4 fade-in-up" style={{ animationDelay: "600ms" }}>
          <div className="col-12 col-lg-6">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 p-md-5">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">Staff Attendance</h5>
                  <p className="text-muted small mb-0">Today's present vs absent ratio.</p>
                </div>
                <div style={{ height: "300px", position: "relative" }}>
                  <Doughnut 
                    data={attendanceData} 
                    options={doughnutOptions} 
                    plugins={[attendanceCenterText]} 
                  />
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 p-md-5">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">Overall Fee Status</h5>
                  <p className="text-muted small mb-0">Comparison of paid vs pending fees.</p>
                </div>
                <div style={{ height: "300px", position: "relative" }}>
                  <Doughnut 
                    data={feeStatusData} 
                    options={halfDoughnutOptions} 
                    plugins={[feeCenterText]} 
                  />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Charts Row 3: Polar Area & Stacked Bar */}
        <div className="row g-4 fade-in-up" style={{ animationDelay: "700ms" }}>
          <div className="col-12 col-xl-6">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 p-md-5">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">Student Demographics</h5>
                  <p className="text-muted small mb-0">Population across classes, sections, and streams.</p>
                </div>
                <div style={{ height: "350px" }}>
                  <PolarArea data={distributionChart} options={polarOptions} />
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-xl-6">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4 p-md-5">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">Class-wise Revenue</h5>
                  <p className="text-muted small mb-0">Financial breakdown (Paid vs Pending) per class.</p>
                </div>
                <div style={{ height: "350px" }}>
                  <Bar data={classFeeChart} options={stackedBarOptions} />
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