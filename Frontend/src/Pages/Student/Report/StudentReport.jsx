import React, { useEffect, useState, useRef } from "react";
import api from "../../../api/api";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";

// --- REFINED STYLES ---
const styles = {
  page: { backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "80px" },
  
  // Floating Action Bar (Sticky)
  actionBar: {
    position: "sticky",
    top: "20px",
    zIndex: 1000,
    margin: "0 auto 30px auto",
    maxWidth: "1000px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "100px", // Pill shape
    padding: "10px 25px",
    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.8)"
  },

  // The Report Area
  reportContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    backgroundColor: "#f8fafc", // Matches page bg
    padding: "20px"
  },

  // Gradient Profile Card
  banner: {
    background: "linear-gradient(120deg, #2563eb 0%, #7c3aed 100%)", // Blue to Purple
    borderRadius: "24px",
    padding: "40px",
    color: "white",
    boxShadow: "0 20px 40px -10px rgba(37, 99, 235, 0.3)",
    marginBottom: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },

  // Standard Card
  card: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03)",
    height: "100%",
    border: "1px solid #f1f5f9"
  },
  
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "25px",
    color: "#1e293b",
    fontWeight: "700",
    fontSize: "1.1rem"
  },

  // Stat Grid Box
  statBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e2e8f0"
  }
};

export default function StudentReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const reportRef = useRef();

  // --- LOGIC ---
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const studentId = localStorage.getItem("studentId");
        const res = await api.get(`/api/reports/student/${studentId}`, { params: { month } });
        setReport(res.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month]);

  const downloadPDF = async () => {
    const element = reportRef.current;
    
    // Scale 3 for High Res, white background for clean print
    const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: "#ffffff" 
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

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Report_${report.studentName}.pdf`);
  };

  if (loading) return <div className="d-flex justify-content-center pt-5"><div className="spinner-border text-primary"/></div>;
  if (!report) return <div className="text-center pt-5">No Data</div>;

  // Score Calculation
  const score = Math.round((report.attendance.percentage * 0.5) + (report.assignments.avgGrade ? parseFloat(report.assignments.avgGrade) * 10 : 0) * 0.5);
  
  const radialData = [
    { name: 'Score', uv: 100, fill: '#f3f4f6' }, // Background Ring
    { name: 'Score', uv: score, fill: '#8b5cf6' } // Actual Score
  ];

  return (
    <div style={styles.page}>
      
      {/* --- FLOATING CONTROLS --- */}
      <div style={styles.actionBar}>
        <div className="d-flex align-items-center gap-2">
           <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width:'35px', height:'35px', fontSize:'0.9rem'}}>
             {report.studentName.charAt(0)}
           </div>
           <span className="fw-bold text-dark d-none d-sm-block">Performance Report</span>
        </div>

        <div className="d-flex gap-2">
           <select 
              className="form-select form-select-sm border-0 bg-secondary-subtle fw-semibold rounded-pill" 
              style={{width: '140px'}}
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Year To Date</option>
              <option value="2025-01">January</option>
              <option value="2025-02">February</option>
              <option value="2025-03">March</option>
           </select>
           <button onClick={downloadPDF} className="btn btn-dark btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2">
              <i className="bi bi-download"></i> <span className="d-none d-sm-block">Download</span>
           </button>
        </div>
      </div>

      {/* --- REPORT CONTAINER --- */}
      <div ref={reportRef} style={styles.reportContainer}>
        
        {/* PDF Header (Brand) */}
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
            <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <i className="bi bi-mortarboard-fill text-primary"></i> SchoolY
            </h4>
            <div className="text-end">
                <small className="text-muted d-block text-uppercase fw-bold" style={{fontSize:'0.65rem'}}>Generated On</small>
                <small className="fw-bold text-dark">{new Date().toLocaleDateString()}</small>
            </div>
        </div>

        {/* 1. Student Banner */}
        <div style={styles.banner}>
           <div>
              <div className="badge bg-white bg-opacity-25 text-white mb-2 px-3 py-1 rounded-pill border border-white border-opacity-25">Student Report</div>
              <h2 className="fw-bold mb-1">{report.studentName}</h2>
              <div className="opacity-75 small mt-2">
                 Class: <strong>{report.className}</strong> &nbsp;|&nbsp; ID: <strong>{localStorage.getItem('studentId')}</strong>
              </div>
           </div>
           <div className="text-end d-none d-md-block">
              <div className="display-4 fw-bold">{score}</div>
              <div className="small opacity-75">Overall Score</div>
           </div>
        </div>

        <div className="row g-4">
           
           {/* 2. Attendance Graph */}
           <div className="col-lg-8">
              <div style={styles.card}>
                 <div style={styles.cardHeader}>
                    <div className="bg-success-subtle text-success p-2 rounded-3 d-flex"><i className="bi bi-calendar-check-fill"></i></div>
                    <span>Attendance Trends</span>
                 </div>
                 
                 <div className="d-flex gap-4 mb-4 border-bottom pb-3">
                    <div>
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Present</small>
                        <h4 className="fw-bold text-success mb-0">{report.attendance.presentDays} <small className="text-muted fs-6">Days</small></h4>
                    </div>
                    <div>
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Absent</small>
                        <h4 className="fw-bold text-danger mb-0">{report.attendance.absentDays} <small className="text-muted fs-6">Days</small></h4>
                    </div>
                    <div className="ms-auto text-end">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Rate</small>
                        <h4 className="fw-bold text-dark mb-0">{report.attendance.percentage}%</h4>
                    </div>
                 </div>

                 <div style={{height: '220px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={report.attendance.chart}>
                          <defs>
                             <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                          <Area type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* 3. Performance Radial */}
           <div className="col-lg-4">
              <div style={styles.card} className="d-flex flex-column align-items-center justify-content-center text-center">
                 <h6 className="fw-bold text-dark mb-4">Performance Index</h6>
                 
                 <div style={{height: '200px', width: '100%', position: 'relative'}}>
                    <ResponsiveContainer>
                       <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={15} data={radialData} startAngle={90} endAngle={-270}>
                          <RadialBar background dataKey="uv" cornerRadius={10}/>
                       </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Centered Text */}
                    <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                       <div className="display-5 fw-bold text-dark">{score}</div>
                       <div className="small text-muted fw-bold text-uppercase" style={{fontSize:'0.6rem'}}>Points</div>
                    </div>
                 </div>

                 <div className="mt-3">
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">Excellent</span>
                 </div>
                 <p className="text-muted small mt-3 px-2 mb-0">
                    Your academic consistency is in the top <strong>10%</strong> of your class.
                 </p>
              </div>
           </div>

           {/* 4. Assignment Metrics Grid */}
           <div className="col-12">
              <div style={styles.card}>
                 <div style={styles.cardHeader}>
                    <div className="bg-primary-subtle text-primary p-2 rounded-3 d-flex"><i className="bi bi-journal-bookmark-fill"></i></div>
                    <span>Assignment Analytics</span>
                 </div>

                 <div className="row g-4">
                    {/* Metric Cards */}
                    <div className="col-6 col-md-3">
                       <div style={styles.statBox}>
                          <h2 className="fw-bold text-primary mb-0">{report.assignments.totalAssignments}</h2>
                          <small className="text-muted fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Total</small>
                       </div>
                    </div>
                    <div className="col-6 col-md-3">
                       <div style={styles.statBox}>
                          <h2 className="fw-bold text-success mb-0">{report.assignments.totalSubmitted}</h2>
                          <small className="text-muted fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Submitted</small>
                       </div>
                    </div>
                    <div className="col-6 col-md-3">
                       <div style={styles.statBox}>
                          <h2 className="fw-bold text-warning mb-0">{report.assignments.graded}</h2>
                          <small className="text-muted fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Graded</small>
                       </div>
                    </div>
                    <div className="col-6 col-md-3">
                       <div style={styles.statBox}>
                          <h2 className="fw-bold text-info mb-0">{report.assignments.avgGrade}</h2>
                          <small className="text-muted fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Avg Grade</small>
                       </div>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="col-12 mt-4" style={{height: '220px'}}>
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={report.assignments.chart} barSize={40}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                             <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                             <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}/>
                             <Bar dataKey="gradeValue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Grade" />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
           </div>

        </div>

        {/* Footer for PDF */}
        <div className="text-center mt-5 pt-4 border-top text-muted small">
           <p className="mb-1">This report is system generated. Signature is not required.</p>
           <p className="fw-bold">© {new Date().getFullYear()} SchoolY Portal</p>
        </div>

      </div>
    </div>
  );
}