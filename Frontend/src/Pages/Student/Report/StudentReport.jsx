import React, { useEffect, useState, useRef } from "react";
import api from "../../../api/api";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";

export default function StudentReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const reportRef = useRef();

  const COLORS = ["#28a745", "#dc3545"]; // Green = Present, Red = Absent

  const fetchReport = async () => {
    try {
      setLoading(true);
      const studentId = localStorage.getItem("studentId");
      const res = await api.get(`/api/reports/student/${studentId}`, {
        params: { month },
      });
      setReport(res.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  const downloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 153);
    pdf.text("SchoolY", pdfWidth / 2, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setTextColor(80);
    pdf.text("Official Student Performance Report", pdfWidth / 2, 22, { align: "center" });
    pdf.line(10, 25, pdfWidth - 10, 25);
    pdf.addImage(imgData, "PNG", 0, 28, pdfWidth, imgHeight);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text("This report is system-generated — no signature required", pdfWidth / 2, pdfHeight - 10, { align: "center" });
    pdf.save(`${report.studentName}_Report.pdf`);
  };

  if (loading)
    return <div className="text-center mt-5 fw-bold text-secondary">Loading report...</div>;

  if (!report)
    return <div className="text-center mt-5 text-danger fw-bold">No report found</div>;

  const attendancePieData = [
    { name: "Present", value: report.attendance.presentDays },
    { name: "Absent", value: report.attendance.absentDays },
  ];

  const monthOptions = [
    { value: "", label: "All Months" },
    { value: "2025-01", label: "January 2025" },
    { value: "2025-02", label: "February 2025" },
    { value: "2025-03", label: "March 2025" },
    { value: "2025-04", label: "April 2025" },
    { value: "2025-05", label: "May 2025" },
    { value: "2025-06", label: "June 2025" },
    { value: "2025-07", label: "July 2025" },
    { value: "2025-08", label: "August 2025" },
    { value: "2025-09", label: "September 2025" },
    { value: "2025-10", label: "October 2025" },
    { value: "2025-11", label: "November 2025" },
    { value: "2025-12", label: "December 2025" },
  ];

  return (
    <div className="container my-5">
      {/* Month Filter */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary">📊 Student Monthly Report</h4>
        <div className="d-flex align-items-center">
          <label className="me-2 fw-semibold text-secondary">Select Month:</label>
          <select
            className="form-select form-select-sm"
            style={{ width: "200px" }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Content */}
      <div className="card border-0 shadow-lg p-4 rounded-4" ref={reportRef}>
        {/* Header */}
        <div className="text-center border-bottom pb-3 mb-4">
          <h2 className="fw-bold text-primary mb-1">Student Performance Report</h2>
          <p className="text-muted mb-0">Academic and Attendance Summary</p>
        </div>

        {/* Student Info */}
        <div className="bg-light rounded-3 p-3 mb-4">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>Name:</strong> {report.studentName}</p>
              <p className="mb-1"><strong>Class:</strong> {report.className}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-1">
                <strong>Month:</strong> {month ? new Date(month).toLocaleString("default", { month: "long", year: "numeric" }) : "All"}
              </p>
              <p className="mb-0"><strong>Generated On:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="mb-5">
          <h5 className="text-secondary border-start border-4 border-primary ps-2 mb-3">🕒 Attendance Overview</h5>
          <div className="row align-items-center">
            <div className="col-md-7">
              <table className="table table-bordered text-center table-striped">
                <thead className="table-primary">
                  <tr>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{report.attendance.totalDays}</td>
                    <td className="text-success fw-semibold">{report.attendance.presentDays}</td>
                    <td className="text-danger fw-semibold">{report.attendance.absentDays}</td>
                    <td className="fw-bold text-primary">{report.attendance.percentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="col-md-5">
              <div className="card p-3 shadow-sm border-0">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card p-3 shadow-sm border-0 mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.attendance.chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Present" stroke="#28a745" strokeWidth={3} />
                <Line type="monotone" dataKey="Absent" stroke="#dc3545" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assignment Section */}
        <div>
          <h5 className="text-secondary border-start border-4 border-success ps-2 mb-3">📚 Assignment Performance</h5>
          <table className="table table-bordered text-center table-striped">
            <thead className="table-success">
              <tr>
                <th>Total</th>
                <th>Submitted</th>
                <th>Graded</th>
                <th>Average Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{report.assignments.totalAssignments}</td>
                <td className="text-info fw-semibold">{report.assignments.totalSubmitted}</td>
                <td className="text-warning fw-semibold">{report.assignments.graded}</td>
                <td className="fw-bold text-success">{report.assignments.avgGrade}</td>
              </tr>
            </tbody>
          </table>

          <div className="card p-3 shadow-sm border-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.assignments.chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="gradeValue" fill="#007bff" name="Grade Score (A→F)" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-lg btn-outline-primary px-5 py-2 fw-semibold" onClick={downloadPDF}>
          📄 Download PDF Report
        </button>
      </div>
    </div>
  );
}
