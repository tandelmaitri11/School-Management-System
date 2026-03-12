import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../../../api/api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";

const styles = {
  page: { backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "80px" },
  actionBar: {
    position: "sticky",
    top: "20px",
    zIndex: 1000,
    margin: "0 auto 30px auto",
    maxWidth: "1100px",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(10px)",
    borderRadius: "999px",
    padding: "10px 20px",
    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.85)",
  },
  reportContainer: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px",
  },
  banner: {
    background: "linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #14b8a6 100%)",
    borderRadius: "24px",
    padding: "36px",
    color: "white",
    boxShadow: "0 20px 40px -10px rgba(37, 99, 235, 0.28)",
    marginBottom: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)",
    height: "100%",
    border: "1px solid #f1f5f9",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "22px",
    color: "#1e293b",
    fontWeight: "700",
    fontSize: "1.1rem",
  },
  statBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    height: "100%",
  },
};

const monthOptions = [
  { label: "Year To Date", value: "" },
  { label: "January", value: "2026-01" },
  { label: "February", value: "2026-02" },
  { label: "March", value: "2026-03" },
];

const statCard = (label, value, tone = "dark") => (
  <div style={styles.statBox}>
    <small className="text-muted text-uppercase fw-bold" style={{ fontSize: "0.7rem" }}>
      {label}
    </small>
    <div className={`fw-bold text-${tone} mt-2`} style={{ fontSize: "1.35rem" }}>
      {value}
    </div>
  </div>
);

export default function StudentReportPage() {
  const { studentId: routeStudentId } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const reportRef = useRef(null);
  const autoDownloadTriggeredRef = useRef(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const studentId = routeStudentId || localStorage.getItem("studentId");
        const res = await api.get(`/api/reports/student/${studentId}`, { params: { month } });
        setReport(res.data);
      } catch (error) {
        console.error("Error loading report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month, routeStudentId]);

  const downloadPDF = async () => {
    if (!reportRef.current || !report) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Report_${report.studentName || "Student"}.pdf`);
  };

  useEffect(() => {
    const shouldAutoDownload = new URLSearchParams(location.search).get("pdf") === "1";
    if (!shouldAutoDownload || loading || !report || autoDownloadTriggeredRef.current) return;

    autoDownloadTriggeredRef.current = true;
    downloadPDF();
  }, [location.search, loading, report]);

  useEffect(() => {
    autoDownloadTriggeredRef.current = false;
  }, [routeStudentId, month, location.search]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center pt-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center pt-5">No report data available.</div>;
  }

  const score = Number(report?.overallResult?.score || 0);
  const radialData = [
    { name: "Background", uv: 100, fill: "#e2e8f0" },
    { name: "Score", uv: score, fill: "#2563eb" },
  ];
  const aiRiskTone =
    report?.aiInsights?.riskLevel === "High"
      ? "danger"
      : report?.aiInsights?.riskLevel === "Medium"
      ? "warning"
      : "success";

  return (
    <div style={styles.page}>
      <div style={styles.actionBar}>
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
            style={{ width: "35px", height: "35px", fontSize: "0.9rem" }}
          >
            {(report.studentName || "S").charAt(0).toUpperCase()}
          </div>
          <span className="fw-bold text-dark d-none d-sm-block">Student Performance Report</span>
        </div>

        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm border-0 bg-secondary-subtle fw-semibold rounded-pill"
            style={{ width: "145px" }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={downloadPDF}
            className="btn btn-dark btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
          >
            <i className="bi bi-download"></i>
            <span className="d-none d-sm-block">Download</span>
          </button>
        </div>
      </div>

      <div ref={reportRef} style={styles.reportContainer}>
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-mortarboard-fill text-primary"></i>
            SchoolY
          </h4>
          <div className="text-end">
            <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: "0.65rem" }}>
              Generated On
            </small>
            <small className="fw-bold text-dark">{new Date().toLocaleDateString()}</small>
          </div>
        </div>

        <div style={styles.banner}>
          <div>
            <div className="badge bg-white bg-opacity-25 text-white mb-2 px-3 py-1 rounded-pill border border-white border-opacity-25">
              Student Report
            </div>
            <h2 className="fw-bold mb-1">{report.studentName}</h2>
            <div className="opacity-75 small mt-2">
              Class: <strong>{report.className}</strong> | ID: <strong>{report.studentId || "-"}</strong>
            </div>
          </div>
          <div className="text-end d-none d-md-block">
            <div className="display-4 fw-bold">{score}</div>
            <div className="small opacity-75">{report?.overallResult?.label || "Overall Result"}</div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-dark-subtle text-dark p-2 rounded-3 d-flex">
                  <i className="bi bi-person-vcard-fill"></i>
                </div>
                <span>Student Details</span>
              </div>
              <div className="row g-3">
                <div className="col-md-3">{statCard("Name", report.studentDetails?.name || "-")}</div>
                <div className="col-md-2">{statCard("Student ID", report.studentDetails?.studentId || "-")}</div>
                <div className="col-md-2">{statCard("Class", report.studentDetails?.className || "-")}</div>
                <div className="col-md-2">{statCard("Section", report.studentDetails?.section || "-")}</div>
                <div className="col-md-3">{statCard("Stream / Choice", `${report.studentDetails?.stream || "General"}${report.studentDetails?.subjectChoice ? ` / ${report.studentDetails.subjectChoice}` : ""}`)}</div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-success-subtle text-success p-2 rounded-3 d-flex">
                  <i className="bi bi-calendar-check-fill"></i>
                </div>
                <span>Attendance Summary</span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-3">{statCard("Present", report.attendance?.presentDays || 0, "success")}</div>
                <div className="col-md-3">{statCard("Absent", report.attendance?.absentDays || 0, "danger")}</div>
                <div className="col-md-3">{statCard("Total Days", report.attendance?.totalDays || 0)}</div>
                <div className="col-md-3">{statCard("Attendance %", `${report.attendance?.percentage || 0}%`, "primary")}</div>
              </div>

              <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.attendance?.chart || []}>
                    <defs>
                      <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#attendanceFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div style={styles.card} className="d-flex flex-column align-items-center justify-content-center text-center">
              <h6 className="fw-bold text-dark mb-4">Overall Result</h6>
              <div style={{ height: "200px", width: "100%", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={15} data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="uv" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                  <div className="display-5 fw-bold text-dark">{score}</div>
                  <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.65rem" }}>
                    Score
                  </div>
                </div>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 mt-3">
                {report?.overallResult?.label || "Overall"}
              </span>
              <p className="text-muted small mt-3 mb-0">{report?.aiInsights?.summary || "No summary available."}</p>
            </div>
          </div>

          <div className="col-lg-7">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-warning-subtle text-warning p-2 rounded-3 d-flex">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <span>Academic Performance</span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-3">{statCard("Exams", report.academicPerformance?.totalExams || 0)}</div>
                <div className="col-md-3">{statCard("Average %", `${report.academicPerformance?.averagePercentage || 0}%`, "primary")}</div>
                <div className="col-md-3">{statCard("Best %", `${report.academicPerformance?.bestPercentage || 0}%`, "success")}</div>
                <div className="col-md-3">{statCard("Pass Count", report.academicPerformance?.passCount || 0, "success")}</div>
              </div>

              <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.academicPerformance?.chart || []} barSize={34}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-primary-subtle text-primary p-2 rounded-3 d-flex">
                  <i className="bi bi-journal-bookmark-fill"></i>
                </div>
                <span>Assignment Performance</span>
              </div>
              <div className="row g-3">
                <div className="col-6">{statCard("Submitted", report.assignments?.totalSubmitted || 0, "success")}</div>
                <div className="col-6">{statCard("Graded", report.assignments?.graded || 0, "warning")}</div>
                <div className="col-6">{statCard("Avg Grade", report.assignments?.avgGrade || 0, "info")}</div>
                <div className="col-6">{statCard("Submission %", `${report.assignments?.submissionRate || 0}%`, "primary")}</div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-info-subtle text-info p-2 rounded-3 d-flex">
                  <i className="bi bi-laptop-fill"></i>
                </div>
                <span>LMS Progress</span>
              </div>
              <div className="row g-3">
                <div className="col-6">{statCard("Completed", report.lms?.completedMaterials || 0, "success")}</div>
                <div className="col-6">{statCard("Completion %", `${report.lms?.completionRate || 0}%`, "primary")}</div>
                <div className="col-6">{statCard("Avg Progress", `${report.lms?.averageProgress || 0}%`, "info")}</div>
                <div className="col-6">{statCard("Watch Min", Math.round((report.lms?.totalWatchSeconds || 0) / 60))}</div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-danger-subtle text-danger p-2 rounded-3 d-flex">
                  <i className="bi bi-wallet2"></i>
                </div>
                <span>Fee Status</span>
              </div>
              <div className="row g-3">
                <div className="col-6">{statCard("Total Fees", `Rs ${report.feeStatus?.totalFees || 0}`)}</div>
                <div className="col-6">{statCard("Paid", `Rs ${report.feeStatus?.paidAmount || 0}`, "success")}</div>
                <div className="col-6">{statCard("Total Due", `Rs ${report.feeStatus?.totalDue || 0}`, "danger")}</div>
                <div className="col-6">{statCard("Status", report.feeStatus?.status || "N/A")}</div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className={`bg-${aiRiskTone}-subtle text-${aiRiskTone} p-2 rounded-3 d-flex`}>
                  <i className="bi bi-stars"></i>
                </div>
                <span>AI Performance Insight</span>
              </div>
              <span className={`badge bg-${aiRiskTone}-subtle text-${aiRiskTone} border border-${aiRiskTone}-subtle rounded-pill px-3 py-2 mb-3`}>
                Risk Level: {report.aiInsights?.riskLevel || "Low"}
              </span>
              <p className="text-muted mb-0">{report.aiInsights?.summary || "No insight available."}</p>
            </div>
          </div>

          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-secondary-subtle text-secondary p-2 rounded-3 d-flex">
                  <i className="bi bi-chat-left-text-fill"></i>
                </div>
                <span>Teacher Remarks</span>
              </div>
              <p className="text-muted mb-0">{report.teacherRemarks || "No remarks available."}</p>
            </div>
          </div>

          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-success-subtle text-success p-2 rounded-3 d-flex">
                  <i className="bi bi-trophy-fill"></i>
                </div>
                <span>Strengths</span>
              </div>
              <ul className="mb-0 text-muted">
                {(report.strengthsAndImprovements?.strengths || []).map((item, index) => (
                  <li key={`strength-${index}`} className="mb-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-6">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-danger-subtle text-danger p-2 rounded-3 d-flex">
                  <i className="bi bi-arrow-up-right-circle-fill"></i>
                </div>
                <span>Improvements</span>
              </div>
              <ul className="mb-0 text-muted">
                {(report.strengthsAndImprovements?.improvements || []).map((item, index) => (
                  <li key={`improvement-${index}`} className="mb-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-12">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div className="bg-dark-subtle text-dark p-2 rounded-3 d-flex">
                  <i className="bi bi-table"></i>
                </div>
                <span>Graphs and Charts Data</span>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Due Date</th>
                      <th>Grade</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.assignments?.details || []).length ? (
                      report.assignments.details.map((item, index) => (
                        <tr key={`assignment-detail-${index}`}>
                          <td>{item.title || "-"}</td>
                          <td>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "-"}</td>
                          <td>{item.grade || "-"}</td>
                          <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No assignment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-5 pt-4 border-top text-muted small">
          <p className="mb-1">This report is system generated. Signature is not required.</p>
          <p className="fw-bold">© {new Date().getFullYear()} SchoolY Portal</p>
        </div>
      </div>
    </div>
  );
}




