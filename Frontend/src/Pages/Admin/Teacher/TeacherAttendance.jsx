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
      setMessage(`No records found for ${d}. You can mark new attendance.`);
      setTimeout(() => setMessage(""), 3000);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    setMessage("");
    try {
      setLoading(true);
      const attendance = teachers.map((t) => ({
        teacherId: t._id,
        status: attendanceMap[t._id] || "Absent"
      }));
      await api.post("/api/teacher-attendance/mark", { date, attendance });
      setMessage(`Attendance saved successfully for ${date}`);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error saving attendance");
    } finally {
      setLoading(false);
    }
  };

  const setAll = (status) => {
    const map = {};
    teachers.forEach((t) => (map[t._id] = status));
    setAttendanceMap(map);
  };

  // Summary Counts
  const presentCount = Object.values(attendanceMap).filter(v => v === "Present").length;
  const absentCount = teachers.length - presentCount;

  return (
    <div className="container py-4">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Faculty Attendance</h2>
          <p className="text-muted mb-0">Daily roll call for staff members</p>
        </div>
        <div className="d-flex gap-2">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-calendar3 text-primary"></i>
            </span>
            <input
              type="date"
              className="form-control border-start-0 ps-0"
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary shadow-sm px-4 fw-bold" onClick={submitAttendance} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-check me-2"></i>}
            Save
          </button>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary text-white">
            <small className="opacity-75 fw-bold text-uppercase">Total Staff</small>
            <h3 className="mb-0 fw-bold">{teachers.length}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-success text-white">
            <small className="opacity-75 fw-bold text-uppercase">Present</small>
            <h3 className="mb-0 fw-bold">{presentCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-danger text-white">
            <small className="opacity-75 fw-bold text-uppercase">Absent</small>
            <h3 className="mb-0 fw-bold">{absentCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <button className="btn btn-light w-100 h-100 shadow-sm rounded-4 fw-bold text-primary border" onClick={() => loadAttendanceForDate(date)}>
            <i className="bi bi-search d-block fs-4 mb-1"></i>
            View History
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-custom bg-white border-0 shadow-sm rounded-3 d-flex align-items-center mb-4 fade show">
          <i className="bi bi-info-circle-fill text-primary fs-4 me-3"></i>
          <span className="fw-medium">{message}</span>
        </div>
      )}

      {/* Bulk Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-secondary mb-0">Staff List</h5>
        <div className="btn-group shadow-sm rounded-3 overflow-hidden">
          <button className="btn btn-outline-success btn-sm border-0 bg-white" onClick={() => setAll("Present")}>All Present</button>
          <button className="btn btn-outline-danger btn-sm border-0 bg-white" onClick={() => setAll("Absent")}>All Absent</button>
        </div>
      </div>

      {/* Main List */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 text-uppercase small text-muted">Faculty Profile</th>
                <th className="py-3 text-uppercase small text-muted text-center">Status Toggle</th>
                <th className="py-3 text-uppercase small text-muted text-end pe-4">Current Marking</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t._id} className={attendanceMap[t._id] === "Absent" ? "table-light opacity-75" : ""}>
                  <td className="ps-4 py-3">
                    <div className="d-flex align-items-center">
                      <div className="avatar bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: "40px", height: "40px"}}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{t.name}</div>
                        <div className="small text-muted">{t.teacherId} • {t.email || "No Email"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3">
                    <div className="form-check form-switch d-inline-block">
                      <input
                        className="form-check-input custom-switch"
                        type="checkbox"
                        role="switch"
                        checked={attendanceMap[t._id] === "Present"}
                        onChange={() => toggleStatus(t._id)}
                        style={{width: "3rem", height: "1.5rem", cursor: "pointer"}}
                      />
                    </div>
                  </td>
                  <td className="text-end pe-4 py-3">
                    <span className={`badge rounded-pill px-3 py-2 ${attendanceMap[t._id] === "Present" ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                      {attendanceMap[t._id] === "Present" ? <i className="bi bi-person-check-fill me-1"></i> : <i className="bi bi-person-x-fill me-1"></i>}
                      {attendanceMap[t._id]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {teachers.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-people text-muted display-1"></i>
            <p className="mt-3 text-muted">No faculty members found in the registry.</p>
          </div>
        )}
      </div>

      {/* History Modal */}
      {modalOpen && existingRecord && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Records for {existingRecord.date}</h5>
                <button className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-secondary border-0 small d-flex justify-content-between mb-4">
                    <span>Total: {existingRecord.attendance.length}</span>
                    <span className="text-success fw-bold">Present: {existingRecord.attendance.filter(a => a.status === "Present").length}</span>
                    <span className="text-danger fw-bold">Absent: {existingRecord.attendance.filter(a => a.status === "Absent").length}</span>
                </div>
                <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                  {existingRecord.attendance.map((a, i) => (
                    <div key={i} className="list-group-item d-flex justify-content-between align-items-center p-3">
                      <div>
                        <span className="fw-bold">{a.teacherId?.name}</span>
                        <div className="small text-muted">{a.teacherId?.teacherId}</div>
                      </div>
                      <span className={`badge rounded-pill ${a.status === "Present" ? "bg-success" : "bg-danger"}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-primary-subtle { background-color: #cfe2ff; }
        .bg-success-subtle { background-color: #d1e7dd; }
        .bg-danger-subtle { background-color: #f8d7da; }
        .custom-switch:checked { background-color: #198754; border-color: #198754; }
        .table-hover tbody tr:hover { background-color: #f8f9fa; }
      `}</style>
    </div>
  );
}