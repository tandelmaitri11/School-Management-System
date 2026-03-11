import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherAttendance() {
  const [teachers, setTeachers] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingRecord, setExistingRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [datePolicy, setDatePolicy] = useState({ allowed: true, reason: "" });
  const isDateBlocked = !datePolicy.allowed;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get("/api/teacher-attendance/teachers");
        setTeachers(res.data);
        const map = {};
        res.data.forEach((t) => { map[t._id] = "Present"; });
        setAttendanceMap(map);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const validateDate = async () => {
      if (!date) {
        if (!cancelled) setDatePolicy({ allowed: true, reason: "" });
        return;
      }
      try {
        const res = await api.get("/api/teacher-attendance/validate-date", { params: { date } });
        if (cancelled) return;
        setDatePolicy({
          allowed: !!res.data?.allowed,
          reason: String(res.data?.reason || ""),
        });
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || "Could not validate date";
          setDatePolicy({ allowed: false, reason: msg });
        }
      }
    };

    validateDate();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const toggleStatus = (id) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "Present" ? "Absent" : "Present"
    }));
  };

  const loadAttendanceForDate = async (d) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/teacher-attendance/date/${d}`);
      setExistingRecord(res.data);
      setModalOpen(true);
      return res.data;
    } catch (err) {
      setExistingRecord(null);
      setModalOpen(false);
      setMessage(`No records found for ${d}.`);
      setTimeout(() => setMessage(""), 3000);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    setMessage("");
    if (isDateBlocked) {
      setMessage(datePolicy.reason || "Attendance cannot be submitted for selected date");
      return;
    }
    try {
      setLoading(true);
      const attendance = teachers.map((t) => ({
        teacherId: t._id,
        status: attendanceMap[t._id] || "Absent"
      }));
      await api.post("/api/teacher-attendance/mark", { date, attendance });
      setMessage(`✅ Attendance saved successfully for ${date}`);
    } catch (err) {
      setMessage(err?.response?.data?.message || "❌ Error saving attendance");
    } finally {
      setLoading(false);
    }
  };

  const setAll = (status) => {
    const map = {};
    teachers.forEach((t) => (map[t._id] = status));
    setAttendanceMap(map);
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === "Present").length;
  const absentCount = teachers.length - presentCount;

  return (
    <div className="container-fluid bg-light py-5 min-vh-100">
      <div className="container" style={{ maxWidth: "1100px" }}>
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold text-dark mb-1">Faculty Attendance</h3>
            <p className="text-muted small mb-0"><i className="bi bi-calendar-event me-1"></i>Manage daily staff attendance logs</p>
          </div>
          <div className="d-flex gap-2">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-calendar3 text-primary"></i></span>
              <input type="date" className="form-control border-start-0 ps-0" value={date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button
              className="btn btn-primary shadow-sm px-4 fw-bold"
              onClick={submitAttendance}
              disabled={loading || isDateBlocked}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-check me-2"></i>}
              Save
            </button>
          </div>
        </div>
        {isDateBlocked && (
          <div className="alert alert-warning border-0 shadow-sm mb-4 py-2">
            {datePolicy.reason || "Attendance is blocked for selected date."}
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="row g-3 mb-4">
          <StatCard title="Total Staff" value={teachers.length} icon="bi-people-fill" color="text-primary" />
          <StatCard title="Present" value={presentCount} icon="bi-person-check-fill" color="text-success" />
          <StatCard title="Absent" value={absentCount} icon="bi-person-x-fill" color="text-danger" />
          <div className="col-md-3">
            <button className="btn btn-outline-primary w-100 h-100 shadow-sm rounded-4 fw-bold border bg-white" onClick={() => loadAttendanceForDate(date)}>
              <i className="bi bi-clock-history d-block fs-4 mb-1"></i> View History
            </button>
          </div>
        </div>

        {/* Alert Zone */}
        {message && <div className="alert alert-info border-0 shadow-sm mb-4">{message}</div>}

        {/* Toolbar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-secondary mb-0">Attendance Sheet</h5>
          <div className="btn-group shadow-sm rounded-3">
            <button className="btn btn-outline-success btn-sm border-0 bg-white" onClick={() => setAll("Present")}>All Present</button>
            <button className="btn btn-outline-danger btn-sm border-0 bg-white" onClick={() => setAll("Absent")}>All Absent</button>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="bg-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-4 py-3">Staff Member</th>
                  <th className="text-center py-3">Status</th>
                  <th className="text-center py-3 pe-4">Attendance Toggle</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t._id} className={attendanceMap[t._id] === "Absent" ? "table-light" : ""}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm" style={{width: "40px", height: "40px"}}>
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{t.name}</div>
                          <div className="small text-muted">{t.teacherId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 ${attendanceMap[t._id] === "Present" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                        {attendanceMap[t._id]}
                      </span>
                    </td>
                    <td className="text-center pe-4">
                      <div className="form-check form-switch d-flex justify-content-center">
                        <input className="form-check-input shadow-none" type="checkbox" role="switch" checked={attendanceMap[t._id] === "Present"} onChange={() => toggleStatus(t._id)} style={{cursor: "pointer", transform: "scale(1.2)"}} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {modalOpen && existingRecord && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Attendance Records: {existingRecord.date}</h5>
                  <button className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                    {existingRecord.attendance.map((a, i) => (
                      <div key={i} className="list-group-item d-flex justify-content-between align-items-center p-3">
                        <span className="fw-medium">{a.teacherId?.name || "Unknown"}</span>
                        <span className={`badge ${a.status === "Present" ? "bg-success" : "bg-danger"}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for clean stat cards
const StatCard = ({ title, value, icon, color }) => (
  <div className="col-md-3">
    <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center gap-3">
      <div className={`fs-3 ${color}`}><i className={`bi ${icon}`}></i></div>
      <div>
        <div className="h4 fw-bold mb-0">{value}</div>
        <small className="text-muted fw-bold text-uppercase">{title}</small>
      </div>
    </div>
  </div>
);
