import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// --- SAAS COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#eef2ff",
  success: "#10b981", // Emerald
  successLight: "#ecfdf5",
  warning: "#f59e0b", // Amber
  warningLight: "#fffbeb",
  danger: "#ef4444", // Red
  dangerLight: "#fef2f2",
  info: "#3b82f6", // Blue
  infoLight: "#eff6ff",
  bg: "#f8fafc", // Slate 50
  surface: "#ffffff",
  textMain: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#e2e8f0" // Slate 200
};

const periodTimeMap = {
  1: "09:00 - 10:00",
  2: "10:00 - 11:00",
  3: "11:15 - 12:15",
  4: "14:00 - 15:00",
  5: "15:00 - 16:00",
};

// --- SAAS UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: ${colors.bg};
  }

  .fade-in { animation: fadeIn 0.5s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* SaaS Cards */
  .saas-card {
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
    transition: all 0.25s ease;
  }
  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
    border-color: #cbd5e1;
  }

  /* Seamless Tables */
  .saas-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  .saas-table th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${colors.textMuted};
    padding: 1rem 1.25rem;
    border-bottom: 1px solid ${colors.border};
    background-color: #fcfcfd;
  }
  .saas-table td {
    padding: 1.25rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    font-size: 0.9rem;
  }
  .saas-table tr:last-child td { border-bottom: none; }
  .saas-table tbody tr { transition: background-color 0.2s ease; }
  .saas-table tbody tr:hover { background-color: #f8fafc; }

  /* Soft Alerts */
  .saas-alert {
    border: none;
    border-left: 4px solid;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  
  .icon-box {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }
`;

export default function StudentDashboard() {
  const studentId = localStorage.getItem("studentId");
  const token = localStorage.getItem("token");
  const lastSeenAssignmentGradeAt = localStorage.getItem("lastSeenAssignmentGradeAt");
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState({ presentDays: 0, absentDays: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [fees, setFees] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [exams, setExams] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [placementNotice, setPlacementNotice] = useState(null);
  
  // Notification State
  const [showAssignmentAlert, setShowAssignmentAlert] = useState(true);
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  // --- DATA LOADING ---
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!studentId) return;
        const profileRes = await api.get(`/api/studentDashboard/profile/${studentId}`);
        const profile = profileRes.data;
        const prevClass = localStorage.getItem("studentClass") || "";
        const prevSection = localStorage.getItem("studentSection") || "";
        const prevStream = localStorage.getItem("studentStream") || "";
        const seenPromotionWelcomeAt = localStorage.getItem("seenPromotionWelcomeAt") || "";
        const nextClass = String(profile?.studentClass || "");
        const nextSection = String(profile?.section || "");
        const nextStream = String(profile?.stream || "");
        const nextPromotedAt = String(profile?.promotedAt || "");

        if (profile?.completionStatus === "Completed Class 12" || profile?.isActive === false) {
          setPlacementNotice({
            type: "success",
            icon: "bi-mortarboard",
            title: "Course Completed",
            message: "You have successfully completed Class 12. Your student profile has been updated.",
          });
        } else if (profile?.isNewPromotion) {
          if (nextPromotedAt && seenPromotionWelcomeAt !== nextPromotedAt) {
            setPlacementNotice({
              type: "success",
              icon: "bi-stars",
              title: "Welcome To Your New Class",
              message: `Welcome to Class ${nextClass}${nextSection ? `-${nextSection}` : ""}${nextStream ? ` (${nextStream})` : ""}. Your promotion has been updated successfully.`,
            });
            localStorage.setItem("seenPromotionWelcomeAt", nextPromotedAt);
          } else {
            setPlacementNotice(null);
          }
        } else if (
          prevClass &&
          (prevClass !== nextClass || prevSection !== nextSection || prevStream !== nextStream)
        ) {
          setPlacementNotice({
            type: "info",
            icon: "bi-arrow-up-circle",
            title: "Promotion Updated",
            message: `Your academic placement is now Class ${nextClass}${nextSection ? `-${nextSection}` : ""}${nextStream ? ` (${nextStream})` : ""}.`,
          });
        } else {
          setPlacementNotice(null);
        }

        localStorage.setItem("studentClass", nextClass);
        localStorage.setItem("studentSection", nextSection);
        localStorage.setItem("studentStream", nextStream);
        localStorage.setItem("completionStatus", String(profile?.completionStatus || ""));
        localStorage.setItem("isNewPromotion", String(!!profile?.isNewPromotion));
        localStorage.setItem("userName", profile?.name || localStorage.getItem("userName") || "Student");

        setStudent(profile);

        const [assignRes, attendRes, submitRes, feeRes, examsRes, timetableRes] = await Promise.all([
          api.get(`/api/studentDashboard/assignments/${profile.studentClass}?studentId=${studentId}`),
          api.get(`/api/studentDashboard/attendance/${studentId}`),
          api.get(`/api/studentDashboard/submissions/${studentId}`),
          api.get(`/api/fees/student/${studentId}`),
          api.get(`/api/student/exams`),
          api.get(`/api/students/timetable/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: {} })),
        ]);

        setAssignments(assignRes.data);
        setAttendance(attendRes.data);
        setSubmissions(submitRes.data);
        setFees(feeRes.data.fees);
        setFeeSummary(feeRes.data.feeSummary || null);
        setExams(examsRes.data.exams || []);
        setTimetable(timetableRes.data || {});
        setLoadError("");
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        const status = err?.response?.status;
        setLoadError(status ? `Dashboard data could not load (HTTP ${status}).` : "Dashboard data could not load.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [studentId, token]);

  useEffect(() => {
    const latestGraded = [...submissions]
      .filter((s) => s?.grade)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];

    if (latestGraded) {
      localStorage.setItem("lastSeenAssignmentGradeAt", latestGraded.updatedAt || latestGraded.createdAt);
    }
  }, [submissions]);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: colors.bg }}>
        <div className="spinner-border" style={{ color: colors.primary, width: '3rem', height: '3rem' }} role="status"></div>
      </div>
    );

  if (!student) return <div className="text-center mt-5">Student not found</div>;

  // --- CALCULATIONS ---
  const totalDays = attendance.presentDays + attendance.absentDays;
  const attendancePercent = totalDays
    ? ((attendance.presentDays / totalDays) * 100).toFixed(1)
    : 0;

  const submittedAssignmentIds = new Set(
    submissions
      .map((s) => String(s.assignmentId?._id || s.assignmentId || ""))
      .filter(Boolean)
  );
  const pendingAssignments = assignments.filter((a) => !submittedAssignmentIds.has(String(a._id)));
  const gradedCount = submissions.filter((s) => s.grade).length;
  const pendingSubmission = pendingAssignments.length;
  const totalDue = Number(feeSummary?.totalDue ?? ((fees?.remainingAmount || 0) + (fees?.lateFeeAccrued || 0)));
  const isPaid = totalDue <= 0;
  const now = new Date();
  const upcomingExams = exams
    .filter((e) => new Date(e.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const nextExam = upcomingExams[0];
  const latestGradedSubmission = [...submissions]
    .filter((s) => s?.grade)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
  const hasNewAssignmentGrade =
    latestGradedSubmission &&
    (!lastSeenAssignmentGradeAt ||
      new Date(latestGradedSubmission.updatedAt || latestGradedSubmission.createdAt) > new Date(lastSeenAssignmentGradeAt));
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayTimetable = Array.isArray(timetable?.[todayName]) ? timetable[todayName] : [];
  const todayPeriods = todayTimetable
    .map((entry, index) => ({
      period: index + 1,
      time: periodTimeMap[index + 1] || "Time not set",
      subject: entry?.subject || "Free",
      teacher: entry?.teacher || "-",
    }));

  // --- NOTIFICATION LOGIC ---
  const notifications = [];
  
  if (!isPaid && fees) {
    notifications.push({
      id: 'fees',
      type: 'danger',
      icon: 'bi-exclamation-triangle',
      title: 'Fee Payment Pending',
      message: `You have a total due of ${formatMoney(totalDue)}. Please clear your dues.`,
      action: 'Pay Now',
      actionLink: '/student/fees'
    });
  }

  if (pendingSubmission > 0 && showAssignmentAlert) {
    notifications.push({
      id: 'assignments',
      type: 'warning',
      icon: 'bi-journal-bookmark',
      title: 'Pending Assignments',
      message: `You have ${pendingSubmission} assignment${pendingSubmission > 1 ? 's' : ''} waiting for submission.`,
      dismissible: true
    });
  }

  if (nextExam) {
    notifications.push({
      id: 'exam',
      type: 'info',
      icon: 'bi-calendar-event',
      title: 'New Exam Scheduled',
      message: `${nextExam.title} • ${nextExam.subjectName || "Subject"} • ${new Date(nextExam.startTime).toLocaleString()}`,
      action: 'View Exams',
      actionLink: '/student/exams',
    });
  }

  if (hasNewAssignmentGrade) {
    notifications.push({
      id: "assignment-grade",
      type: "success",
      icon: "bi-award",
      title: "Assignment Graded",
      message: `${latestGradedSubmission.assignmentId?.title || "Your assignment"} has been graded: ${latestGradedSubmission.grade}`,
      action: "View Assignments",
      actionLink: "/student/assignments",
    });
  }

  // --- CHART CONFIGURATIONS ---
  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [{ data: [attendance.presentDays, attendance.absentDays], backgroundColor: [colors.success, colors.danger], borderWidth: 0, hoverOffset: 4 }],
  };

  const doughnutOptions = {
    responsive: true,
    cutout: "80%",
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } } } },
    maintainAspectRatio: false,
  };

  const submissionData = {
    labels: ["Assigned", "Submitted", "Graded"],
    datasets: [{ label: "Count", data: [assignments.length, submissions.length, gradedCount], backgroundColor: [colors.primary, colors.warning, colors.success], borderRadius: 6, barThickness: 30 }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      y: { beginAtZero: true, border: { display: false }, grid: { color: '#f1f5f9', drawBorder: false } }, 
      x: { border: { display: false }, grid: { display: false } } 
    },
  };

  const feesData = {
    labels: ["Paid", "Total Due"],
    datasets: [{ data: fees ? [fees.paidAmount, totalDue] : [0, 0], backgroundColor: [colors.primary, "#e2e8f0"], borderWidth: 0 }],
  };

  const classLabel = student.completionStatus === "Completed Class 12" ? "Completed Class 12" : student.studentClass ? `Class ${student.studentClass}` : "Class N/A";
  const sectionLabel = student.section ? `-${student.section}` : "";
  const streamLabel = student.stream ? ` (${student.stream})` : "";
  const subjectChoiceLabel = student.subjectChoice ? ` | Choice: ${student.subjectChoice}` : "";

  return (
    <div className="pb-5 pt-3 fade-in" style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <style>{styles}</style>
      
      {/* Full width container with responsive horizontal padding */}
      <div className="container-fluid px-4 px-xl-5">
        
        {/* --- HEADER SECTION --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: colors.textMain, letterSpacing: '-0.5px' }}>Dashboard</h2>
            <p className="mb-0 fs-6" style={{ color: colors.textMuted }}>
              Welcome back, <span className="fw-bold" style={{ color: colors.primary }}>{student.name}</span>
            </p>
            <p className="mb-0 mt-1 small fw-medium" style={{ color: '#94a3b8' }}>
              {classLabel}{sectionLabel}{streamLabel}{subjectChoiceLabel}
            </p>
            {student.isNewPromotion && (
              <div className="mt-2">
                <span className="badge bg-warning text-dark rounded-pill px-3 py-1 fw-bold shadow-sm">NEW</span>
              </div>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-3">
             <div className="saas-card px-4 py-2 d-flex align-items-center gap-2 border-0 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                <i className="bi bi-calendar3" style={{ color: colors.primary }}></i>
                <span className="fw-medium text-dark small">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
             </div>
          </div>
        </div>

        {/* --- ALERT NOTIFICATIONS AREA --- */}
        <div className="mb-5">
          {loadError && (
            <div className="alert saas-alert d-flex align-items-center p-3 mb-3" style={{ borderLeftColor: colors.danger }} role="alert">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '42px', height: '42px', backgroundColor: colors.dangerLight, color: colors.danger }}>
                <i className="bi bi-exclamation-triangle fs-5"></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold text-dark mb-1">Dashboard Error</div>
                <small className="text-muted">{loadError}</small>
              </div>
              <button type="button" className="btn-close ms-3" onClick={() => setLoadError("")} aria-label="Close"></button>
            </div>
          )}
          
          {placementNotice && (
            <div className="alert saas-alert d-flex align-items-center p-3 mb-3" style={{ borderLeftColor: colors[placementNotice.type] || colors.info }} role="alert">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '42px', height: '42px', backgroundColor: colors[`${placementNotice.type}Light`] || colors.infoLight, color: colors[placementNotice.type] || colors.info }}>
                <i className={`bi ${placementNotice.icon} fs-5`}></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold text-dark mb-1">{placementNotice.title}</div>
                <small className="text-muted">{placementNotice.message}</small>
              </div>
              <button type="button" className="btn-close ms-3" onClick={() => setPlacementNotice(null)} aria-label="Close"></button>
            </div>
          )}
          
          {notifications.map((note) => (
             <div key={note.id} className="alert saas-alert d-flex align-items-center p-3 mb-3" style={{ borderLeftColor: colors[note.type] }} role="alert">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '42px', height: '42px', backgroundColor: colors[`${note.type}Light`], color: colors[note.type] }}>
                   <i className={`bi ${note.icon} fs-5`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-dark mb-1">{note.title}</div>
                  <small className="text-muted">{note.message}</small>
                </div>
                
                {note.action && (
                  note.actionLink ? (
                    <Link to={note.actionLink} className="btn btn-sm ms-3 rounded-pill px-4 fw-medium shadow-sm" style={{ backgroundColor: colors[note.type], color: '#fff' }}>
                      {note.action}
                    </Link>
                  ) : (
                    <button className="btn btn-sm ms-3 rounded-pill px-4 fw-medium shadow-sm" style={{ backgroundColor: colors[note.type], color: '#fff' }}>
                      {note.action}
                    </button>
                  )
                )}

                {note.dismissible && (
                  <button type="button" className="btn-close ms-3" onClick={() => setShowAssignmentAlert(false)} aria-label="Close"></button>
                )}
             </div>
          ))}
        </div>

        {/* --- STATS OVERVIEW CARDS --- */}
        <div className="row g-4 mb-5">
          <StatCard title="Overall Presence" value={`${attendancePercent}%`} subtitle="Attendance" icon="bi-person-check" color="success" />
          <StatCard title="Pending Submission" value={pendingSubmission} subtitle="Assignments" icon="bi-journal-text" color="warning" />
          <StatCard title="Assignments Graded" value={gradedCount} subtitle="Grades" icon="bi-award" color="primary" />
          <StatCard title={isPaid ? "Fully Paid" : "Partial Payment"} value={fees ? formatMoney(fees.paidAmount) : formatMoney(0)} subtitle="Fees Paid" icon="bi-wallet2" color={isPaid ? "success" : "danger"} />
        </div>

        <div className="row g-4">
          {/* --- LEFT COLUMN --- */}
          <div className="col-12 col-lg-8 col-xxl-9 d-flex flex-column gap-4">
            
            {/* Charts Row */}
            <div className="row g-4">
              <div className="col-md-6">
                <div className="saas-card p-4 h-100 hover-lift">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-bold mb-0" style={{ color: colors.textMain }}>Attendance Overview</h6>
                    <div className="icon-box" style={{ width: '36px', height: '36px', backgroundColor: colors.successLight, color: colors.success }}>
                      <i className="bi bi-pie-chart"></i>
                    </div>
                  </div>
                  <div className="position-relative d-flex align-items-center justify-content-center" style={{ height: "220px" }}>
                    <Doughnut data={attendanceData} options={doughnutOptions} />
                    <div className="position-absolute text-center" style={{ pointerEvents: 'none', top: '50%', transform: 'translateY(-60%)' }}>
                       <div className="fw-bold fs-2" style={{ color: colors.textMain, letterSpacing: '-1px' }}>{attendancePercent}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                 <div className="saas-card p-4 h-100 hover-lift">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-bold mb-0" style={{ color: colors.textMain }}>Assignment Activity</h6>
                    <div className="icon-box" style={{ width: '36px', height: '36px', backgroundColor: colors.primaryLight, color: colors.primary }}>
                      <i className="bi bi-bar-chart"></i>
                    </div>
                  </div>
                  <div style={{ height: "220px" }}>
                    <Bar data={submissionData} options={barOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments Table */}
            <div className="saas-card p-0 overflow-hidden">
              <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: colors.border }}>
                <h6 className="fw-bold mb-0 fs-6" style={{ color: colors.textMain }}>Recent Assignments</h6>
                <Link to="/student/assignments" className="text-decoration-none fw-medium small" style={{ color: colors.primary }}>View All <i className="bi bi-arrow-right ms-1"></i></Link>
              </div>
              <div className="table-responsive">
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th className="ps-4">Title</th>
                      <th>Subject</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.slice(0, 5).map((a) => {
                      const submission = submissions.find((s) => s.assignmentId?._id === a._id);
                      let status = { label: "Pending", bg: colors.warningLight, text: colors.warning };
                      
                      if (submission) {
                         if (submission.grade) status = { label: "Graded", bg: colors.successLight, text: colors.success };
                         else status = { label: "Submitted", bg: colors.infoLight, text: colors.info };
                      } else {
                         if (new Date(a.dueDate) < new Date()) status = { label: "Overdue", bg: colors.dangerLight, text: colors.danger };
                      }

                      return (
                        <tr key={a._id}>
                          <td className="ps-4">
                            <span className="fw-semibold d-block text-truncate" style={{ color: colors.textMain, maxWidth: '240px' }}>{a.title}</span>
                          </td>
                          <td style={{ color: colors.textMuted }}>{a.subject}</td>
                          <td style={{ color: colors.textMuted }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}</td>
                          <td>
                            <span className="badge rounded-pill px-3 py-2 fw-medium" style={{ backgroundColor: status.bg, color: status.text }}>
                              {status.label}
                            </span>
                          </td>
                          <td className="text-end pe-4 fw-bold" style={{ color: submission?.grade ? colors.success : colors.textMuted }}>
                            {submission?.grade ? submission.grade : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {assignments.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-5 text-muted">No assignments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Timetable Table */}
            <div className="saas-card p-0 overflow-hidden mb-4">
              <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: colors.border }}>
                <h6 className="fw-bold mb-0 fs-6" style={{ color: colors.textMain }}>Today's Timetable</h6>
                <Link to="/timetable" className="text-decoration-none fw-medium small" style={{ color: colors.primary }}>Full Timetable <i className="bi bi-arrow-right ms-1"></i></Link>
              </div>
              {todayPeriods.length ? (
                <div className="table-responsive">
                  <table className="saas-table">
                    <thead>
                      <tr>
                        <th className="ps-4">Period</th>
                        <th>Time</th>
                        <th>Subject</th>
                        <th className="text-end pe-4">Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayPeriods.map((entry) => (
                        <tr key={`today-period-${entry.period}`}>
                          <td className="ps-4 fw-semibold" style={{ color: colors.textMain }}>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', backgroundColor: '#f1f5f9', color: '#475569' }}>{entry.period}</span>
                            </div>
                          </td>
                          <td style={{ color: colors.textMuted }}><i className="bi bi-clock me-2 opacity-50"></i>{entry.time}</td>
                          <td className="fw-medium" style={{ color: colors.textMain }}>{entry.subject}</td>
                          <td className="text-end pe-4">
                            <span className="badge border rounded-pill px-3 py-2 fw-medium" style={{ backgroundColor: entry.subject === "Free" ? '#f8fafc' : '#ffffff', color: colors.textMain, borderColor: colors.border }}>
                              {entry.teacher}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ color: colors.textMuted }}>
                  <i className="bi bi-calendar-x fs-1 mb-3 opacity-25"></i>
                  <p className="mb-0 fw-medium">No classes scheduled for {todayName}.</p>
                </div>
              )}
            </div>

          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="col-12 col-lg-4 col-xxl-3">
            
            {/* Fees Chart */}
            <div className="saas-card p-4 hover-lift position-sticky" style={{ top: '24px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                 <h6 className="fw-bold mb-0" style={{ color: colors.textMain }}>Fee Status</h6>
                 <div className="icon-box" style={{ width: '36px', height: '36px', backgroundColor: colors.warningLight, color: colors.warning }}>
                    <i className="bi bi-wallet2"></i>
                 </div>
              </div>
              <div className="text-center">
                 <div style={{ height: "200px", marginBottom: "30px", position: 'relative' }}>
                    <Doughnut data={feesData} options={doughnutOptions} />
                 </div>
                 
                 <div className="rounded-4 p-3 mb-3 text-start" style={{ backgroundColor: '#f8fafc', border: `1px solid ${colors.border}` }}>
                   <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Total Fees</span>
                      <span className="fw-bold" style={{ color: colors.textMain }}>{fees ? formatMoney(fees.totalFees) : formatMoney(0)}</span>
                   </div>
                   <div className="d-flex justify-content-between align-items-center">
                      <span style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Paid Amount</span>
                      <span className="fw-bold" style={{ color: colors.success }}>{fees ? formatMoney(fees.paidAmount) : formatMoney(0)}</span>
                   </div>
                 </div>

                 <div className="rounded-4 p-3 text-start" style={{ backgroundColor: totalDue > 0 ? colors.dangerLight : colors.successLight, border: `1px solid ${totalDue > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                   <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold" style={{ color: totalDue > 0 ? colors.danger : colors.success }}>Total Due</span>
                      <span className="fw-bold fs-5" style={{ color: totalDue > 0 ? colors.danger : colors.success, letterSpacing: '-0.5px' }}>{formatMoney(totalDue)}</span>
                   </div>
                   {totalDue > 0 && (
                     <Link to="/student/fees" className="btn w-100 mt-3 rounded-pill fw-medium shadow-sm" style={{ backgroundColor: colors.danger, color: '#ffffff' }}>
                       Pay Now
                     </Link>
                   )}
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// SaaS Style StatCard Sub-component
function StatCard({ title, value, subtitle, icon, color }) {
  const bgLight = colors[`${color}Light`] || `var(--bs-${color}-bg-subtle)`;
  const textColor = colors[color] || `var(--bs-${color})`;
  
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="saas-card p-4 h-100 hover-lift d-flex flex-column justify-content-between">
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <p className="mb-1 fw-semibold text-uppercase" style={{ color: '#94a3b8', fontSize: '0.70rem', letterSpacing: '0.05em' }}>{subtitle}</p>
            <h3 className="fw-bolder mb-0" style={{ color: colors.textMain, fontSize: '1.75rem', letterSpacing: '-0.5px' }}>{value}</h3>
          </div>
          <div className="icon-box" style={{ backgroundColor: bgLight, color: textColor }}>
             <i className={`bi ${icon}`}></i>
          </div>
        </div>
        <div>
          <span className="fw-medium small" style={{ color: colors.textMuted }}>{title}</span>
        </div>
      </div>
    </div>
  );
}