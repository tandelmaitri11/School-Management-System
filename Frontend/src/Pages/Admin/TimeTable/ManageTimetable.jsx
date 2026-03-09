import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is loaded
import api from "../../../api/api";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5];

export default function ManageTimetable() {
  const navigate = useNavigate();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("auto"); // 'auto' or 'manual'
  
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [noSubjects, setNoSubjects] = useState(false);

  const [classId, setClassId] = useState("");
  const [className, setClassName] = useState("");
  const [day, setDay] = useState("Monday");

  const [timetable, setTimetable] = useState({});
  const [autoOverwrite, setAutoOverwrite] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoReport, setAutoReport] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  /* ================= LOAD CLASSES & TEACHERS ================= */
  useEffect(() => {
    api.get("/api/classes").then(res => setClasses(res.data));
    api.get("/api/classes/teachers").then(res => setTeachers(res.data));
  }, []);

  /* ================= LOAD SUBJECTS BY CLASS ================= */
  useEffect(() => {
    if (!className) {
      setSubjects([]);
      setNoSubjects(false);
      return;
    }

    api
      .get(`/api/subjects/getSubjects/${className}`)
      .then(res => {
        if (!res.data || res.data.length === 0) {
          setSubjects([]);
          setNoSubjects(true);
          toast.warning("No subjects found. Redirecting...", { autoClose: 2000 });
          setTimeout(() => navigate("/api/admin/add-subjects"), 2000);
        } else {
          setSubjects(res.data);
          setNoSubjects(false);
        }
      })
      .catch(() => {
        setSubjects([]);
        setNoSubjects(true);
        toast.error("Failed to fetch subjects");
      });
  }, [className, navigate]);

  const handleChange = (period, field, value) => {
    setTimetable(prev => ({
      ...prev,
      [period]: { ...prev[period], [field]: value }
    }));
  };

  /* ================= SAVE MANUAL TIMETABLE ================= */
  const saveTimetable = async () => {
    // Validation
    for (let p of periods) {
      const row = timetable[p];
      if (!row || !row.subject || !row.teacherId) {
        toast.error(`Please select subject & teacher for Period ${p}`);
        return;
      }
    }

    // Conflict Check
    for (let p of periods) {
      const row = timetable[p];
      const res = await api.post("/api/timetable/check-conflict", {
        teacherId: row.teacherId,
        day,
        period: p
      });
      if (res.data.conflict) {
        toast.error(`Teacher conflict detected at Period ${p}`);
        return;
      }
    }

    // Save
    try {
      for (let p of periods) {
        const row = timetable[p];
        await api.post("/api/timetable", {
          classId,
          subject: row.subject,
          teacherId: row.teacherId,
          day,
          period: p
        });
      }
      toast.success("Timetable saved successfully");
    } catch (error) {
      toast.error("Error saving timetable");
    }
  };

  /* ================= AUTO GENERATE ================= */
  const autoGenerate = async () => {
    if (!classId) return toast.error("Select a class first");
    setAutoLoading(true);
    try {
      const payload = { classId, days, periods, overwrite: autoOverwrite };
      const res = await api.post("/api/timetable/auto-generate-class", payload);
      setAutoReport(res.data);
      setPreviewData([]);
      toast.success("Auto timetable generated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setAutoLoading(false);
    }
  };

  const previewGenerate = async () => {
    if (!classId) return toast.error("Select a class first");
    setAutoLoading(true);
    try {
      const payload = { classId, days, periods };
      const res = await api.post("/api/timetable/auto-generate-class/preview", payload);
      setPreviewData(res.data.preview || []);
      setAutoReport({
        createdCount: res.data.preview?.length || 0,
        conflicts: res.data.conflicts || [],
        unfilledSlots: res.data.unfilledSlots || [],
      });
      toast.success("Preview generated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Preview failed");
    } finally {
      setAutoLoading(false);
    }
  };

  const autoGenerateAll = async () => {
    if(!window.confirm("This will generate timetables for ALL classes. Continue?")) return;
    setAutoLoading(true);
    try {
      const payload = { days, periods, overwrite: autoOverwrite };
      const res = await api.post("/api/timetable/auto-generate-all", payload);
      setAutoReport(res.data);
      setPreviewData([]);
      toast.success("Batch generation successful");
    } catch (err) {
      toast.error(err.response?.data?.message || "Batch generation failed");
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <ToastContainer position="top-right" theme="colored" />
      
      <div className="container">
        
        {/* --- Header --- */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <i className="bi bi-calendar-range me-2 text-primary"></i>
              Manage Timetable
            </h2>
            <p className="text-muted mb-0">Create schedules manually or use the AI generator.</p>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <ul className="nav nav-pills nav-fill mb-4 bg-white p-2 rounded shadow-sm">
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'auto' ? 'active shadow-sm' : 'text-muted'}`} 
              onClick={() => setActiveTab('auto')}
            >
              <i className="bi bi-magic me-2"></i> Auto Scheduler
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'manual' ? 'active shadow-sm' : 'text-muted'}`} 
              onClick={() => setActiveTab('manual')}
            >
              <i className="bi bi-pencil-square me-2"></i> Manual Entry
            </button>
          </li>
        </ul>

        {/* =========================================================
            TAB CONTENT: AUTO SCHEDULER
           ========================================================= */}
        {activeTab === 'auto' && (
          <div className="row g-4">
            
            {/* Control Panel */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="fw-bold mb-0 text-primary">Configuration</h6>
                </div>
                <div className="card-body">
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-uppercase text-muted">Target Class</label>
                    <select
                      className="form-select"
                      value={classId}
                      onChange={(e) => {
                        const selected = classes.find(c => c._id === e.target.value);
                        setClassId(selected?._id || "");
                        setClassName(selected?.className || "");
                      }}
                    >
                      <option value="">Select Class...</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>Class {c.className}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="autoOverwrite"
                        checked={autoOverwrite}
                        onChange={(e) => setAutoOverwrite(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="autoOverwrite">
                        Overwrite Existing Data
                      </label>
                    </div>
                    <div className="form-text small">
                      If checked, previous schedules for the selected class/day will be deleted.
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary fw-bold"
                      onClick={previewGenerate}
                      disabled={autoLoading || !classId}
                    >
                      {autoLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-eye me-2"></i>}
                      Preview Schedule
                    </button>
                    <button 
                      className="btn btn-primary fw-bold"
                      onClick={autoGenerate}
                      disabled={autoLoading || !classId}
                    >
                      <i className="bi bi-lightning-charge me-2"></i>
                      Generate for Class
                    </button>
                    <hr className="text-muted my-2" />
                    <button 
                      className="btn btn-dark fw-bold"
                      onClick={autoGenerateAll}
                      disabled={autoLoading}
                    >
                       <i className="bi bi-layers-fill me-2"></i>
                       Generate All Classes
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Results / Preview Panel */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0 text-dark">Results & Preview</h6>
                  {autoReport && <span className="badge bg-success">Generation Complete</span>}
                </div>
                <div className="card-body">
                  
                  {/* Stats Row */}
                  {autoReport && (
                    <div className="row g-3 mb-4">
                      <div className="col-4">
                        <div className="p-3 border rounded bg-light text-center">
                          <div className="h4 fw-bold text-success mb-0">{autoReport.createdCount || 0}</div>
                          <div className="small text-muted">Created</div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3 border rounded bg-light text-center">
                          <div className="h4 fw-bold text-danger mb-0">{autoReport.conflicts?.length || 0}</div>
                          <div className="small text-muted">Conflicts</div>
                        </div>
                      </div>
                      <div className="col-4">
                         <div className="p-3 border rounded bg-light text-center">
                          <div className="h4 fw-bold text-warning mb-0">{autoReport.unfilledSlots?.length || 0}</div>
                          <div className="small text-muted">Unfilled</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  {previewData.length > 0 ? (
                    <div className="table-responsive border rounded">
                      <table className="table table-bordered mb-0 align-middle text-center">
                        <thead className="table-light small text-uppercase">
                          <tr>
                            <th>Period</th>
                            {days.map((dayName) => (
                              <th key={dayName}>{dayName}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {periods.map((p) => (
                            <tr key={p}>
                              <td className="fw-bold bg-light">Period {p}</td>
                              {days.map((d) => {
                                const cell = previewData.find(
                                  (row) => row.day === d && row.period === p
                                );
                                return (
                                  <td key={`${d}-${p}`}>
                                    {cell ? (
                                      <>
                                        <div className="fw-semibold">{cell.subject}</div>
                                        <small className="text-muted">
                                          {cell.teacherName || "N/A"}
                                        </small>
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted opacity-50">
                      <i className="bi bi-clipboard-data fs-1 d-block mb-2"></i>
                      <p>No preview data available.<br/>Select a class and click "Preview".</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB CONTENT: MANUAL ENTRY
           ========================================================= */}
        {activeTab === 'manual' && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              
              {/* Selection Header */}
              <div className="row g-3 mb-4 p-3 bg-light rounded border">
                <div className="col-md-5">
                  <label className="form-label fw-bold small text-muted text-uppercase">Class</label>
                  <select
                    className="form-select form-select-lg"
                    value={classId}
                    onChange={e => {
                      const selected = classes.find(c => c._id === e.target.value);
                      setClassId(selected?._id || "");
                      setClassName(selected?.className || "");
                    }}
                  >
                    <option value="">Select Class...</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>Class {c.className}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                   <label className="form-label fw-bold small text-muted text-uppercase">Day of Week</label>
                   <select
                    className="form-select form-select-lg"
                    value={day}
                    onChange={e => setDay(e.target.value)}
                  >
                    {days.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                   <div className="text-muted small w-100 text-end">
                      {noSubjects ? <span className="text-danger"><i className="bi bi-exclamation-circle"></i> No Subjects</span> : "Ready to Edit"}
                   </div>
                </div>
              </div>

              {/* Manual Table */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered align-middle">
                  <thead className="bg-dark text-white">
                    <tr>
                      <th style={{width: '10%'}} className="text-center">Period</th>
                      <th style={{width: '45%'}}>Subject</th>
                      <th style={{width: '45%'}}>Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(p => (
                      <tr key={p}>
                        <td className="text-center bg-light fw-bold fs-5">{p}</td>
                        <td>
                          <select
                            className="form-select"
                            disabled={!classId || noSubjects}
                            onChange={e => handleChange(p, "subject", e.target.value)}
                          >
                            <option value="">Choose Subject...</option>
                            {subjects.map((s, i) => (
                              <option key={i} value={s.subjectName}>{s.subjectName}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            disabled={!classId || noSubjects}
                            onChange={e => handleChange(p, "teacherId", e.target.value)}
                          >
                            <option value="">Assign Teacher...</option>
                            {teachers.map(t => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save Footer */}
              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <div className="text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Ensure no conflicts before saving.
                </div>
                <button
                  className="btn btn-success px-5 fw-bold"
                  onClick={saveTimetable}
                  disabled={!classId || noSubjects}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  Save Timetable
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
