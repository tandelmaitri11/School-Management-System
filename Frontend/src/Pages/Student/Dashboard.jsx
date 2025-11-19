import React, { useEffect, useState } from "react";
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
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function StudentDashboard() {
  const studentId = localStorage.getItem("studentId");
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState({ presentDays: 0, absentDays: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [fees, setFees] = useState(null);
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const profile = await api.get(`/api/studentDashboard/profile/${studentId}`);
        setStudent(profile.data);

        const assign = await api.get(`/api/studentDashboard/assignments/${profile.data.studentClass}`);
        const attend = await api.get(`/api/studentDashboard/attendance/${studentId}`);
        const submit = await api.get(`/api/studentDashboard/submissions/${studentId}`);
        const feeRes = await api.get(`/api/fees/student-fees/${studentId}`);

        setAssignments(assign.data);
        setAttendance(attend.data);
        setSubmissions(submit.data);
        setFees(feeRes.data.fees);

        // Identify new assignments (not submitted yet)
        const newOnes = assign.data.filter(
          (a) => !submit.data.find((s) => s.assignmentId?._id === a._id)
        );
        setNewAssignmentsCount(newOnes.length);

      } catch (err) {
        console.log(err);
      }
    };
    loadDashboard();
  }, [studentId]);

  if (!student) return <h4 className="text-center p-5 text-muted">Loading Dashboard...</h4>;

  // Stats
  const totalDays = attendance.presentDays + attendance.absentDays;
  const attendancePercent = totalDays ? ((attendance.presentDays / totalDays) * 100).toFixed(1) : 0;
  const gradedCount = submissions.filter((s) => s.grade).length;
  const pendingCount = submissions.length - gradedCount;

  // Charts
  const attendanceData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [attendance.presentDays, attendance.absentDays],
        backgroundColor: ["#4caf50", "#e57373"],
      },
    ],
  };

  const submissionChartData = {
    labels: ["Graded", "Pending"],
    datasets: [
      {
        label: "",
        data: [gradedCount, pendingCount],
        backgroundColor: ["#64b5f6", "#ffb74d"],
      },
    ],
  };

  const feesChartData = {
    labels: ["Paid", "Remaining"],
    datasets: [
      {
        data: fees ? [fees.paidAmount, fees.remainingAmount] : [0, 0],
        backgroundColor: ["#4caf50", "#e57373"],
      },
    ],
  };

  const card = {
    borderRadius: "14px",
    border: "1px solid #e6e9ef",
    backgroundColor: "#ffffff",
    transition: "0.2s",
  };

  const header = {
    background: "#f7f9fc",
    borderBottom: "1px solid #e6e9ef",
    borderTopLeftRadius: "14px",
    borderTopRightRadius: "14px",
    fontWeight: "600",
    fontSize: "1rem",
  };

  const isPaid = fees?.remainingAmount <= 0;

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <div className="container py-4">
        {/* Title */}
        <div
          style={{
            textAlign: "left",
            marginBottom: "1.8rem",
            fontSize: "1.4rem",
            fontWeight: "700",
            padding: "10px 14px",
            background: "linear-gradient(90deg, #0d6efd22, transparent)",
            borderRadius: "10px",
            color: "#0d6efd",
          }}
        >
          Welcome, {student.name} — Class {student.studentClass}
        </div>

        {/* 🔔 New Assignment Notification */}
        {newAssignmentsCount > 0 && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "600",
              color: "#856404",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>🔔</span>
            You have {newAssignmentsCount} new assignment{newAssignmentsCount > 1 ? "s" : ""} pending.
          </div>
        )}

        {/* 🔔 Fees Pending Notification */}
        {fees && !isPaid && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "600",
              color: "#856404",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>💰</span>
            Your fees payment is pending! Remaining amount: ₹{fees.remainingAmount}
          </div>
        )}

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-center p-3" style={card}>
              <h6 className="text-muted mb-1">Attendance</h6>
              <h4 className="fw-bold text-primary">{attendancePercent}%</h4>
              <small className="text-secondary">
                Present {attendance.presentDays} | Absent {attendance.absentDays}
              </small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3" style={card}>
              <h6 className="text-muted mb-1">Assignments</h6>
              <h4 className="fw-bold text-success">{assignments.length}</h4>
              <small className="text-secondary">Active assignments</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3" style={card}>
              <h6 className="text-muted mb-1">Submissions</h6>
              <h4 className="fw-bold text-warning">{submissions.length}</h4>
              <small className="text-secondary">
                Graded {gradedCount} | Pending {pendingCount}
              </small>
            </div>
          </div>
          {/* Fees Card */}
          {fees && (
            <div className="col-md-3">
              <div className="card text-center p-3" style={card}>
                <h6 className="text-muted mb-1">Fees</h6>
                <h4 className={`fw-bold ${isPaid ? "text-success" : "text-danger"}`}>
                  {isPaid ? "Paid" : "Pending"}
                </h4>
                <small className="text-secondary">
                  Total: {fees.totalFees} | Paid: {fees.paidAmount} | Remaining: {fees.remainingAmount}
                </small>
                {!isPaid && (
                  <div className="mt-2">
                    <span className="badge bg-warning text-dark">Payment Pending</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card" style={card}>
              <div className="card-header" style={header}>Attendance Chart</div>
              <div className="card-body" style={{ height: "200px" }}>
                <Doughnut data={attendanceData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card" style={card}>
              <div className="card-header" style={header}>Submission Chart</div>
              <div className="card-body" style={{ height: "200px" }}>
                <Bar data={submissionChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card" style={card}>
              <div className="card-header" style={header}>Fees Chart</div>
              <div className="card-body" style={{ height: "200px" }}>
                <Doughnut data={feesChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="card mb-4" style={card}>
          <div className="card-header" style={header}>Assignments</div>
          <ul className="list-group list-group-flush">
            {assignments.length === 0 ? (
              <li className="list-group-item text-muted">No assignments available.</li>
            ) : (
              assignments.map((a) => {
                const submitted = submissions.find((s) => s.assignmentId?._id === a._id);
                return (
                  <li className="list-group-item d-flex justify-content-between align-items-center" key={a._id}>
                    <div>
                      <strong>{a.title}</strong> — <span className="text-muted">{a.subject}</span>
                      {a.dueDate && (
                        <div>
                          <small className="text-secondary">Due: {new Date(a.dueDate).toLocaleDateString()}</small>
                        </div>
                      )}
                    </div>
                    {submitted ? (
                      submitted.grade ? (
                        <span className="badge bg-success px-3 py-2">Submitted • Grade: {submitted.grade}</span>
                      ) : (
                        <span className="badge bg-info px-3 py-2">Submitted • Pending Grade</span>
                      )
                    ) : (
                      <span className="badge bg-danger px-3 py-2">Not Submitted</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
