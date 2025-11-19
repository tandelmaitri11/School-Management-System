import React, { useState, useEffect } from "react";
import api from "../../api/api";
import TeacherNavbarMuted from "./teacher_navbar";
import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Container,
} from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (!teacherId) {
      console.error("❌ No teacherId found in localStorage!");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get(`/api/teacher/dashboard/${teacherId}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  const pieColors = [
    "#4e73df",
    "#1cc88a",
    "#36b9cc",
    "#f6c23e",
    "#e74a3b",
    "#8e44ad",
  ];

  if (loading)
    return (
      <TeacherNavbarMuted>
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading Dashboard...</p>
        </div>
      </TeacherNavbarMuted>
    );

  if (!data)
    return (
      <TeacherNavbarMuted>
        <h5 className="text-center text-danger mt-5">
          Unable to fetch dashboard data.
        </h5>
      </TeacherNavbarMuted>
    );

  // Inline hover style for cards
  const hoverStyle = {
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  const hoverEffect = (e, enter) => {
    if (enter) {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
    } else {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
    }
  };

  return (
    <TeacherNavbarMuted>
      <Container className="py-4">
        <h3 className="fw-bold text-secondary mb-4">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>Teacher Dashboard
        </h3>

        {/* Summary Cards */}
        <Row className="g-4 mb-4">
          {[
            { label: "Classes", value: data.totalClasses, icon: "bi-easel2-fill", color: "primary" },
            { label: "Students", value: data.totalStudents, icon: "bi-people-fill", color: "success" },
            { label: "Assignments", value: data.totalAssignments, icon: "bi-journal-text", color: "warning" },
            { label: "Pending", value: data.pendingAssignments, icon: "bi-hourglass-split", color: "danger" },
          ].map((card, i) => (
            <Col md={3} sm={6} key={i}>
              <Card
                className="border-0 rounded-4 shadow-sm"
                style={hoverStyle}
                onMouseEnter={(e) => hoverEffect(e, true)}
                onMouseLeave={(e) => hoverEffect(e, false)}
              >
                <Card.Body className="d-flex align-items-center justify-content-between p-4">
                  <div>
                    <h6 className="text-uppercase text-muted fw-semibold mb-1">
                      {card.label}
                    </h6>
                    <h2 className={`fw-bold text-${card.color}`}>
                      {card.value || 0}
                    </h2>
                  </div>
                  <div
                    className={`d-flex align-items-center justify-content-center rounded-circle bg-${card.color}-subtle text-${card.color}`}
                    style={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: `rgba(var(--bs-${card.color}-rgb), 0.1)`,
                    }}
                  >
                    <i className={`bi ${card.icon} fs-3`}></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts */}
        <Row className="g-4 mb-4">
          {/* Line Chart */}
          <Col md={8}>
            <Card
              className="border-0 rounded-4 shadow-sm"
              style={hoverStyle}
              onMouseEnter={(e) => hoverEffect(e, true)}
              onMouseLeave={(e) => hoverEffect(e, false)}
            >
              <Card.Header
                className="text-white rounded-top-4"
                style={{
                  background: "linear-gradient(90deg, #4e73df, #1cc88a)",
                }}
              >
                <h6 className="mb-0 fw-semibold">
                  <i className="bi bi-graph-up me-2"></i>Assignments Over Months
                </h6>
              </Card.Header>
              <Card.Body>
                {data.assignmentsByMonth?.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={data.assignmentsByMonth}
                      margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                      <XAxis dataKey="month" tick={{ fill: "#555" }} />
                      <YAxis tick={{ fill: "#555" }} />
                      <Tooltip
                        formatter={(val) => [`${val} Assignments`, "Count"]}
                        contentStyle={{ backgroundColor: "#fff", borderRadius: "10px" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="assignments"
                        stroke="#4e73df"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted mb-0">No data available</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Pie Chart */}
          <Col md={4}>
            <Card
              className="border-0 rounded-4 shadow-sm"
              style={hoverStyle}
              onMouseEnter={(e) => hoverEffect(e, true)}
              onMouseLeave={(e) => hoverEffect(e, false)}
            >
              <Card.Header
                className="text-white rounded-top-4"
                style={{
                  background: "linear-gradient(90deg, #36b9cc, #8e44ad)",
                }}
              >
                <h6 className="mb-0 fw-semibold">
                  <i className="bi bi-pie-chart me-2"></i>Students Per Class
                </h6>
              </Card.Header>
              <Card.Body>
                {data.studentsPerClass?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.studentsPerClass}
                        dataKey="studentsCount"
                        nameKey="className"
                        cx="50%"
                        cy="45%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {data.studentsPerClass.map((entry, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} students`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted mb-0">
                    No student data available.
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Assignments */}
        <Card
          className="border-0 rounded-4 shadow-sm"
          style={hoverStyle}
          onMouseEnter={(e) => hoverEffect(e, true)}
          onMouseLeave={(e) => hoverEffect(e, false)}
        >
          <Card.Header
            className="text-white rounded-top-4"
            style={{
              background: "linear-gradient(90deg, #f6c23e, #e74a3b)",
            }}
          >
            <h6 className="mb-0 fw-semibold">
              <i className="bi bi-list-check me-2"></i>Recent Assignments
            </h6>
          </Card.Header>
          <Card.Body>
            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssignments?.length ? (
                  data.recentAssignments.map((a, idx) => (
                    <tr
                      key={idx}
                      style={{
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8f9fa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{a.title}</td>
                      <td>{a.classAssigned}</td>
                      <td>
                        <Badge
                          bg={
                            a.dueDate && new Date(a.dueDate) > new Date()
                              ? "warning"
                              : "success"
                          }
                          text={
                            a.dueDate && new Date(a.dueDate) > new Date()
                              ? "dark"
                              : "light"
                          }
                          className="px-3 py-2 rounded-pill"
                        >
                          {a.dueDate && new Date(a.dueDate) > new Date()
                            ? "Pending"
                            : "Completed"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No recent assignments.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </TeacherNavbarMuted>
  );
}
