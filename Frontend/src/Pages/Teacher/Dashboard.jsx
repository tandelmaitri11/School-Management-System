import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner, Table } from "react-bootstrap";
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
import { Link } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ALERT_WINDOW_MINUTES = 10;

const toMinutes = (value) => {
  const [h, m] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const parseStartMinutes = (timeRange) => {
  const start = String(timeRange || "").split("-")[0]?.trim();
  return toMinutes(start);
};

const getTodayName = () => new Date().toLocaleDateString("en-US", { weekday: "long" });

const getLectureKey = (lecture) =>
  [lecture.day, lecture.period, lecture.className, lecture.section, lecture.stream, lecture.subject].join("__");

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [notifyPermission, setNotifyPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "denied"
  );

  const teacherId = localStorage.getItem("teacherId");
  const { notifications, unreadCount, loading: notificationsLoading } = useNotifications(6);
  const alertedLecturesRef = useRef(new Set());

  useEffect(() => {
    if (!teacherId) {
      console.error("No teacherId found in localStorage");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [dashRes, profileRes, timetableRes] = await Promise.allSettled([
          api.get(`/api/teacher/dashboard/${teacherId}`),
          api.get(`/api/teachers/teacher/profile/${teacherId}`),
          api.get(`/api/teachers/timetable/${teacherId}`),
        ]);

        if (dashRes.status === "fulfilled") {
          setData(dashRes.value.data);
        } else {
          console.error("Dashboard API failed:", dashRes.reason);
        }

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data || null);
          setProfileError("");
        } else {
          const status = profileRes.reason?.response?.status;
          if (status === 404) {
            setProfile(null);
            setProfileError("Teacher profile details are not set yet. Ask admin to complete your teacher profile.");
          } else {
            console.error("Profile API failed:", profileRes.reason);
            setProfileError("Unable to load full teacher profile.");
          }
        }

        if (timetableRes.status === "fulfilled") {
          setTimetable(Array.isArray(timetableRes.value.data) ? timetableRes.value.data : []);
        } else {
          console.error("Timetable API failed:", timetableRes.reason);
          setTimetable([]);
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    const key = `teacher_lecture_alerts_${teacherId}_${new Date().toISOString().slice(0, 10)}`;
    const existing = sessionStorage.getItem(key);
    alertedLecturesRef.current = new Set(existing ? JSON.parse(existing) : []);
  }, [teacherId]);

  const sortedTimetable = useMemo(() => {
    const rows = Array.isArray(timetable) ? [...timetable] : [];
    rows.sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return Number(a.period || 0) - Number(b.period || 0);
    });
    return rows;
  }, [timetable]);

  const todayLectures = useMemo(() => {
    const today = getTodayName();
    return sortedTimetable
      .filter((x) => x.day === today)
      .map((x) => ({ ...x, startMinutes: parseStartMinutes(x.time) }))
      .sort((a, b) => Number(a.startMinutes || 0) - Number(b.startMinutes || 0));
  }, [sortedTimetable, nowTick]);

  const nextLecture = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return (
      todayLectures.find((lecture) => Number.isFinite(lecture.startMinutes) && lecture.startMinutes >= nowMinutes) ||
      null
    );
  }, [todayLectures, nowTick]);

  const minutesToNextLecture = useMemo(() => {
    if (!nextLecture || !Number.isFinite(nextLecture.startMinutes)) return null;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nextLecture.startMinutes - nowMinutes;
  }, [nextLecture, nowTick]);

  useEffect(() => {
    if (!nextLecture) return;
    if (notifyPermission !== "granted") return;
    if (!Number.isFinite(minutesToNextLecture)) return;
    if (minutesToNextLecture < 0 || minutesToNextLecture > ALERT_WINDOW_MINUTES) return;

    const lectureKey = getLectureKey(nextLecture);
    if (alertedLecturesRef.current.has(lectureKey)) return;

    try {
      new Notification("Upcoming Lecture", {
        body: `${nextLecture.subject} - Class ${nextLecture.className}${nextLecture.section ? ` (${nextLecture.section})` : ""} at ${nextLecture.time}`,
      });

      alertedLecturesRef.current.add(lectureKey);
      const storageKey = `teacher_lecture_alerts_${teacherId}_${new Date().toISOString().slice(0, 10)}`;
      sessionStorage.setItem(storageKey, JSON.stringify(Array.from(alertedLecturesRef.current)));
    } catch (err) {
      console.error("Notification error:", err);
    }
  }, [minutesToNextLecture, nextLecture, notifyPermission, teacherId]);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await window.Notification.requestPermission();
    setNotifyPermission(permission);
  };

  const pieColors = ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#8e44ad"];
  const assignedSections = Array.isArray(profile?.assignedSections) ? profile.assignedSections : [];
  const classesFull = Array.isArray(profile?.classesFull) ? profile.classesFull : [];
  const pieData = data?.studentsPerClass || [];

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
        <h5 className="mt-3 text-muted fw-light">Loading Dashboard...</h5>
      </div>
    );

  if (!data)
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Alert variant="danger" className="text-center shadow-sm w-75 rounded-4">
          <i className="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
          <h5 className="mb-0">Unable to fetch dashboard data.</h5>
        </Alert>
      </Container>
    );

  const hoverStyle = { transition: "all 0.2s ease-in-out", cursor: "pointer" };
  const hoverEffect = (e, enter) => {
    if (enter) {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";
    } else {
      e.currentTarget.style.transform = "translateY(0px)";
      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.04)";
    }
  };

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark mb-0">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>
          Teacher Dashboard
        </h3>
        <div className="text-muted d-none d-md-block">
          <i className="bi bi-calendar3 me-2"></i>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {profileError && (
        <Alert variant="warning" className="mb-4 rounded-3 shadow-sm border-start border-4 border-warning">
          <i className="bi bi-info-circle-fill me-2"></i>
          {profileError}
        </Alert>
      )}

      {/* Stats Row */}
      <Row className="g-3 mb-4">
        {[
          { label: "Total Classes", value: data.totalClasses, icon: "bi-easel2-fill", color: "primary" },
          { label: "Total Sections", value: assignedSections.length, icon: "bi-grid-3x3-gap-fill", color: "info" },
          { label: "Total Students", value: data.totalStudents, icon: "bi-people-fill", color: "success" },
          { label: "Assignments", value: data.totalAssignments, icon: "bi-journal-check", color: "warning" },
          { label: "Pending Tasks", value: data.pendingAssignments, icon: "bi-hourglass-split", color: "danger" },
          { label: "Lectures Today", value: todayLectures.length, icon: "bi-calendar2-week-fill", color: "secondary" },
        ].map((card, i) => (
          <Col xs={12} sm={6} md={4} lg={2} key={i}>
            <Card
              className={`border-0 rounded-3 shadow-sm h-100 border-start border-4 border-${card.color}`}
              style={hoverStyle}
              onMouseEnter={(e) => hoverEffect(e, true)}
              onMouseLeave={(e) => hoverEffect(e, false)}
            >
              <Card.Body className="d-flex align-items-center justify-content-between p-3">
                <div>
                  <h6 className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    {card.label}
                  </h6>
                  <h3 className="fw-bold text-dark mb-0">{card.value || 0}</h3>
                </div>
                <div className={`text-${card.color} opacity-75`}>
                  <i className={`bi ${card.icon} fs-1`}></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        {/* Today's Lectures */}
        <Col xs={12} lg={8}>
          <Card className="border-0 rounded-3 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-clock-history text-success me-2"></i>Today's Lectures
              </h5>
              <Button as={Link} to="/teacher/timetable" size="sm" variant="outline-primary" className="fw-semibold rounded-pill px-3">
                View Full Timetable
              </Button>
            </Card.Header>
            <Card.Body className="p-3">
              <Table hover borderless responsive className="align-middle mb-0">
                <thead className="border-bottom text-muted" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <tr>
                    <th className="fw-semibold">Time</th>
                    <th className="fw-semibold">Subject</th>
                    <th className="fw-semibold">Class</th>
                    <th className="fw-semibold">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLectures.length ? (
                    todayLectures.map((lecture, idx) => (
                      <tr key={`${lecture.period}-${idx}`} className="border-bottom">
                        <td className="text-dark fw-medium py-3">
                          <i className="bi bi-clock me-2 text-muted"></i>{lecture.time}
                        </td>
                        <td className="fw-bold text-primary">{lecture.subject}</td>
                        <td className="text-secondary">Class {lecture.className}</td>
                        <td>
                          <Badge bg="light" text="dark" className="border px-2 py-1">
                            {lecture.section || "-"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        <div className="p-3 bg-light rounded-3 d-inline-block mt-2">
                          <i className="bi bi-emoji-smile fs-3 d-block mb-2 text-secondary"></i>
                          No lectures scheduled for today. Enjoy your free time!
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Lecture Alerts */}
        <Col xs={12} lg={4}>
          <Card className="border-0 rounded-3 shadow-sm h-100 bg-white">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-bell-fill text-danger me-2"></i>Lecture Alerts
              </h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center">
              {nextLecture ? (
                <Alert 
                  variant={minutesToNextLecture <= ALERT_WINDOW_MINUTES ? "danger" : "primary"} 
                  className={`border-0 border-start border-4 border-${minutesToNextLecture <= ALERT_WINDOW_MINUTES ? "danger" : "primary"} shadow-sm`}
                >
                  <h5 className="fw-bold mb-2">{nextLecture.subject}</h5>
                  <div className="mb-1 text-dark"><i className="bi bi-easel2 me-2"></i>Class {nextLecture.className}{nextLecture.section ? ` (Sec ${nextLecture.section})` : ""}</div>
                  <div className="mb-2 text-dark"><i className="bi bi-clock me-2"></i>{nextLecture.time}</div>
                  <hr />
                  <div className={`fw-bold text-${minutesToNextLecture <= ALERT_WINDOW_MINUTES ? "danger" : "primary"} mb-0`}>
                    <i className="bi bi-stopwatch me-1"></i>
                    {minutesToNextLecture === 0 ? "Starts right now!" : `Starts in ${minutesToNextLecture} minutes`}
                  </div>
                </Alert>
              ) : (
                <div className="text-center p-4 bg-light rounded-3 border border-light">
                  <i className="bi bi-check-circle-fill text-success fs-1 mb-2 d-block"></i>
                  <p className="text-muted fw-medium mb-0">You have no more upcoming lectures today.</p>
                </div>
              )}

              <div className="mt-4 text-center">
                {notifyPermission !== "granted" ? (
                  <Button variant="outline-primary" className="rounded-pill px-4" onClick={requestNotificationPermission}>
                    <i className="bi bi-browser-chrome me-2"></i>Enable Browser Alerts
                  </Button>
                ) : (
                  <Badge bg="success-subtle" text="success" className="px-3 py-2 rounded-pill border border-success-subtle">
                    <i className="bi bi-check2-circle me-1"></i> Browser alerts active
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Notifications and Classes Row */}
      <Row className="g-4 mb-4">
        {/* Latest Notifications */}
        <Col xs={12} lg={6}>
          <Card className="border-0 rounded-3 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-megaphone-fill text-info me-2"></i>Latest Notifications
              </h5>
              {unreadCount > 0 && <Badge bg="danger" className="rounded-pill px-2">{unreadCount} New</Badge>}
            </Card.Header>
            <Card.Body className="p-3">
              {notificationsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="grow" variant="info" size="sm" />
                </div>
              ) : (
                <Table hover borderless responsive className="align-middle mb-0">
                  <tbody>
                    {notifications?.length ? (
                      notifications.map((n) => (
                        <tr key={n._id} className="border-bottom">
                          <td className="py-3 w-75">
                            <div className="fw-bold text-dark mb-1">{n.title}</div>
                            <div className="text-muted small text-truncate" style={{ maxWidth: "300px" }}>{n.message}</div>
                          </td>
                          <td className="text-end py-3">
                            <Badge bg={n.isRead ? "light" : "primary-subtle"} text={n.isRead ? "secondary" : "primary"} className="rounded-pill px-3 py-1 border">
                              {n.isRead ? "Read" : "Unread"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="text-center py-4 text-muted bg-light rounded-3">
                          <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                          No new notifications.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Managed Classes */}
        <Col xs={12} lg={6}>
          <Card className="border-0 rounded-3 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-diagram-3-fill text-success me-2"></i>Managed Classes & Sections
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              {!classesFull.length ? (
                <div className="text-center py-4 bg-light rounded-3">
                  <i className="bi bi-journal-x fs-3 text-muted d-block mb-2"></i>
                  <p className="text-muted mb-0">No classes assigned to you yet.</p>
                </div>
              ) : (
                <Row className="g-3">
                  {classesFull.map((cls) => {
                    const sections = assignedSections.filter((s) => String(s.classId) === String(cls._id));
                    return (
                      <Col xs={12} sm={6} key={String(cls._id)}>
                        <div className="bg-light rounded-3 p-3 h-100 border border-light shadow-sm transition">
                          <div className="d-flex align-items-center mb-2">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                              <span className="fw-bold">{cls.className}</span>
                            </div>
                            <span className="fw-bold text-dark">Class {cls.className}</span>
                          </div>
                          <hr className="my-2 border-secondary opacity-25" />
                          {sections.length === 0 ? (
                            <div className="text-muted small fst-italic">No sections assigned</div>
                          ) : (
                            <div className="d-flex flex-wrap gap-1 mt-2">
                              {sections.map((s, idx) => (
                                <Badge 
                                  key={`${s.section}-${s.stream}-${idx}`} 
                                  bg="white" 
                                  text="dark" 
                                  className="border shadow-sm px-2 py-1"
                                >
                                  Sec {String(s.section || "").toUpperCase()}
                                  {s.stream ? <span className="text-muted ms-1 fw-normal">({s.stream})</span> : ""}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="g-4 mb-4">
        {/* Line Chart */}
        <Col xs={12} md={8}>
          <Card className="border-0 rounded-3 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-graph-up-arrow text-primary me-2"></i>Assignments Over Months
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              {data.assignmentsByMonth?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.assignmentsByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6c757d", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6c757d", fontSize: 12 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} 
                      formatter={(val) => [`${val} Assignments`, "Total"]} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    <Line type="monotone" dataKey="assignments" name="Assignments Given" stroke="#4e73df" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 min-vh-25 bg-light rounded-3">
                  <p className="text-muted mb-0"><i className="bi bi-bar-chart me-2"></i>No assignment data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Pie Chart */}
        <Col xs={12} md={4}>
          <Card className="border-0 rounded-3 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-pie-chart-fill text-warning me-2"></i>Students Per Class
              </h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              {pieData?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="studentsCount"
                      nameKey="className"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      label={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`${v} students`, "Total"]} 
                    />
                    <Legend iconType="circle" verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 w-100 bg-light rounded-3">
                  <p className="text-muted mb-0"><i className="bi bi-pie-chart me-2"></i>No student data available.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Assignments */}
      <Card className="border-0 rounded-3 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
          <h5 className="mb-0 fw-bold text-dark">
            <i className="bi bi-list-check text-secondary me-2"></i>Recent Assignments
          </h5>
        </Card.Header>
        <Card.Body className="p-3 p-md-4">
          <Table hover borderless responsive className="align-middle mb-0">
            <thead className="border-bottom text-muted" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
              <tr>
                <th className="fw-semibold px-3">#</th>
                <th className="fw-semibold">Assignment Title</th>
                <th className="fw-semibold">Assigned Class</th>
                <th className="fw-semibold text-end px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAssignments?.length ? (
                data.recentAssignments.map((a, idx) => {
                  const isPending = a.dueDate && new Date(a.dueDate) > new Date();
                  return (
                    <tr key={idx} className="border-bottom">
                      <td className="px-3 text-muted">{idx + 1}</td>
                      <td className="fw-bold text-dark">{a.title}</td>
                      <td>
                        <Badge bg="light" text="dark" className="border px-2 py-1">
                          {a.classAssigned}
                        </Badge>
                      </td>
                      <td className="text-end px-3">
                        <Badge
                          bg={isPending ? "warning-subtle" : "success-subtle"}
                          text={isPending ? "warning" : "success"}
                          className={`px-3 py-2 rounded-pill border border-${isPending ? "warning" : "success"}-subtle`}
                        >
                          <i className={`bi ${isPending ? 'bi-hourglass-split' : 'bi-check-circle'} me-1`}></i>
                          {isPending ? "Pending" : "Completed"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted bg-light rounded-3 mt-2 d-table-cell">
                    <i className="bi bi-clipboard-x fs-2 d-block mb-2"></i>
                    No recent assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}