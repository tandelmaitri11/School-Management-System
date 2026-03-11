import React, { useEffect, useMemo, useState } from "react";
import api from "../../../../api/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

export default function StudentAttendanceHistory() {
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [reportMeta, setReportMeta] = useState({
    className: "",
    section: "",
    stream: "",
    date: "",
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  const teacherId = localStorage.getItem("teacherId");

  const selectedClassDoc = useMemo(
    () => classes.find((c) => String(c._id) === String(selectedClass)) || null,
    [classes, selectedClass]
  );

  const assignedForClass = useMemo(
    () => assignedSections.filter((s) => String(s?.classId) === String(selectedClassDoc?._id || "")),
    [assignedSections, selectedClassDoc]
  );

  const classStreams = useMemo(
    () =>
      (selectedClassDoc?.streams || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => normalize(s.name))
        .filter(Boolean),
    [selectedClassDoc]
  );

  const streamOptions = useMemo(() => {
    if (classStreams.length === 0) return [];
    const assignedStreamSet = new Set(
      assignedForClass
        .map((s) => normalize(s?.stream))
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    );
    return classStreams.filter((st) => assignedStreamSet.has(st.toLowerCase()));
  }, [classStreams, assignedForClass]);

  const classHasStreams = classStreams.length > 0;
  const hasAssignedStreams = streamOptions.length > 0;

  const sectionOptions = useMemo(() => {
    const rows = assignedForClass
      .map((s) => ({ section: normalizeUpper(s.section), stream: normalize(s.stream) }))
      .filter((s) => s.section);

    if (classHasStreams) {
      if (!selectedStream) return [];
      return [...new Set(
        rows
          .filter((r) => normalize(r.stream).toLowerCase() === normalize(selectedStream).toLowerCase())
          .map((r) => r.section)
      )];
    }

    return [...new Set(rows.map((r) => r.section))];
  }, [assignedForClass, classHasStreams, selectedStream]);

  useEffect(() => {
    if (teacherId) fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
      const profile = res.data || {};
      setClasses(profile.classesFull || []);
      setAssignedSections(profile.assignedSections || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedDate || !selectedSection || (classHasStreams && !selectedStream)) {
      setMessage("Please select class, section, date and stream (if required).");
      return;
    }

    setLoading(true);
    setMessage("");
    setAttendanceData([]);
    setChartData([]);
    setReportMeta({ className: "", section: "", stream: "", date: "" });

    try {
      const qs = new URLSearchParams({
        teacherId: String(teacherId || ""),
        section: selectedSection,
        stream: selectedStream,
      }).toString();
      const res = await api.get(`/api/attendance/${selectedClass}/${selectedDate}?${qs}`);
      const data = res.data.attendance || [];
      setAttendanceData(data);
      setReportMeta({
        className: String(res.data?.classId?.className || selectedClassDoc?.className || ""),
        section: String(res.data?.section || selectedSection || ""),
        stream: String(res.data?.stream || selectedStream || ""),
        date: String(res.data?.date || selectedDate || ""),
      });

      const presentCount = data.filter((d) => d.status === "Present").length;
      const absentCount = data.filter((d) => d.status === "Absent").length;

      setChartData([
        { name: "Present", value: presentCount },
        { name: "Absent", value: absentCount },
      ]);
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage("No attendance found for this scope on this date.");
      } else {
        setMessage(err.response?.data?.message || "Failed to fetch attendance.");
      }
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#28a745", "#dc3545"];

  return (
    <div className="container-fluid px-2 px-md-4 mt-4 mb-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-3 p-md-4">
          <h3 className="text-center text-primary mb-4 fs-5 fs-md-3">
            <i className="bi bi-bar-chart-line me-2"></i>
            Attendance History
          </h3>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Class</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStream("");
                  setSelectedSection("");
                }}
              >
                <option value="">-- Select --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    Class {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Stream</label>
              <select
                className="form-select"
                value={selectedStream}
                disabled={!selectedClass || !classHasStreams || !hasAssignedStreams}
                onChange={(e) => {
                  setSelectedStream(e.target.value);
                  setSelectedSection("");
                }}
              >
                <option value="">
                  {!classHasStreams ? "N/A" : hasAssignedStreams ? "-- Select --" : "No assigned stream"}
                </option>
                {streamOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <label className="form-label fw-semibold">Section</label>
              <select
                className="form-select"
                value={selectedSection}
                disabled={!selectedClass || (classHasStreams && !selectedStream)}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">-- Select --</option>
                {sectionOptions.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="col-12 col-md-2 d-grid">
              <button className="btn btn-primary" onClick={fetchAttendance}>
                <i className="bi bi-search me-2"></i>View
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : message ? (
            <div className="alert alert-warning text-center">{message}</div>
          ) : attendanceData.length > 0 ? (
            <>
              <div className="alert alert-light border d-flex flex-wrap gap-2 align-items-center">
                <span className="badge text-bg-primary">Class {reportMeta.className || "N/A"}</span>
                <span className="badge text-bg-secondary">Section {reportMeta.section || "N/A"}</span>
                <span className="badge text-bg-dark">
                  Stream {reportMeta.stream || (classHasStreams ? "N/A" : "General")}
                </span>
                <span className="badge text-bg-info">Date {reportMeta.date || selectedDate}</span>
              </div>

              <div className="d-flex justify-content-center mt-4">
                <div style={{ width: "100%", maxWidth: 400, height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="table-responsive mt-4">
                <table className="table table-bordered align-middle text-nowrap">
                  <thead className="table-primary text-center">
                    <tr>
                      <th>#</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Stream</th>
                      <th>Date</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((entry, index) => (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td className="text-center">Class {reportMeta.className || "N/A"}</td>
                        <td className="text-center">{reportMeta.section || "N/A"}</td>
                        <td className="text-center">
                          {reportMeta.stream || (classHasStreams ? "N/A" : "General")}
                        </td>
                        <td className="text-center">{reportMeta.date || selectedDate}</td>
                        <td className="fw-medium">{entry.studentId?.name || "N/A"}</td>
                        <td className="small">{entry.studentId?.email || "N/A"}</td>
                        <td
                          className={`fw-bold text-center ${
                            entry.status === "Present" ? "text-success" : "text-danger"
                          }`}
                        >
                          {entry.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="alert alert-info text-center">Select scope and date to view attendance.</div>
          )}
        </div>
      </div>
    </div>
  );
}
