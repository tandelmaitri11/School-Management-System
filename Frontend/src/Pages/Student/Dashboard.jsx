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

// --- PROFESSIONAL COLOR PALETTE ---
const colors = {
  primary: "#4f46e5", // Indigo
  primaryLight: "#e0e7ff",
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  bg: "#f8fafc",
};

// --- ANIMATION STYLES ---
const styles = `
  .fade-in { animation: fadeIn 0.5s ease-in-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .hover-scale:hover { transform: translateY(-3px); transition: transform 0.2s; }
  .notification-bell { transition: all 0.2s; }
  .notification-bell:hover { transform: scale(1.1); color: #4f46e5; }
`;

export default function StudentDashboard() {
  const studentId = localStorage.getItem("studentId");
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState({ presentDays: 0, absentDays: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [fees, setFees] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Notification State
  const [showAssignmentAlert, setShowAssignmentAlert] = useState(true);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!studentId) return;
        const profileRes = await api.get(`/api/studentDashboard/profile/${studentId}`);
        setStudent(profileRes.data);

        const [assignRes, attendRes, submitRes, feeRes, examsRes] = await Promise.all([
          api.get(`/api/studentDashboard/assignments/${profileRes.data.studentClass}`),
          api.get(`/api/studentDashboard/attendance/${studentId}`),
          api.get(`/api/studentDashboard/submissions/${studentId}`),
          api.get(`/api/fees/student/${studentId}`),
          api.get(`/api/student/exams`),
        ]);

        setAssignments(assignRes.data);
        setAttendance(attendRes.data);
        setSubmissions(submitRes.data);
        setFees(feeRes.data.fees);
        setExams(examsRes.data.exams || []);
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
  }, [studentId]);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );

  if (!student) return <div className="text-center mt-5">Student not found</div>;

  // --- CALCULATIONS ---
  const totalDays = attendance.presentDays + attendance.absentDays;
  const attendancePercent = totalDays
    ? ((attendance.presentDays / totalDays) * 100).toFixed(1)
    : 0;

  const gradedCount = submissions.filter((s) => s.grade).length;
  const pendingSubmission = assignments.length - submissions.length;
  const isPaid = fees?.remainingAmount <= 0;
  const now = new Date();
  const upcomingExams = exams
    .filter((e) => new Date(e.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const nextExam = upcomingExams[0];

  // --- NOTIFICATION LOGIC ---
  const notifications = [];
  
  // 1. Fee Notification (High Priority)
  if (!isPaid && fees) {
    notifications.push({
      id: 'fees',
      type: 'danger',
      icon: 'bi-exclamation-triangle-fill',
      title: 'Fee Payment Pending',
      message: `You have a remaining balance of ₹${fees.remainingAmount}. Please clear your dues.`,
      action: 'Pay Now'
    });
  }

  // 2. Assignment Notification (Medium Priority)
  if (pendingSubmission > 0 && showAssignmentAlert) {
    notifications.push({
      id: 'assignments',
      type: 'warning',
      icon: 'bi-journal-bookmark-fill',
      title: 'Pending Assignments',
      message: `You have ${pendingSubmission} assignment${pendingSubmission > 1 ? 's' : ''} waiting for submission.`,
      dismissible: true
    });
  }

  // 3. Exam Notification (New / Upcoming)
  if (nextExam) {
    notifications.push({
      id: 'exam',
      type: 'info',
      icon: 'bi-calendar-event-fill',
      title: 'New Exam Scheduled',
      message: `${nextExam.title} • ${nextExam.subjectName || "Subject"} • ${new Date(nextExam.startTime).toLocaleString()}`,
      action: 'View Exams',
      actionLink: '/student/exams',
    });
  }

  const notificationCount = notifications.length;

  // --- CHART CONFIGURATIONS ---
  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [{ data: [attendance.presentDays, attendance.absentDays], backgroundColor: [colors.success, colors.danger], borderWidth: 0, hoverOffset: 4 }],
  };

  const doughnutOptions = {
    responsive: true,
    cutout: "75%",
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 15, font: { size: 11 } } } },
    maintainAspectRatio: false,
  };

  const submissionData = {
    labels: ["Assigned", "Submitted", "Graded"],
    datasets: [{ label: "Count", data: [assignments.length, submissions.length, gradedCount], backgroundColor: [colors.primary, colors.warning, colors.success], borderRadius: 5, barThickness: 35 }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4], drawBorder: false } }, x: { grid: { display: false } } },
  };

  const feesData = {
    labels: ["Paid", "Remaining"],
    datasets: [{ data: fees ? [fees.paidAmount, fees.remainingAmount] : [0, 0], backgroundColor: [colors.primary, "#cbd5e1"], borderWidth: 0 }],
  };

  const classLabel = student.studentClass ? `Class ${student.studentClass}` : "Class N/A";
  const sectionLabel = student.section ? `-${student.section}` : "";
  const streamLabel = student.stream ? ` (${student.stream})` : "";

  return (
    <div className="min-vh-100 pb-5 fade-in" style={{ backgroundColor: colors.bg }}>
      <style>{styles}</style>
      <div className="container-fluid px-4 py-4">
        
        {/* --- HEADER SECTION --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold text-dark mb-0">Dashboard</h3>
            <p className="text-muted mb-0">
              Welcome back, <span className="fw-semibold text-primary">{student.name}</span>
            </p>
            <p className="text-muted mb-0 small">
              {classLabel}
              {sectionLabel}
              {streamLabel}
            </p>
          </div>
          
          <div className="d-flex align-items-center gap-3">
             {/* Date Badge */}
             <span className="d-none d-sm-inline-block badge bg-white text-secondary border px-3 py-2 rounded-pill shadow-sm">
                <i className="bi bi-calendar3 me-2"></i>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </span>

             {/* Notification Bell */}
             <div className="position-relative notification-bell cursor-pointer p-2 bg-white rounded-circle shadow-sm border text-secondary">
                <i className="bi bi-bell-fill fs-5"></i>
                {notificationCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                    {notificationCount}
                  </span>
                )}
             </div>
          </div>
        </div>

        {/* --- ALERT NOTIFICATIONS AREA --- */}
        <div className="mb-4">
          {loadError && (
            <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center rounded-3 mb-3 fade-in" role="alert">
              <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" 
                   style={{width: '40px', height: '40px'}}>
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold text-dark">Dashboard Error</div>
                <small className="text-muted">{loadError}</small>
              </div>
              <button 
                type="button" 
                className="btn-close ms-3" 
                onClick={() => setLoadError("")}
                aria-label="Close"
              ></button>
            </div>
          )}
          {notifications.map((note) => (
             <div key={note.id} className={`alert alert-${note.type} border-0 shadow-sm d-flex align-items-center rounded-3 mb-3 fade-in`} role="alert">
                <div className={`bg-${note.type} text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0`} 
                     style={{width: '40px', height: '40px'}}>
                   <i className={`bi ${note.icon} fs-5`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-dark">{note.title}</div>
                  <small className="text-muted">{note.message}</small>
                </div>
                
                {/* Action Button (e.g., Pay Now) */}
                {note.action && (
                  note.actionLink ? (
                    <Link
                      to={note.actionLink}
                      className={`btn btn-sm btn-${note.type} ms-3 rounded-pill px-3 shadow-sm`}
                    >
                      {note.action}
                    </Link>
                  ) : (
                    <button className={`btn btn-sm btn-${note.type} ms-3 rounded-pill px-3 shadow-sm`}>
                      {note.action}
                    </button>
                  )
                )}

                {/* Dismiss Button */}
                {note.dismissible && (
                  <button 
                    type="button" 
                    className="btn-close ms-3" 
                    onClick={() => setShowAssignmentAlert(false)}
                    aria-label="Close"
                  ></button>
                )}
             </div>
          ))}
        </div>

        {/* --- STATS OVERVIEW CARDS --- */}
        <div className="row g-4 mb-4">
          <StatCard title="Attendance" value={`${attendancePercent}%`} subtitle="Overall Presence" icon="bi-person-check" color="success" />
          <StatCard title="Assignments" value={pendingSubmission} subtitle="Pending Submission" icon="bi-journal-text" color="warning" />
          <StatCard title="Grades" value={gradedCount} subtitle="Assignments Graded" icon="bi-award" color="primary" />
          <StatCard title="Fees Paid" value={fees ? `₹${fees.paidAmount}` : "0"} subtitle={isPaid ? "Fully Paid" : "Partial Payment"} icon="bi-wallet2" color={isPaid ? "success" : "danger"} />
        </div>

        <div className="row g-4">
          {/* --- LEFT COLUMN --- */}
          <div className="col-lg-8">
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 hover-scale">
                  <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                    <h6 className="fw-bold mb-0 text-secondary text-uppercase small ls-1">Attendance</h6>
                  </div>
                  <div className="card-body d-flex align-items-center justify-content-center position-relative" style={{ height: "240px" }}>
                    <Doughnut data={attendanceData} options={doughnutOptions} />
                    <div className="position-absolute text-center" style={{ pointerEvents: 'none', marginTop: '-15px' }}>
                       <div className="fw-bold fs-3">{attendancePercent}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                 <div className="card border-0 shadow-sm rounded-4 h-100 hover-scale">
                  <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                    <h6 className="fw-bold mb-0 text-secondary text-uppercase small ls-1">Activity</h6>
                  </div>
                  <div className="card-body" style={{ height: "240px" }}>
                    <Bar data={submissionData} options={barOptions} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-secondary text-uppercase small">Recent Assignments</h6>
                <Link to="/student/assignments" className="btn btn-sm btn-light text-primary fw-medium rounded-pill px-3">View All</Link>
              </div>
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="bg-light text-secondary small text-uppercase">
                    <tr>
                      <th className="px-4 border-0 rounded-start">Title</th>
                      <th className="border-0">Subject</th>
                      <th className="border-0">Due Date</th>
                      <th className="border-0">Status</th>
                      <th className="px-4 border-0 rounded-end text-end">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.slice(0, 5).map((a) => {
                      const submission = submissions.find((s) => s.assignmentId?._id === a._id);
                      let status = { label: "Pending", color: "warning-subtle", text: "warning-emphasis" };
                      
                      if (submission) {
                         if (submission.grade) status = { label: "Graded", color: "success-subtle", text: "success" };
                         else status = { label: "Submitted", color: "info-subtle", text: "primary" };
                      } else {
                         // Check if overdue
                         if (new Date(a.dueDate) < new Date()) status = { label: "Overdue", color: "danger-subtle", text: "danger" };
                      }

                      return (
                        <tr key={a._id} style={{ borderBottomColor: '#f8fafc' }}>
                          <td className="px-4 py-3">
                            <span className="fw-semibold text-dark d-block text-truncate" style={{maxWidth: '200px'}}>{a.title}</span>
                          </td>
                          <td className="text-muted small">{a.subject}</td>
                          <td className="text-muted small">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}</td>
                          <td><span className={`badge bg-${status.color} text-${status.text} rounded-pill px-3 fw-normal`}>{status.label}</span></td>
                          <td className="px-4 text-end fw-bold text-dark">{submission?.grade ? submission.grade : "—"}</td>
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
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="col-lg-4">
            
            {/* Fees Chart */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 pt-4 px-4">
                 <h6 className="fw-bold mb-0 text-secondary text-uppercase small ls-1">Fee Status</h6>
              </div>
              <div className="card-body text-center">
                 <div style={{ height: "180px", marginBottom: "20px" }}>
                    <Doughnut data={feesData} options={doughnutOptions} />
                 </div>
                 <div className="d-flex justify-content-between border-bottom pb-2 mb-2 small">
                    <span className="text-muted">Total Fees</span>
                    <span className="fw-bold">₹{fees ? fees.totalAmount : 0}</span>
                 </div>
                 <div className="d-flex justify-content-between border-bottom pb-2 mb-2 small">
                    <span className="text-muted">Paid</span>
                    <span className="fw-bold text-success">₹{fees ? fees.paidAmount : 0}</span>
                 </div>
                 <div className="d-flex justify-content-between pt-2 small">
                    <span className="text-muted">Remaining</span>
                    <span className="fw-bold text-danger">₹{fees ? fees.remainingAmount : 0}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component remains same
function StatCard({ title, value, subtitle, icon, color }) {
  const bgClass = `bg-${color}`;
  const textClass = `text-${color}`;
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="card border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden hover-scale">
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className={`icon-box rounded-circle d-flex align-items-center justify-content-center bg-opacity-10 ${bgClass}`} style={{ width: "45px", height: "45px", backgroundColor: `var(--bs-${color}-rgb, 0.1)` }}>
               <i className={`bi ${icon} fs-5 ${textClass}`}></i>
            </div>
          </div>
          <div>
            <h3 className="fw-bold text-dark mb-1">{value}</h3>
            <div className="text-muted small fw-medium">{title}</div>
            <div className={`small mt-1 ${textClass}`} style={{fontSize: '0.75rem'}}>{subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
