import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

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

  const fetchAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setAttendanceData([]);
    setSelectedRecord(null);
    setQuery("");

    try {
      const res = await api.get(`/api/attendance/class/${selectedClass}`);
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
        legend: { display: true, labels: { boxWidth: 10, boxHeight: 10 } },
        tooltip: { enabled: true },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11 } } },
        y: { grid: { color: "#f1f5f9" }, ticks: { color: "#64748b", font: { size: 11 } } },
      },
    }),
    []
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom" },
        tooltip: { enabled: true },
      },
      cutout: "70%",
    }),
    []
  );

  const tableSessions = useMemo(() => {
    // show newest first in table
    return [...filteredSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredSessions]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Top header */}
      <div
        className="py-4"
        style={{
          background: "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(15,23,42,0.04))",
          borderBottom: "1px solid #eef2ff",
        }}
      >
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(79,70,229,0.12)",
                    border: "1px solid rgba(79,70,229,0.18)",
                  }}
                >
                  <span style={{ fontWeight: 900, color: "#4f46e5" }}>A</span>
                </div>
                <div>
                  <h3 className="mb-0" style={{ fontWeight: 900, letterSpacing: "-0.5px" }}>
                    Attendance Analytics
                  </h3>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    Class-wise insights • trends • session logs
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white border shadow-sm rounded-4 p-2 d-flex flex-wrap gap-2 align-items-center">
              <select
                className="form-select border-0 shadow-none"
                style={{ width: 240, fontWeight: 700, cursor: "pointer" }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className}
                  </option>
                ))}
              </select>

              <div className="d-flex gap-2 align-items-center">
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 160 }}
                  value={range.from}
                  onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))}
                />
                <span className="text-muted small">to</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 160 }}
                  value={range.to}
                  onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))}
                />
              </div>

              <button
                className="btn btn-dark px-4"
                style={{ borderRadius: 14, fontWeight: 800 }}
                onClick={fetchAttendance}
                disabled={!selectedClass || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading
                  </>
                ) : (
                  "Analyze"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: 1200 }}>
        {/* Empty state */}
        {!loading && !attendanceData.length && (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-5 text-center">
              <div
                className="mx-auto mb-3 rounded-circle"
                style={{
                  width: 64,
                  height: 64,
                  background: "rgba(79,70,229,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  color: "#4f46e5",
                }}
              >
                %
              </div>
              <h5 className="mb-1" style={{ fontWeight: 900 }}>
                Select a class to view analytics
              </h5>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Choose a class and click <b>Analyze</b>. Optionally filter by date range.
              </div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {!loading && attendanceData.length > 0 && (
          <>
            {/* KPI cards */}
            <div className="row g-3 mb-3">
              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="text-muted small fw-bold">OVERALL ATTENDANCE</div>
                    <div className="d-flex align-items-end justify-content-between mt-2">
                      <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: "-0.5px" }}>
                        {summary.overallPercent.toFixed(1)}%
                      </div>
                      <div className="text-muted small">avg</div>
                    </div>
                    <div className="mt-3" style={{ height: 8, background: "#eef2ff", borderRadius: 20 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, summary.overallPercent))}%`,
                          height: "100%",
                          background: "#4f46e5",
                          borderRadius: 20,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="text-muted small fw-bold">TOTAL SESSIONS</div>
                    <div className="mt-2" style={{ fontWeight: 900, fontSize: 28 }}>
                      {summary.sessionsCount}
                    </div>
                    <div className="text-muted small">in selected period</div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="text-muted small fw-bold">AVG CLASS SIZE</div>
                    <div className="mt-2" style={{ fontWeight: 900, fontSize: 28 }}>
                      {summary.avgClassSize.toFixed(0)}
                    </div>
                    <div className="text-muted small">students per session</div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="text-muted small fw-bold">BEST DAY</div>
                    <div className="mt-2" style={{ fontWeight: 900, fontSize: 16 }}>
                      {summary.bestDay ? fmtDate(summary.bestDay.date) : "-"}
                    </div>
                    <div className="text-muted small">
                      {summary.bestDay ? `${summary.bestDay.percent.toFixed(1)}% present` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts row */}
            <div className="row g-3 mb-3">
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <div className="text-muted small fw-bold">OVERALL SPLIT</div>
                        <div style={{ fontWeight: 900 }}>Present vs Absent</div>
                      </div>
                      <span className="badge rounded-pill text-bg-light border">
                        {summary.totalPresent + summary.totalAbsent} marks
                      </span>
                    </div>

                    <div style={{ height: 260, position: "relative" }}>
                      {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
                      {/* Center label overlay */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                          flexDirection: "column",
                        }}
                      >
                        <div className="text-muted small">Overall</div>
                        <div style={{ fontWeight: 900, fontSize: 26 }}>
                          {summary.overallPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-2 small text-muted">
                      <span>Present: <b className="text-dark">{summary.totalPresent}</b></span>
                      <span>Absent: <b className="text-dark">{summary.totalAbsent}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                      <div>
                        <div className="text-muted small fw-bold">SESSION DISTRIBUTION</div>
                        <div style={{ fontWeight: 900 }}>Present & Absent per day</div>
                      </div>
                    </div>
                    <div style={{ height: 280 }}>
                      {monthlyChartData && <Bar data={monthlyChartData} options={baseChartOptions} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trend + Table */}
            <div className="row g-3">
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="text-muted small fw-bold">TREND</div>
                    <div style={{ fontWeight: 900 }} className="mb-3">
                      Attendance % over time
                    </div>
                    <div style={{ height: 260 }}>
                      {trendChartData && <Line data={trendChartData} options={baseChartOptions} />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-body p-4 pb-2">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div>
                        <div className="text-muted small fw-bold">SESSIONS</div>
                        <div style={{ fontWeight: 900 }}>Session logs</div>
                      </div>

                      <div className="d-flex gap-2 align-items-center">
                        <input
                          className="form-control"
                          style={{ width: 220 }}
                          placeholder="Search date (e.g., Feb)"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                          className="btn btn-outline-dark"
                          style={{ borderRadius: 14, fontWeight: 800 }}
                          onClick={() => setRange({ from: "", to: "" })}
                        >
                          Reset Range
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead style={{ background: "#fbfdff" }}>
                        <tr>
                          <th className="px-4 py-3 text-muted small fw-bold">DATE</th>
                          <th className="text-center text-muted small fw-bold">TOTAL</th>
                          <th className="text-center text-muted small fw-bold">PRESENT</th>
                          <th className="text-center text-muted small fw-bold">ABSENT</th>
                          <th className="px-4 py-3 text-end"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {tableSessions
                          .filter((rec) => fmtDate(rec.date).toLowerCase().includes(query.toLowerCase()))
                          .map((rec) => {
                            const present =
                              rec.attendance?.filter((a) => a.status === "Present").length || 0;
                            const total = rec.attendance?.length || 0;
                            const absent = Math.max(0, total - present);
                            const percent = total ? (present / total) * 100 : 0;

                            return (
                              <tr key={rec._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td className="px-4 py-3">
                                  <div style={{ fontWeight: 900 }}>{fmtDate(rec.date)}</div>
                                  <div className="text-muted small">{percent.toFixed(1)}% present</div>
                                </td>
                                <td className="text-center fw-bold text-muted">{total}</td>
                                <td className="text-center fw-bold" style={{ color: "#4f46e5" }}>
                                  {present}
                                </td>
                                <td className="text-center fw-bold text-muted">{absent}</td>
                                <td className="px-4 text-end">
                                  <button
                                    className="btn btn-sm btn-dark"
                                    style={{ borderRadius: 12, fontWeight: 800 }}
                                    onClick={() => {
                                      setSelectedRecord(rec);
                                      setQuery("");
                                    }}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                        {!tableSessions.length && (
                          <tr>
                            <td colSpan={5} className="text-center text-muted py-5">
                              No sessions found in this date range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 pb-4 text-muted small">
                    Tip: Use date range + search to quickly find a session.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Details Modal */}
        {selectedRecord && (
          <div
            className="modal show d-block"
            style={{
              backgroundColor: "rgba(2, 6, 23, 0.55)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow rounded-5 overflow-hidden">
                <div className="modal-header border-0 p-4">
                  <div>
                    <div className="text-muted small fw-bold">SESSION DETAILS</div>
                    <h5 className="modal-title mb-0" style={{ fontWeight: 950 }}>
                      {fmtDate(selectedRecord.date)}
                    </h5>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedRecord(null)} />
                </div>

                <div className="modal-body p-4 pt-0">
                  {(() => {
                    const present =
                      selectedRecord.attendance?.filter((a) => a.status === "Present").length || 0;
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
                        {/* Summary strip */}
                        <div
                          className="p-4 rounded-4 mb-3"
                          style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.10), #f8fafc)" }}
                        >
                          <div className="row g-3 align-items-center">
                            <div className="col-md-4">
                              <div className="text-muted small fw-bold">ATTENDANCE</div>
                              <div style={{ fontWeight: 950, fontSize: 28 }}>{percent.toFixed(1)}%</div>
                            </div>
                            <div className="col-md-8">
                              <div className="d-flex gap-2 flex-wrap">
                                <span className="badge rounded-pill text-bg-primary">
                                  Present: {present}
                                </span>
                                <span className="badge rounded-pill text-bg-light border">
                                  Absent: {absent}
                                </span>
                                <span className="badge rounded-pill text-bg-dark">
                                  Total: {total}
                                </span>
                              </div>
                              <div className="mt-3" style={{ height: 8, background: "#eef2ff", borderRadius: 20 }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, Math.max(0, percent))}%`,
                                    height: "100%",
                                    background: "#4f46e5",
                                    borderRadius: 20,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Search inside modal */}
                        <div className="d-flex gap-2 mb-3">
                          <input
                            className="form-control"
                            placeholder="Search student name / ID / status..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                          <button className="btn btn-outline-dark" style={{ borderRadius: 14, fontWeight: 800 }} onClick={() => setQuery("")}>
                            Clear
                          </button>
                        </div>

                        {/* List */}
                        <div className="border rounded-4 overflow-hidden">
                          <div
                            className="px-3 py-2 d-flex justify-content-between align-items-center"
                            style={{ background: "#fbfdff", borderBottom: "1px solid #f1f5f9" }}
                          >
                            <div className="text-muted small fw-bold">STUDENTS</div>
                            <div className="text-muted small">{filtered.length} records</div>
                          </div>

                          <div style={{ maxHeight: 420, overflowY: "auto" }}>
                            {filtered.map((std, index) => (
                              <div
                                key={index}
                                className="d-flex align-items-center justify-content-between px-3 py-3"
                                style={{ borderBottom: "1px solid #f1f5f9" }}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: 38,
                                      height: 38,
                                      background: "#f1f5f9",
                                      fontWeight: 900,
                                      color: "#334155",
                                      fontSize: 12,
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 900, fontSize: 13 }}>
                                      {std?.studentId?.name || "Student"}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>
                                      ID: {std?.studentId?.studentId || "—"}
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`badge rounded-pill ${
                                    std?.status === "Present" ? "text-bg-primary" : "text-bg-light border"
                                  }`}
                                  style={{ fontWeight: 900 }}
                                >
                                  {(std?.status || "—").toUpperCase()}
                                </span>
                              </div>
                            ))}

                            {!filtered.length && (
                              <div className="text-center text-muted py-5">No matching students found.</div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="modal-footer border-0 p-4 pt-0">
                  <button
                    className="btn btn-dark px-4"
                    style={{ borderRadius: 14, fontWeight: 900 }}
                    onClick={() => {
                      setSelectedRecord(null);
                      setQuery("");
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay (nice feel) */}
        {loading && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(248,250,252,0.7)", backdropFilter: "blur(6px)", zIndex: 9999 }}
          >
            <div className="bg-white border shadow-sm rounded-4 p-4 d-flex align-items-center gap-3">
              <span className="spinner-border text-primary" />
              <div>
                <div style={{ fontWeight: 900 }}>Analyzing attendance…</div>
                <div className="text-muted small">Fetching class session records</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
