import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const fmtDate = (value) => {
  // value may be "2026-02-03" or a date string
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
};

export default function AdminClassAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStream, setSelectedStream] = useState("");

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setClasses([]);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    setSelectedSection("");
    setSelectedStream("");
  }, [selectedClass]);

  const selectedClassDoc = useMemo(
    () => classes.find((cls) => String(cls._id) === String(selectedClass)) || null,
    [classes, selectedClass]
  );

  const sectionOptions = useMemo(() => {
    if (!selectedClassDoc?.sections?.length) return [];

    const names = selectedClassDoc.sections
      .filter((sec) => sec?.isActive !== false)
      .map((sec) => String(sec?.name || "").trim().toUpperCase())
      .filter(Boolean);

    return [...new Set(names)].sort();
  }, [selectedClassDoc]);

  const streamOptions = useMemo(() => {
    if (!selectedClassDoc) return [];

    const classStreams = (selectedClassDoc.streams || [])
      .filter((st) => st?.isActive !== false)
      .map((st) => String(st?.name || "").trim())
      .filter(Boolean);

    const sectionStreams = (selectedClassDoc.sections || [])
      .filter((sec) => sec?.isActive !== false)
      .filter((sec) => !selectedSection || String(sec?.name || "").trim().toUpperCase() === selectedSection)
      .map((sec) => String(sec?.stream || "").trim())
      .filter(Boolean);

    return [...new Set([...sectionStreams, ...classStreams])];
  }, [selectedClassDoc, selectedSection]);

  useEffect(() => {
    if (selectedStream && !streamOptions.includes(selectedStream)) {
      setSelectedStream("");
    }
  }, [selectedStream, streamOptions]);

  const fetchAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setAttendanceData([]);
    setSelectedRecord(null);
    setQuery("");

    try {
      const params = {};
      if (selectedSection) params.section = selectedSection;
      if (selectedStream) params.stream = selectedStream;

      const res = await api.get(`/api/attendance/class/${selectedClass}`, { params });
      const data = Array.isArray(res.data) ? res.data : [];
      // sort newest first (optional)
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceData(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter by date range (client-side)
  const filteredSessions = useMemo(() => {
    if (!attendanceData.length) return [];
    const from = range.from ? new Date(range.from) : null;
    const to = range.to ? new Date(range.to) : null;

    return attendanceData.filter((rec) => {
      const d = new Date(rec.date);
      if (from && d < from) return false;
      if (to) {
        // include whole "to" day
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [attendanceData, range.from, range.to]);

  // KPI + aggregates
  const summary = useMemo(() => {
    const sessions = filteredSessions || [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalStudentsCounted = 0;

    let best = { percent: -1, date: "" };
    let worst = { percent: 101, date: "" };

    sessions.forEach((rec) => {
      const present = rec.attendance?.filter((a) => a.status === "Present").length || 0;
      const total = rec.attendance?.length || 0;
      const absent = Math.max(0, total - present);

      totalPresent += present;
      totalAbsent += absent;
      totalStudentsCounted += total;

      const percent = total > 0 ? (present / total) * 100 : 0;
      if (percent > best.percent) best = { percent, date: rec.date };
      if (percent < worst.percent) worst = { percent, date: rec.date };
    });

    const overallPercent =
      totalStudentsCounted > 0 ? (totalPresent / totalStudentsCounted) * 100 : 0;

    const avgClassSize = sessions.length ? totalStudentsCounted / sessions.length : 0;

    return {
      sessionsCount: sessions.length,
      totalPresent,
      totalAbsent,
      overallPercent,
      avgClassSize,
      bestDay: best.date ? { date: best.date, percent: best.percent } : null,
      worstDay: worst.date ? { date: worst.date, percent: worst.percent } : null,
    };
  }, [filteredSessions]);

  // Charts
  const doughnutData = useMemo(() => {
    if (!filteredSessions.length) return null;
    return {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [summary.totalPresent, summary.totalAbsent],
          backgroundColor: ["#4f46e5", "#e2e8f0"],
          borderWidth: 0,
        },
      ],
    };
  }, [filteredSessions.length, summary.totalPresent, summary.totalAbsent]);

  const monthlyChartData = useMemo(() => {
    if (!filteredSessions.length) return null;

    // show chronological left->right in charts
    const sessions = [...filteredSessions].sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: sessions.map((rec) => fmtDate(rec.date)),
      datasets: [
        {
          label: "Present",
          data: sessions.map(
            (r) => r.attendance?.filter((a) => a.status === "Present").length || 0
          ),
          backgroundColor: "#4f46e5",
          borderRadius: 10,
          barThickness: 14,
        },
        {
          label: "Absent",
          data: sessions.map((r) => {
            const total = r.attendance?.length || 0;
            const present = r.attendance?.filter((a) => a.status === "Present").length || 0;
            return Math.max(0, total - present);
          }),
          backgroundColor: "#e2e8f0",
          borderRadius: 10,
          barThickness: 14,
        },
      ],
    };
  }, [filteredSessions]);

  const trendChartData = useMemo(() => {
    if (!filteredSessions.length) return null;

    const sessions = [...filteredSessions].sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: sessions.map((rec) => fmtDate(rec.date)),
      datasets: [
        {
          label: "Attendance %",
          data: sessions.map((r) => {
            const total = r.attendance?.length || 0;
            const present = r.attendance?.filter((a) => a.status === "Present").length || 0;
            return total ? (present / total) * 100 : 0;
          }),
          fill: true,
          backgroundColor: "rgba(79, 70, 229, 0.10)",
          borderColor: "#4f46e5",
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    };
  }, [filteredSessions]);

  const baseChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { boxWidth: 10, boxHeight: 10, font: { family: "'Inter', sans-serif" } } },
        tooltip: { enabled: true, titleFont: { family: "'Inter', sans-serif" }, bodyFont: { family: "'Inter', sans-serif" } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11, family: "'Inter', sans-serif" } } },
        y: { grid: { color: "#f1f5f9" }, ticks: { color: "#64748b", font: { size: 11, family: "'Inter', sans-serif" } } },
      },
    }),
    []
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom", labels: { font: { family: "'Inter', sans-serif" } } },
        tooltip: { enabled: true },
      },
      cutout: "75%",
    }),
    []
  );

  const tableSessions = useMemo(() => {
    // show newest first in table
    return [...filteredSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredSessions]);

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-weight: 500; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; font-weight: 600; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        .btn-brand:disabled { opacity: 0.7; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="position-relative z-1 mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-graph-up-arrow me-1"></i> Data & Analytics
            </span>
            <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Class Attendance Analytics</h2>
            <p className="text-white opacity-75 fw-medium mb-0">Class-wise insights, periodic trends, and detailed session logs.</p>
          </div>
          
          {/* Glassmorphism Control Panel */}
          <div className="position-relative z-1 d-flex flex-column flex-lg-row gap-3 p-3 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            
            <div className="row g-2 flex-grow-1">
              <div className="col-12 col-md-4">
                <select className="form-select input-premium py-2 border-0" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">Select Class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>Class {cls.className}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <select className="form-select input-premium py-2 border-0" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedClass}>
                  <option value="">All Sections</option>
                  {sectionOptions.map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <select className="form-select input-premium py-2 border-0" value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} disabled={!selectedClass || streamOptions.length === 0}>
                  <option value="">All Streams</option>
                  {streamOptions.map((stream) => (
                    <option key={stream} value={stream}>{stream}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center bg-white rounded-3 p-1 px-2 border-0">
              <input type="date" className="form-control border-0 shadow-none bg-transparent fw-medium" style={{ width: '140px', fontSize: '0.9rem' }} value={range.from} onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))} />
              <span className="text-muted small fw-bold px-1 d-none d-md-inline">TO</span>
              <input type="date" className="form-control border-0 shadow-none bg-transparent fw-medium" style={{ width: '140px', fontSize: '0.9rem' }} value={range.to} onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))} />
            </div>

            <button className="btn btn-brand rounded-3 px-4 py-2 text-nowrap shadow-sm" onClick={fetchAttendance} disabled={!selectedClass || loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-funnel-fill me-2"></i>}
              Analyze
            </button>
          </div>
        </div>

        {/* Empty State */}
        {!loading && !attendanceData.length && (
          <div className="text-center py-5 my-5">
            <div className="rounded-circle bg-white shadow-sm d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
              <i className="bi bi-bar-chart-fill text-muted opacity-50 fs-1"></i>
            </div>
            <h4 className="fw-bolder text-dark mb-2">Ready to Analyze</h4>
            <p className="text-muted fw-medium">Select a class, section, and optional date range to generate insights.</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && attendanceData.length > 0 && (
          <div className="animate-fade-in">
            
            {/* KPI Cards */}
            <div className="row g-4 mb-4">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-primary">
                  <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Overall Attendance</div>
                  <div className="d-flex align-items-end justify-content-between">
                    <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.5rem' }}>{summary.overallPercent.toFixed(1)}%</div>
                  </div>
                  <div className="progress mt-3" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#e2e8f0' }}>
                    <div className="progress-bar bg-primary" style={{ width: `${summary.overallPercent}%`, borderRadius: '10px' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="col-12 col-md-6 col-lg-3">
                <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-dark">
                  <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Sessions</div>
                  <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.5rem' }}>{summary.sessionsCount}</div>
                  <div className="text-muted small mt-2 fw-medium">Analyzed in selected period</div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-info">
                  <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Avg Class Size</div>
                  <div className="fw-bolder text-dark lh-1" style={{ fontSize: '2.5rem' }}>{summary.avgClassSize.toFixed(0)}</div>
                  <div className="text-muted small mt-2 fw-medium">Students per session</div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="premium-card p-4 h-100 d-flex flex-column justify-content-center border-start border-4 border-success">
                  <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Best Performing Day</div>
                  <div className="fw-bolder text-dark lh-1 mb-2" style={{ fontSize: '1.5rem' }}>{summary.bestDay ? fmtDate(summary.bestDay.date) : "-"}</div>
                  <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 align-self-start fw-bold">
                    {summary.bestDay ? `${summary.bestDay.percent.toFixed(1)}% Present` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row g-4 mb-4">
              <div className="col-12 col-lg-4">
                <div className="premium-card p-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Overall Split</div>
                      <h6 className="fw-bolder text-dark m-0">Present vs Absent</h6>
                    </div>
                    <span className="badge bg-light text-dark border rounded-pill px-2 py-1">{summary.totalPresent + summary.totalAbsent} marks</span>
                  </div>
                  
                  <div className="position-relative" style={{ height: '260px' }}>
                    {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
                    <div className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none">
                      <div className="text-muted small fw-bold">AVG</div>
                      <div className="fw-bolder text-dark lh-1" style={{ fontSize: '1.8rem' }}>{summary.overallPercent.toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-around mt-4 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                    <div className="text-center">
                      <div className="small text-muted fw-bold mb-1">PRESENT</div>
                      <h5 className="fw-bolder text-primary m-0">{summary.totalPresent}</h5>
                    </div>
                    <div className="vr text-secondary opacity-25"></div>
                    <div className="text-center">
                      <div className="small text-muted fw-bold mb-1">ABSENT</div>
                      <h5 className="fw-bolder text-secondary m-0">{summary.totalAbsent}</h5>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-8">
                <div className="premium-card p-4 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Session Distribution</div>
                      <h6 className="fw-bolder text-dark m-0">Daily Volume Analysis</h6>
                    </div>
                  </div>
                  <div className="flex-grow-1" style={{ minHeight: '260px' }}>
                    {monthlyChartData && <Bar data={monthlyChartData} options={baseChartOptions} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 & Table */}
            <div className="row g-4">
              <div className="col-12 col-lg-5">
                <div className="premium-card p-4 h-100 d-flex flex-column">
                  <div className="mb-4">
                    <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Trend Analysis</div>
                    <h6 className="fw-bolder text-dark m-0">Attendance Rate Over Time</h6>
                  </div>
                  <div className="flex-grow-1" style={{ minHeight: '260px' }}>
                    {trendChartData && <Line data={trendChartData} options={baseChartOptions} />}
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-7">
                <div className="premium-card overflow-hidden h-100 d-flex flex-column">
                  <div className="p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                      <div>
                        <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Session Logs</div>
                        <h6 className="fw-bolder text-dark m-0">Detailed Records</h6>
                      </div>
                      <div className="d-flex gap-2">
                        <div className="position-relative">
                          <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '12px', fontSize: '0.85rem' }}></i>
                          <input
                            className="form-control input-premium py-1"
                            style={{ width: '200px', paddingLeft: '32px', fontSize: '0.85rem' }}
                            placeholder="Filter dates..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </div>
                        <button className="btn bg-light border text-muted fw-bold py-1 px-3 rounded-3" style={{ fontSize: '0.85rem' }} onClick={() => setRange({ from: "", to: "" })}>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="table-responsive flex-grow-1 custom-scroll" style={{ maxHeight: '400px' }}>
                    <table className="table table-premium align-middle mb-0">
                      <thead className="sticky-top z-1 shadow-sm">
                        <tr>
                          <th className="ps-4">Date</th>
                          <th className="text-center">Total</th>
                          <th className="text-center">Present</th>
                          <th className="text-center">Absent</th>
                          <th className="text-end pe-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableSessions.length === 0 ? (
                           <tr>
                             <td colSpan="5" className="text-center py-5 text-muted fw-medium">No sessions logged in this date range.</td>
                           </tr>
                        ) : (
                          tableSessions
                            .filter((rec) => fmtDate(rec.date).toLowerCase().includes(query.toLowerCase()))
                            .map((rec) => {
                              const present = rec.attendance?.filter((a) => a.status === "Present").length || 0;
                              const total = rec.attendance?.length || 0;
                              const absent = Math.max(0, total - present);
                              const percent = total ? (present / total) * 100 : 0;

                              return (
                                <tr key={rec._id}>
                                  <td className="ps-4">
                                    <div className="fw-bolder text-dark">{fmtDate(rec.date)}</div>
                                    <div className="text-muted small fw-medium">{percent.toFixed(1)}% presence</div>
                                  </td>
                                  <td className="text-center fw-bold text-muted">{total}</td>
                                  <td className="text-center fw-bolder text-primary">{present}</td>
                                  <td className="text-center fw-bold text-danger">{absent}</td>
                                  <td className="text-end pe-4">
                                    <button
                                      className="btn btn-sm bg-light border text-dark fw-bold rounded-pill px-3 shadow-sm"
                                      onClick={() => { setSelectedRecord(rec); setQuery(""); }}
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drill-down Modal */}
        {selectedRecord && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "24px", overflow: "hidden" }}>
                
                <div className="modal-header border-0 bg-light px-4 pt-4 pb-3">
                  <div>
                    <h5 className="fw-bolder text-dark mb-1 d-flex align-items-center">
                      <i className="bi bi-calendar-event text-primary me-2"></i> Session Details
                    </h5>
                    <p className="text-muted small fw-medium mb-0">Record for {fmtDate(selectedRecord.date)}</p>
                  </div>
                  <button type="button" className="btn-close shadow-none" onClick={() => setSelectedRecord(null)}></button>
                </div>

                <div className="modal-body p-4 bg-white custom-scroll">
                  {(() => {
                    const present = selectedRecord.attendance?.filter((a) => a.status === "Present").length || 0;
                    const total = selectedRecord.attendance?.length || 0;
                    const absent = Math.max(0, total - present);
                    const percent = total ? (present / total) * 100 : 0;

                    const list = selectedRecord.attendance || [];
                    const filtered = list.filter((std) => {
                      const name = (std?.studentId?.name || "").toLowerCase();
                      const sid = (std?.studentId?.studentId || "").toLowerCase();
                      const status = (std?.status || "").toLowerCase();
                      const q = query.toLowerCase();
                      if (!q) return true;
                      return name.includes(q) || sid.includes(q) || status.includes(q);
                    });

                    return (
                      <>
                        {/* Modal Summary Strip */}
                        <div className="p-4 rounded-4 mb-4 border" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.05), #f8fafc)" }}>
                          <div className="row g-3 align-items-center">
                            <div className="col-12 col-md-4 border-end-md" style={{ borderColor: '#e2e8f0' }}>
                              <div className="text-muted small fw-bold text-uppercase">Attendance</div>
                              <div className="fw-bolder text-primary lh-1 mt-1" style={{ fontSize: '2rem' }}>{percent.toFixed(1)}%</div>
                            </div>
                            <div className="col-12 col-md-8 ps-md-4">
                              <div className="d-flex flex-wrap gap-2 mb-3">
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 fw-semibold">Total: {total}</span>
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-semibold">Present: {present}</span>
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-2 fw-semibold">Absent: {absent}</span>
                              </div>
                              <div className="progress shadow-sm" style={{ height: '8px', borderRadius: '10px', backgroundColor: '#fee2e2' }}>
                                <div className="progress-bar bg-success" style={{ width: `${percent}%`, borderRadius: '10px' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Search Roster */}
                        <div className="d-flex gap-2 mb-3">
                          <div className="position-relative flex-grow-1">
                            <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '12px' }}></i>
                            <input
                              className="form-control input-premium py-2 w-100"
                              style={{ paddingLeft: '36px' }}
                              placeholder="Search student by name, ID, or status..."
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                            />
                          </div>
                          <button className="btn bg-light border text-muted fw-bold rounded-3 px-3" onClick={() => setQuery("")}>Clear</button>
                        </div>

                        {/* Roster List */}
                        <div className="border rounded-4 overflow-hidden shadow-sm">
                          <div className="px-4 py-3 d-flex justify-content-between align-items-center bg-light border-bottom">
                            <div className="text-muted small fw-bold text-uppercase">Student Roster</div>
                            <div className="badge bg-white text-dark border px-2 py-1 shadow-sm">{filtered.length} Records</div>
                          </div>

                          <div>
                            {filtered.length === 0 ? (
                              <div className="text-center text-muted py-5 fw-medium">No students match your search criteria.</div>
                            ) : (
                              filtered.map((std, index) => (
                                <div key={index} className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-white hover-bg-light transition-all">
                                  <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-muted fw-bold border shadow-sm" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <div className="fw-bolder text-dark mb-1 lh-sm">{std?.studentId?.name || "Unknown Student"}</div>
                                      <div className="text-muted small fw-medium font-monospace" style={{ fontSize: '0.75rem' }}>
                                        ID: {std?.studentId?.studentId || "—"}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`badge rounded-pill px-3 py-2 fw-bold shadow-sm ${std?.status === "Present" ? "bg-success" : "bg-danger"}`}>
                                    {(std?.status || "—").toUpperCase()}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <div className="modal-footer border-0 bg-light px-4 py-3">
                  <button className="btn btn-dark w-100 rounded-pill fw-bold py-2 shadow-sm" onClick={() => { setSelectedRecord(null); setQuery(""); }}>
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Loading Overlay */}
        {loading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", zIndex: 1060 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg border text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <h5 className="fw-bolder text-dark mb-1">Crunching Data...</h5>
              <p className="text-muted small fw-medium mb-0">Analyzing session records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}