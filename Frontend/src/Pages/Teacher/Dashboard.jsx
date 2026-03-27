import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner, Table, ProgressBar } from "react-bootstrap";
import {
  AreaChart,
  Area,
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
const PIE_COLORS = ["#0d6efd", "#20c997", "#ffc107", "#dc3545", "#0dcaf0", "#6f42c1"];

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

  // Fetch Data
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

  // Timers & Alert Tracking
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

  // Memos & Calculations
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

  // Notifications logic
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

  const assignedSections = Array.isArray(profile?.assignedSections) ? profile.assignedSections : [];
  const classesFull = Array.isArray(profile?.classesFull) ? profile.classesFull : [];
  const pieData = data?.studentsPerClass || [];

  // Conditional Rendering
  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
        <h5 className="mt-4 text-muted fw-bold text-uppercase" style={{ letterSpacing: "1px" }}>Loading Dashboard...</h5>
      </div>
    );
  }

  if (!data) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Alert variant="danger" className="text-center shadow-sm w-75 rounded-4 p-5 border-0">
          <i className="bi bi-exclamation-triangle-fill display-3 d-block mb-3 text-danger"></i>
          <h4 className="fw-bold mb-2">Unable to fetch dashboard data</h4>
          <p className="text-muted mb-0">Please check your connection and refresh the page.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100 px-lg-4">
      
      {/* --- CUSTOM STYLES (Kept minimal, relying mostly on Bootstrap) --- */}
      <style>{`
        .hover-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; }
        .card-header-custom { background-color: #ffffff; border-bottom: 1px solid #f8f9fa; padding: 1.25rem 1.5rem; }
        .table-custom th { font-size: 0.75rem; text-transform: uppercase; color: #6c757d; font-weight: 700; border-bottom: 2px solid #f8f9fa; padding: 1rem; }
        .table-custom td { padding: 1rem; vertical-align: middle; border-color: #f8f9fa; }
        .bg-gradient-primary { background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%); }
      `}</style>

      {/* --- HEADER --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
        <div>
          <Badge bg="primary-subtle" text="primary" className="px-3 py-2 rounded-pill fw-bold mb-2">
            <i className="bi bi-person-workspace me-2"></i>Educator Portal
          </Badge>
          <h2 className="fw-bold text-dark mb-0">Welcome back, {profile?.name || "Teacher"}!</h2>
          <p className="text-muted mb-0 mt-1">Here's your academic overview for today.</p>
        </div>
        <div className="text-md-end mt-3 mt-md-0 d-flex gap-3 align-items-center">
          <div className="bg-white px-4 py-2 rounded-4 shadow-sm border text-center">
            <div className="fw-bold text-dark fs-5">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            <div className="text-muted small text-uppercase fw-bold">{getTodayName()}</div>
          </div>
        </div>
      </div>

      {profileError && (
        <Alert variant="warning" className="mb-4 rounded-4 shadow-sm border-0 d-flex align-items-center">
          <i className="bi bi-info-circle-fill fs-4 me-3 text-warning"></i>
          <span className="fw-medium">{profileError}</span>
        </Alert>
      )}

      {/* --- QUICK STATS ROW --- */}
      <Row className="g-3 mb-4">
        {[
          { label: "Total Classes", value: data.totalClasses, icon: "bi-easel2-fill", color: "primary" },
          { label: "Active Sections", value: assignedSections.length, icon: "bi-grid-1x2-fill", color: "info" },
          { label: "Total Students", value: data.totalStudents, icon: "bi-people-fill", color: "success" },
          { label: "Assignments", value: data.totalAssignments, icon: "bi-journal-check", color: "warning" },
          { label: "Pending Tasks", value: data.pendingAssignments, icon: "bi-hourglass-split", color: "danger" },
          { label: "Lectures Today", value: todayLectures.length, icon: "bi-calendar2-week-fill", color: "secondary" },
        ].map((card, i) => (
          <Col xs={12} sm={6} md={4} lg={2} key={i}>
            <Card className="border-0 rounded-4 shadow-sm h-100 hover-card">
              <Card.Body className="d-flex flex-column justify-content-center p-3 p-xl-4 position-relative">
                <div className={`bg-${card.color}-subtle text-${card.color} rounded-3 d-flex align-items-center justify-content-center mb-3`} style={{ width: "45px", height: "45px" }}>
                  <i className={`bi ${card.icon} fs-4`}></i>
                </div>
                <h3 className="fw-bold text-dark mb-1">{card.value || 0}</h3>
                <h6 className="text-muted text-uppercase fw-bold mb-0" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                  {card.label}
                </h6>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* --- CHARTS & LIVE ALERT ROW --- */}
      <Row className="g-4 mb-4">
        
        {/* Main Analytics Chart */}
        <Col xs={12} xl={8}>
          <Card className="border-0 rounded-4 shadow-sm h-100">
            <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Assignment Activity Tracker</h5>
              <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">6-Month Trend</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              {data.assignmentsByMonth?.length ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={data.assignmentsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAssignments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6c757d", fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6c757d", fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} />
                      <Area type="monotone" dataKey="assignments" name="Assignments Given" stroke="#0d6efd" strokeWidth={4} fillOpacity={1} fill="url(#colorAssignments)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 bg-light rounded-4">
                  <p className="text-muted mb-0 fw-medium"><i className="bi bi-bar-chart me-2"></i>No assignment data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Live Lecture Alert Card */}
        <Col xs={12} xl={4}>
          <Card className="border-0 rounded-4 shadow-sm h-100 bg-gradient-primary text-white overflow-hidden position-relative">
            <div className="position-absolute top-0 end-0 p-3 opacity-25">
              <i className="bi bi-broadcast" style={{ fontSize: "8rem", transform: "rotate(15deg)" }}></i>
            </div>
            <Card.Body className="p-4 d-flex flex-column justify-content-between position-relative z-1">
              <div>
                <Badge bg="white" text="primary" className="rounded-pill px-3 py-2 mb-4 fw-bold shadow-sm">
                  <i className="bi bi-alarm-fill me-2"></i>Live Tracker
                </Badge>
                
                {nextLecture ? (
                  <>
                    <h6 className="text-uppercase fw-bold text-white-50 mb-2">Up Next</h6>
                    <h2 className="fw-bold mb-1">{nextLecture.subject}</h2>
                    <p className="fs-5 text-white-50 mb-0">Class {nextLecture.className} {nextLecture.section ? `• Sec ${nextLecture.section}` : ""}</p>
                    
                    <div className="bg-white bg-opacity-10 rounded-4 p-4 mt-4 text-center border border-white border-opacity-25">
                      <div className="small text-white-50 fw-bold text-uppercase mb-1">Starts In</div>
                      <div className="display-4 fw-bold">
                        {minutesToNextLecture === 0 ? "NOW" : `${minutesToNextLecture}m`}
                      </div>
                      <div className="mt-2 bg-white bg-opacity-25 rounded-pill d-inline-block px-3 py-1 small fw-medium">
                        {nextLecture.time}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5 mt-3">
                    <i className="bi bi-calendar-check display-3 d-block mb-3 text-white-50"></i>
                    <h4 className="fw-bold">Schedule Clear</h4>
                    <p className="text-white-50 mb-0">You have no more classes today.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-top border-white border-opacity-25 text-center">
                {notifyPermission !== "granted" ? (
                  <Button variant="light" className="w-100 rounded-pill fw-bold text-primary py-2 shadow-sm" onClick={requestNotificationPermission}>
                    <i className="bi bi-bell-fill me-2"></i>Turn On Alerts
                  </Button>
                ) : (
                  <span className="small text-white-50 fw-medium"><i className="bi bi-check-circle-fill me-2 text-white"></i>Browser notifications active</span>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- SCHEDULE & DEMOGRAPHICS ROW --- */}
      <Row className="g-4 mb-4">
        
        {/* Today's Lectures Table */}
        <Col xs={12} lg={7}>
          <Card className="border-0 rounded-4 shadow-sm h-100">
            <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Today's Timeline</h5>
              <Button as={Link} to="/teacher/timetable" variant="outline-primary" size="sm" className="rounded-pill px-4 fw-bold">
                Full Schedule
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="table-custom table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Time & Period</th>
                      <th>Subject Details</th>
                      <th>Class Location</th>
                      <th className="pe-4 text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayLectures.length ? (
                      todayLectures.map((lecture, idx) => {
                        const isPast = lecture.startMinutes < (new Date().getHours() * 60 + new Date().getMinutes());
                        return (
                          <tr key={`${lecture.period}-${idx}`} style={{ opacity: isPast ? 0.6 : 1 }}>
                            <td className="ps-4">
                              <span className="fw-bold text-dark d-block">{lecture.time}</span>
                              <span className="small text-muted fw-medium">Period {lecture.period}</span>
                            </td>
                            <td>
                              <span className="fw-bold text-primary d-block">{lecture.subject}</span>
                              <span className="small text-muted">{lecture.stream || "General"}</span>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill fw-medium">
                                Class {lecture.className}{lecture.section ? `-${lecture.section}` : ""}
                              </Badge>
                            </td>
                            <td className="pe-4 text-end">
                              {isPast ? (
                                <Badge bg="success-subtle" text="success" className="px-3 py-2 rounded-pill"><i className="bi bi-check-all me-1"></i>Completed</Badge>
                              ) : (
                                <Badge bg="primary-subtle" text="primary" className="px-3 py-2 rounded-pill">Upcoming</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted bg-light m-2 rounded-4">
                          <i className="bi bi-cup-hot fs-1 d-block mb-3 text-secondary"></i>
                          <h6 className="fw-bold">No lectures scheduled</h6>
                          <p className="mb-0 small">Enjoy your free time!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Demographics Pie Chart */}
        <Col xs={12} lg={5}>
          <Card className="border-0 rounded-4 shadow-sm h-100">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0 fw-bold text-dark">Student Demographics</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              {pieData?.length ? (
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="studentsCount"
                        nameKey="className"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        stroke="none"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} formatter={(v) => [`${v} Students`, "Total"]} />
                      <Legend iconType="circle" verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center bg-light p-5 rounded-4 w-100">
                  <i className="bi bi-pie-chart fs-1 text-secondary d-block mb-3"></i>
                  <p className="text-muted fw-medium mb-0">No student allocation data found.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- MANAGEMENT & NOTIFICATIONS ROW --- */}
      <Row className="g-4 mb-4">
        
        {/* Managed Classes Grid */}
        <Col xs={12} lg={6}>
          <Card className="border-0 rounded-4 shadow-sm h-100">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0 fw-bold text-dark">Managed Classes & Sections</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {!classesFull.length ? (
                <div className="text-center py-5 bg-light rounded-4">
                  <i className="bi bi-journal-x display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted fw-medium mb-0">No classes assigned to your profile yet.</p>
                </div>
              ) : (
                <Row className="g-3">
                  {classesFull.map((cls) => {
                    const sections = assignedSections.filter((s) => String(s.classId) === String(cls._id));
                    return (
                      <Col xs={12} md={6} key={String(cls._id)}>
                        <div className="bg-light rounded-4 p-3 border border-light shadow-sm hover-card h-100">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                              <span className="fw-bold">{cls.className}</span>
                            </div>
                            <h5 className="fw-bold text-dark mb-0">Class {cls.className}</h5>
                          </div>
                          {sections.length === 0 ? (
                            <div className="text-muted small fw-medium bg-white p-2 rounded-3 text-center border">No sections mapped</div>
                          ) : (
                            <div className="d-flex flex-wrap gap-2">
                              {sections.map((s, idx) => (
                                <Badge 
                                  key={`${s.section}-${s.stream}-${idx}`} 
                                  bg="white" 
                                  text="dark" 
                                  className="border shadow-sm px-3 py-2 rounded-pill fw-medium"
                                >
                                  Sec {String(s.section || "").toUpperCase()}
                                  {s.stream ? <span className="text-muted ms-1 text-capitalize fw-normal">({s.stream})</span> : ""}
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

        {/* Notifications List */}
        <Col xs={12} lg={6}>
          <Card className="border-0 rounded-4 shadow-sm h-100">
            <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Latest Notifications</h5>
              {unreadCount > 0 && <Badge bg="danger" className="rounded-pill px-3 py-2 shadow-sm">{unreadCount} New</Badge>}
            </Card.Header>
            <Card.Body className="p-0">
              {notificationsLoading ? (
                <div className="text-center py-5"><Spinner animation="grow" variant="primary" /></div>
              ) : (
                <div className="list-group list-group-flush rounded-bottom-4">
                  {notifications?.length ? (
                    notifications.map((n) => (
                      <div key={n._id} className={`list-group-item p-4 border-bottom ${n.isRead ? 'bg-white' : 'bg-primary-subtle'}`}>
                        <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold mb-0 text-dark">{n.title}</h6>
                          <Badge bg={n.isRead ? "light" : "primary"} text={n.isRead ? "secondary" : "white"} className="rounded-pill border">
                            {n.isRead ? "Read" : "Unread"}
                          </Badge>
                        </div>
                        <p className="mb-0 text-muted small lh-lg" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5 text-muted bg-light m-3 rounded-4">
                      <i className="bi bi-inbox fs-1 d-block mb-3 text-secondary"></i>
                      <h6 className="fw-bold">No new notifications</h6>
                      <p className="mb-0 small">You're all caught up!</p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- RECENT ASSIGNMENTS FULL WIDTH ROW --- */}
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <Card className="border-0 rounded-4 shadow-sm">
            <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Recent Assignments Tracker</h5>
              <Button as={Link} to="/teacher/viewassignment" variant="light" size="sm" className="rounded-pill px-3 fw-bold border text-primary">View All</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="table-custom align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4">Assignment Info</th>
                      <th>Target Class</th>
                      <th style={{ minWidth: "200px" }}>Completion Status</th>
                      <th className="pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAssignments?.length ? (
                      data.recentAssignments.map((a, idx) => {
                        const isPending = a.dueDate && new Date(a.dueDate) > new Date();
                        return (
                          <tr key={idx}>
                            <td className="ps-4">
                              <span className="fw-bold text-dark d-block fs-6">{a.title}</span>
                              <span className="small text-muted">Created recently</span>
                            </td>
                            <td>
                              <Badge bg="secondary" className="px-3 py-2 rounded-pill bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium">
                                {a.classAssigned}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex justify-content-between small mb-2">
                                <span className={`fw-bold ${isPending ? "text-warning" : "text-success"}`}>
                                  {isPending ? "Pending Submissions" : "Completed & Graded"}
                                </span>
                              </div>
                              <ProgressBar 
                                now={isPending ? 65 : 100} 
                                variant={isPending ? "warning" : "success"} 
                                style={{ height: "6px", borderRadius: "10px" }} 
                              />
                            </td>
                            <td className="pe-4 text-end">
                              <Button as={Link} to="/teacher/viewassignment" variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold">Review</Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted bg-light m-3 rounded-4">
                          <i className="bi bi-clipboard-x display-4 d-block mb-3 text-secondary"></i>
                          <h6 className="fw-bold">No Active Assignments</h6>
                          <p className="mb-0 small">Create assignments to track progress here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  );
}