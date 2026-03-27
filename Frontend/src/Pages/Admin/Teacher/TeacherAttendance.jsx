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
      setTimeout(() => setMessage(""), 4000);
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
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .premium-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid transparent; border-radius: 10px; padding: 10px 16px; font-weight: 600; color: #0f172a; transition: all 0.2s; }
        .input-premium:focus { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2); outline: none; }
        
        .btn-brand { background: #ffffff; color: #4f46e5; border: none; transition: all 0.2s; font-weight: 700; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
        .btn-brand:disabled { opacity: 0.8; transform: none; box-shadow: none; cursor: not-allowed; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .form-switch .form-check-input { width: 3em; height: 1.5em; cursor: pointer; transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; }
        .form-switch .form-check-input:checked { background-color: #4f46e5; border-color: #4f46e5; }
        .form-switch .form-check-input:focus { box-shadow: 0 0 0 0.25rem rgba(79, 70, 229, 0.25); }

        .segmented-control { background: #f1f5f9; padding: 4px; border-radius: 12px; display: inline-flex; border: 1px solid #e2e8f0; }
        .segmented-btn { border: none; background: transparent; padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; }
        .segmented-btn.active-success { background: #ffffff; color: #059669; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .segmented-btn.active-danger { background: #ffffff; color: #e11d48; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .segmented-btn.inactive { color: #64748b; }
        .segmented-btn.inactive:hover { color: #0f172a; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1200px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-calendar-check-fill me-1"></i> Daily Operations
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Faculty Attendance</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Record and manage daily staff attendance logs.</p>
            </div>
            
            {/* Glassmorphism Control Panel */}
            <div className="d-flex flex-column flex-sm-row gap-3 p-3 rounded-4 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-3 px-3">
                <i className="bi bi-calendar-event-fill text-white me-2"></i>
                <input 
                  type="date" 
                  className="form-control input-premium bg-transparent text-white border-0 shadow-none px-0" 
                  value={date} 
                  max={new Date().toISOString().split("T")[0]} 
                  onChange={(e) => setDate(e.target.value)} 
                  style={{ colorScheme: 'dark' }} // Makes calendar icon visible on dark bg
                />
              </div>
              <button
                className="btn btn-brand rounded-3 px-4 py-2 d-flex align-items-center justify-content-center text-nowrap"
                onClick={submitAttendance}
                disabled={loading || isDateBlocked}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
                Save Log
              </button>
            </div>
          </div>
        </div>

        {/* Date Validation Alert */}
        {isDateBlocked && (
          <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-25 text-warning-emphasis fw-bold mb-4 d-flex align-items-center rounded-4 animate-fade-in shadow-sm">
            <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
            {datePolicy.reason || "Attendance recording is blocked for the selected date."}
          </div>
        )}

        {/* Action Message Alert */}
        {message && (
          <div className={`alert ${message.includes('❌') ? 'bg-danger text-danger border-danger' : 'bg-success text-success border-success'} bg-opacity-10 border border-opacity-25 fw-bold mb-4 d-flex align-items-center rounded-4 animate-fade-in shadow-sm`}>
            {message}
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="row g-4 mb-4">
          <StatCard title="Total Staff" value={teachers.length} icon="bi-people-fill" colorClass="primary" hexColor="#4f46e5" />
          <StatCard title="Present" value={presentCount} icon="bi-person-check-fill" colorClass="success" hexColor="#10b981" />
          <StatCard title="Absent" value={absentCount} icon="bi-person-x-fill" colorClass="danger" hexColor="#ef4444" />
          
          <div className="col-12 col-md-6 col-lg-3">
            <button 
              className="premium-card w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-primary border-0" 
              onClick={() => loadAttendanceForDate(date)}
              style={{ background: '#f8fafc', cursor: 'pointer' }}
            >
              <div className="rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm mb-2 text-primary" style={{ width: 48, height: 48 }}>
                <i className="bi bi-clock-history fs-4"></i>
              </div>
              <span className="fw-bolder mt-1 text-dark">View History</span>
              <span className="small text-muted fw-semibold">For {new Date(date).toLocaleDateString()}</span>
            </button>
          </div>
        </div>

        {/* Main Attendance Table */}
        <div className="premium-card overflow-hidden animate-fade-in">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
            <h5 className="fw-bolder text-dark mb-3 mb-sm-0 d-flex align-items-center">
              <i className="bi bi-card-checklist text-primary me-2"></i> Attendance Roster
            </h5>
            
            {/* Quick Actions */}
            <div className="segmented-control">
              <button 
                className="segmented-btn inactive" 
                onClick={() => setAll("Present")}
              >
                Mark All <span className="text-success ms-1">Present</span>
              </button>
              <div className="vr my-1 mx-1 text-secondary opacity-25"></div>
              <button 
                className="segmented-btn inactive" 
                onClick={() => setAll("Absent")}
              >
                Mark All <span className="text-danger ms-1">Absent</span>
              </button>
            </div>
          </div>

          <div className="table-responsive border-0">
            <table className="table table-premium align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Faculty Member</th>
                  <th>ID Number</th>
                  <th className="text-center">Current Status</th>
                  <th className="text-center pe-4">Toggle Presence</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                      <div className="mt-2 text-muted fw-medium">Loading roster...</div>
                    </td>
                  </tr>
                ) : (
                  teachers.map((t) => (
                    <tr key={t._id} style={{ backgroundColor: attendanceMap[t._id] === "Absent" ? '#fff1f2' : 'transparent' }}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bolder shadow-sm border ${attendanceMap[t._id] === "Present" ? 'bg-light text-primary' : 'bg-white text-danger'}`} style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bolder text-dark lh-sm mb-1">{t.name}</div>
                            <div className="small text-muted fw-medium d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-envelope-fill me-1 opacity-50"></i> {t.email || "No Email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <span className="fw-bold text-secondary font-monospace bg-light px-2 py-1 rounded border">
                          {t.teacherId || "---"}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${attendanceMap[t._id] === "Present" ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25" : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"}`}>
                          <i className={`bi ${attendanceMap[t._id] === "Present" ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`}></i>
                          {attendanceMap[t._id]}
                        </span>
                      </td>

                      <td className="text-center pe-4">
                        <div className="form-check form-switch d-flex justify-content-center mb-0">
                          <input 
                            className="form-check-input shadow-none m-0" 
                            type="checkbox" 
                            role="switch" 
                            checked={attendanceMap[t._id] === "Present"} 
                            onChange={() => toggleStatus(t._id)} 
                            title="Toggle Attendance"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Modal */}
        {modalOpen && existingRecord && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "24px", overflow: "hidden" }}>
                
                <div className="modal-header border-0 bg-light px-4 pt-4 pb-3">
                  <div>
                    <h5 className="fw-bolder text-dark mb-1 d-flex align-items-center">
                      <i className="bi bi-journal-text text-primary me-2"></i> Attendance Log
                    </h5>
                    <p className="text-muted small fw-medium mb-0">Historical records for {new Date(existingRecord.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                
                <div className="modal-body p-4 bg-white custom-scroll">
                  <div className="row g-3">
                    {existingRecord.attendance.map((a, i) => (
                      <div key={i} className="col-12 col-md-6">
                        <div className="d-flex justify-content-between align-items-center p-3 rounded-4 border bg-light shadow-sm">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-white text-muted d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: 36, height: 36 }}>
                              {(a.teacherId?.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-bold text-dark">{a.teacherId?.name || "Unknown Faculty"}</span>
                          </div>
                          <span className={`badge rounded-pill px-3 py-1 fw-bold ${a.status === "Present" ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25" : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"}`}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="modal-footer border-0 bg-light px-4 py-3">
                  <button className="btn bg-white border text-dark fw-bold rounded-pill px-4 shadow-sm" onClick={() => setModalOpen(false)}>Close Window</button>
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
const StatCard = ({ title, value, icon, colorClass, hexColor }) => (
  <div className="col-12 col-md-6 col-lg-3">
    <div className="premium-card p-4 d-flex align-items-center gap-3 h-100" style={{ borderLeft: `4px solid ${hexColor}` }}>
      <div className={`rounded-circle d-flex align-items-center justify-content-center bg-${colorClass} bg-opacity-10 text-${colorClass}`} style={{ width: 56, height: 56 }}>
        <i className={`bi ${icon} fs-3`}></i>
      </div>
      <div>
        <div className="text-muted fw-bold text-uppercase small" style={{ letterSpacing: '0.5px' }}>{title}</div>
        <div className="fw-bolder text-dark fs-3 lh-1 mt-1">{value}</div>
      </div>
    </div>
  </div>
);