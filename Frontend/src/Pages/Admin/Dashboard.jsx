import React, { useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";
import { 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaChalkboard, 
  FaWallet 
} from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import api from "../../api/api";

// Register chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

function Dashboard() {
  const [data, setData] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    fees: 0,
  });

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

  const cards = [
    {
      title: "Students",
      text: `${data.students} registered`,
      icon: <FaUserGraduate size={50} />,
      gradient: "linear-gradient(135deg, #f3a847, #d17b27)",
      link: "/Students/allstudents",
    },
    {
      title: "Teachers",
      text: `${data.teachers} active`,
      icon: <FaChalkboardTeacher size={50} />,
      gradient: "linear-gradient(135deg, #64b5f6, #1976d2)",
      link: "/teacher/allteacher",
    },
    {
      title: "Classes",
      text: `${data.classes} total`,
      icon: <FaChalkboard size={50} />,
      gradient: "linear-gradient(135deg, #ff8a65, #d84315)",
      link: "/classes/all",
    },
    {
      title: "Fees",
      text: `${data.fees} transactions`,
      icon: <FaWallet size={50} />,
      gradient: "linear-gradient(135deg, #ba68c8, #6a1b9a)",
      link: "/studentfees",
    },
  ];

  const lineChartData = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    datasets: [
      {
        label: "Students",
        data: monthlyData.students,
        borderColor: "#f3a847",
        backgroundColor: "rgba(243,168,71,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
      {
        label: "Teachers",
        data: monthlyData.teachers,
        borderColor: "#64b5f6",
        backgroundColor: "rgba(100,181,246,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
      {
        label: "Classes",
        data: monthlyData.classes,
        borderColor: "#ff8a65",
        backgroundColor: "rgba(255,138,101,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
      {
        label: "Fees",
        data: monthlyData.fees,
        borderColor: "#ba68c8",
        backgroundColor: "rgba(186,104,200,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        callbacks: {
          label: function(context) {
            if (context.dataset.label === "Fees") {
              return `Fees: ₹${context.parsed.y.toLocaleString()}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  const attendanceData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Teacher Attendance',
        data: [attendanceSummary.present, attendanceSummary.absent],
        backgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#28a745', '#dc3545'],
        borderWidth: 1,
      },
    ],
  };

  const feeData = {
    labels: ['Paid', 'Pending'],
    datasets: [
      {
        label: 'Fee Status',
        data: [feeSummary.paid, feeSummary.pending],
        backgroundColor: ['#007bff', '#ffc107'],
        borderColor: ['#007bff', '#ffc107'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container py-5 position-relative">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-dark">Admin Dashboard</h2>
        <p className="text-muted">Overview of your school’s key metrics and activities.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="row g-4 justify-content-center mb-5">
        {cards.map((card, idx) => (
          <div className="col-md-3 col-sm-6" key={idx}>
            <Card
              className="border-0 rounded-4 shadow-sm text-white"
              style={{
                background: card.gradient,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center py-4">
                <div className="mb-3">{card.icon}</div>
                <Card.Title className="fw-bold fs-5 mb-2">{card.title}</Card.Title>
                <Card.Text className="mb-3">{card.text}</Card.Text>
                <Button
                  href={card.link}
                  variant="light"
                  className="fw-semibold px-4 rounded-pill"
                  style={{
                    color: "#333",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "none",
                  }}
                >
                  Go to {card.title}
                </Button>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="row justify-content-center mb-5">
        <div className="col-12">
          <Card className="shadow-sm rounded-4 p-3">
            <div style={{ height: "500px" }}>
              <Line data={lineChartData} options={barChartOptions} />
            </div>
          </Card>
        </div>
      </div>

      {/* Attendance Bar Chart */}
      <div className="row justify-content-center mb-5">
        <div className="col-12 col-md-6">
          <Card className="shadow-sm rounded-4 p-3">
            <div style={{ height: "400px" }}>
              <Bar data={attendanceData} options={barChartOptions} />
            </div>
          </Card>
        </div>

        {/* Fee Status Bar Chart */}
        <div className="col-12 col-md-6">
          <Card className="shadow-sm rounded-4 p-3">
            <div style={{ height: "400px" }}>
              <Bar data={feeData} options={barChartOptions} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
