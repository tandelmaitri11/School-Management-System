import React, { useEffect, useState } from "react";
import api from "../../../api/api"; // your axios instance
import "bootstrap/dist/css/bootstrap.min.css";

export default function TeacherAttendance() {
  const [teachers, setTeachers] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [attendanceMap, setAttendanceMap] = useState({}); // { teacherId: "Present"|"Absent" }
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingRecord, setExistingRecord] = useState(null); // loaded record for date
  const [modalOpen, setModalOpen] = useState(false);

  // fetch teacher list
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get("/api/teacher-attendance/teachers");
        setTeachers(res.data);
        // default all to Present
        const map = {};
        res.data.forEach((t) => {
          map[t._id] = "Present";
        });
        setAttendanceMap(map);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();
  }, []);

  // toggle status for a teacher
  const toggleStatus = (id) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "Present" ? "Absent" : "Present"
    }));
  };

  // load attendance for a date (any past or present date)
  const loadAttendanceForDate = async (d) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/teacher-attendance/date/${d}`);
      setExistingRecord(res.data);
      setModalOpen(true);
      return res.data; // return existing record
    } catch (err) {
      console.warn("No attendance for this date or error:", err?.response?.data?.message || err.message);
      setExistingRecord(null);
      setModalOpen(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // submit attendance for selected date
  const submitAttendance = async () => {
    setMessage("");
    try {
      // check if attendance already exists for this date
      const record = await loadAttendanceForDate(date);
      if (record) {
        setMessage(`⚠️ Attendance for ${date} is already submitted.`);
        return; // prevent submitting again
      }

      const attendance = teachers.map((t) => ({
        teacherId: t._id,
        status: attendanceMap[t._id] || "Absent"
      }));

      setLoading(true);
      await api.post("/api/teacher-attendance/mark", { date, attendance });
      setMessage(`✅ Attendance saved for ${date}`);
    } catch (err) {
      console.error("Error saving teacher attendance:", err);
      setMessage(err?.response?.data?.message || "Error saving attendance");
    } finally {
      setLoading(false);
    }
  };

  // quick set all present / absent buttons
  const setAll = (status) => {
    const map = {};
    teachers.forEach((t) => (map[t._id] = status));
    setAttendanceMap(map);
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Teacher Attendance</h3>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            max={new Date().toISOString().split("T")[0]} // disable future dates
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="col-md-9 d-flex align-items-end">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => setAll("Present")}
          >
            Mark All Present
          </button>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => setAll("Absent")}
          >
            Mark All Absent
          </button>

          <button
            className="btn btn-info me-2"
            onClick={() => loadAttendanceForDate(date)}
            disabled={loading}
          >
            Load Attendance For Date
          </button>

          <button
            className="btn btn-primary"
            onClick={submitAttendance}
            disabled={loading}
          >
            Save Attendance
          </button>
        </div>
      </div>

      {/* Toast/message */}
      {message && <div className="alert alert-info">{message}</div>}

      <div className="card">
        <div className="card-header">Teachers</div>
        <div className="card-body p-0">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Name (TeacherId)</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => (
                <tr key={t._id}>
                  <td>{idx + 1}</td>
                  <td>
                    {t.name} <span className="text-muted">({t.teacherId})</span>
                  </td>
                  <td>{t.email || "-"}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={"teacher-" + t._id}
                        checked={attendanceMap[t._id] === "Present"}
                        onChange={() => toggleStatus(t._id)}
                      />
                      <label
                        className={
                          "form-check-label ms-2 " +
                          (attendanceMap[t._id] === "Present" ? "text-success" : "text-danger")
                        }
                      >
                        {attendanceMap[t._id]}
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-4">No teachers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: show existing record for date */}
      {modalOpen && existingRecord && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Attendance - {existingRecord.date}</h5>
                <button className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p>
                  Total: {existingRecord.attendance.length} • Present:{" "}
                  {existingRecord.attendance.filter((a) => a.status === "Present").length} • Absent:{" "}
                  {existingRecord.attendance.filter((a) => a.status === "Absent").length}
                </p>

                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Teacher</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingRecord.attendance.map((a, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          {a.teacherId?.name} <span className="text-muted">({a.teacherId?.teacherId})</span>
                        </td>
                        <td>
                          {a.status === "Present" ? (
                            <span className="badge bg-success">Present</span>
                          ) : (
                            <span className="badge bg-danger">Absent</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
