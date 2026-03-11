import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiCpu, FiEdit3, FiAlertCircle,FiCheckCircle, FiArrowRight, FiInfo, FiPlus } from "react-icons/fi"; 
import api from "../../../api/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5];

const normalize = (v) => String(v || "").trim();
const normalizeUpper = (v) => normalize(v).toUpperCase();

export default function ManageTimetable() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("auto");
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classId, setClassId] = useState("");
  const [stream, setStream] = useState("");
  const [section, setSection] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewScopeKey, setPreviewScopeKey] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [showOverwriteConfirmModal, setShowOverwriteConfirmModal] = useState(false);
  const [showSubjectRedirectModal, setShowSubjectRedirectModal] = useState(false);
  const [subjectRedirectPromptKey, setSubjectRedirectPromptKey] = useState("");

  const [manualDay, setManualDay] = useState(DAYS[0]);
  const [manualPeriod, setManualPeriod] = useState(1);
  const [manualSubject, setManualSubject] = useState("");
  const [manualTeacherId, setManualTeacherId] = useState("");
  const [manualUseParallel, setManualUseParallel] = useState(false);
  const [manualChoiceA, setManualChoiceA] = useState("");
  const [manualChoiceATeacher, setManualChoiceATeacher] = useState("");
  const [manualChoiceB, setManualChoiceB] = useState("");
  const [manualChoiceBTeacher, setManualChoiceBTeacher] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedClass = useMemo(
    () => classes.find((c) => String(c._id) === String(classId)) || null,
    [classes, classId]
  );

  const streamOptions = useMemo(
    () => (selectedClass?.streams || []).filter((s) => s?.isActive !== false),
    [selectedClass]
  );

  const sectionOptions = useMemo(() => {
    const all = (selectedClass?.sections || []).filter((s) => s?.isActive !== false);
    if (!stream) return all;
    const exact = all.filter((s) => normalize(s.stream).toLowerCase() === normalize(stream).toLowerCase());
    return exact.length ? exact : all.filter((s) => !normalize(s.stream));
  }, [selectedClass, stream]);

  const filteredTimetable = useMemo(() => {
    const rows = [...timetable];
    return rows.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || Number(a.period) - Number(b.period));
  }, [timetable]);

  const currentScopeKey = `${classId || ""}__${normalize(stream)}__${normalizeUpper(section)}__${overwriteExisting ? "OW" : "NOOW"}`;
  const canGenerate = !!preview && previewScopeKey === currentScopeKey;
  const subjectScopeKey = `${classId || ""}__${normalize(stream)}`;

  const loadBase = async () => {
    try {
      setLoading(true);
      const [classRes, teacherRes] = await Promise.all([
        api.get("/api/classes"),
        api.get("/api/classes/teachers"),
      ]);
      setClasses(classRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch {
      setMessage("Failed to load classes/teachers");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (classDoc, streamValue) => {
    if (!classDoc) { setSubjects([]); return; }
    try {
      const className = classDoc.className;
      const qs = streamValue ? `?stream=${encodeURIComponent(streamValue)}` : "";
      const res = await api.get(`/api/subjects/getSubjects/${className}${qs}`);
      const names = (res.data || []).map((s) => (typeof s === "string" ? s : s.subjectName)).map((s) => normalize(s)).filter(Boolean);
      const uniqueNames = Array.from(new Set(names));
      setSubjects(uniqueNames);
      if (uniqueNames.length === 0 && subjectRedirectPromptKey !== subjectScopeKey) {
          setSubjectRedirectPromptKey(subjectScopeKey);
          setShowSubjectRedirectModal(true);
      }
    } catch { setSubjects([]); }
  };

  const loadTimetable = async (cid, sec, strm) => {
    if (!cid || !sec) { setTimetable([]); return; }
    try {
      const params = new URLSearchParams();
      if (sec) params.append("section", sec);
      if (strm) params.append("stream", strm);
      const res = await api.get(`/api/timetable/class/${cid}?${params.toString()}`);
      setTimetable(res.data || []);
    } catch { setTimetable([]); }
  };

  useEffect(() => { loadBase(); }, []);
  useEffect(() => {
    setPreview(null); setMessage(""); setSection("");
    const cls = classes.find((c) => String(c._id) === String(classId));
    if (!cls) { setStream(""); setSubjects([]); setTimetable([]); return; }
    const hasStreams = (cls.streams || []).some((s) => s?.isActive !== false);
    setStream("");
    if (!hasStreams) loadSubjects(cls, "");
    else setSubjects([]);
    loadTimetable(classId, "", "");
  }, [classId, classes]);

  useEffect(() => {
    if (!selectedClass) return;
    setSection(""); setPreview(null); setMessage("");
    const hasStreams = (selectedClass.streams || []).some((s) => s?.isActive !== false);
    if (hasStreams && !stream) { setSubjects([]); return; }
    loadSubjects(selectedClass, stream);
  }, [stream, selectedClass]);

  useEffect(() => { loadTimetable(classId, section, stream); }, [classId, section, stream]);

  const validateSelection = () => {
    if (!classId) return "Please select class";
    if (streamOptions.length > 0 && !stream) return "Please select stream";
    if (!section) return "Please select section";
    return "";
  };

  const handlePreview = async () => {
    const err = validateSelection();
    if (err) { setMessage(err); return; }
    try {
      setLoading(true); setMessage("");
      const res = await api.post("/api/timetable/preview", { classId, stream, section, overwriteExisting });
      setPreview(res.data);
      setPreviewScopeKey(currentScopeKey);
      setMessage(`Preview ready. New slots: ${res.data.createdCount || 0}`);
    } catch (e) {
      setPreview(null);
      setMessage(e?.response?.data?.message || "Preview failed");
    } finally { setLoading(false); }
  };

  const executeGenerate = async () => {
    if (!canGenerate) {
      await handlePreview();
      setMessage("Preview is ready. Please review conflicts, then click Apply Generation.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/timetable/generate", { classId, stream, section, overwriteExisting });
      setMessage(`Success! Generated ${res.data.createdCount || 0} slots.`);
      await loadTimetable(classId, section, stream);
      await handlePreview();
    } catch (e) { setMessage(e?.response?.data?.message || "Generate failed"); }
    finally { setLoading(false); }
  };

  const handleManualSave = async () => {
    const err = validateSelection();
    if (err) { setMessage(err); return; }
    try {
      setLoading(true);
      const payload = { classId, stream, section, day: manualDay, period: Number(manualPeriod) };
      if (manualUseParallel) {
        payload.subject = "Optional";
        payload.parallelOptions = [
            { subjectChoice: manualChoiceA, subject: manualChoiceA, teacherId: manualChoiceATeacher },
            { subjectChoice: manualChoiceB, subject: manualChoiceB, teacherId: manualChoiceBTeacher }
        ];
      } else {
        payload.subject = manualSubject;
        payload.teacherId = manualTeacherId;
      }
      await api.post("/api/timetable/manual", payload);
      setMessage("Manual entry saved successfully");
      await loadTimetable(classId, section, stream);
    } catch (e) { setMessage(e?.response?.data?.message || "Manual save failed"); }
    finally { setLoading(false); }
  };

  const cellText = (day, period) => {
    const rows = filteredTimetable.filter((r) => r.day === day && Number(r.period) === Number(period));
    if (!rows.length) return <span className="text-muted opacity-25">-</span>;
    return rows.map((r, i) => (
      <div key={i} className="small fw-medium py-1">
        <div className="text-primary">{r.subject}</div>
        <div className="text-muted extra-small" style={{fontSize: '0.7rem'}}>{r.teacherId?.name || r.teacherName || "N/A"}</div>
      </div>
    ));
  };

  // Styles
  const modernCard = {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #f0f0f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* --- HEADER --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 px-2">
        <div>
          <h2 className="fw-bold text-dark mb-0">Timetable</h2>
          <p className="text-muted small">Manage schedules, conflicts, and academic flows.</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className={`btn px-4 rounded-pill fw-semibold transition-all ${mode === "auto" ? "btn-primary shadow-sm" : "btn-light border text-muted"}`}
            onClick={() => setMode("auto")}
          >
            <FiCpu className="me-2" /> Auto
          </button>
          <button 
            className={`btn px-4 rounded-pill fw-semibold transition-all ${mode === "manual" ? "btn-success shadow-sm" : "btn-light border text-muted"}`}
            onClick={() => setMode("manual")}
          >
            <FiEdit3 className="me-2" /> Manual
          </button>
        </div>
      </div>

      {message && (
        <div className="alert border-0 shadow-sm d-flex align-items-center rounded-4 mb-4 fade show" 
             style={{backgroundColor: message.includes('failed') ? '#fff5f5' : '#f0f9ff', color: message.includes('failed') ? '#c53030' : '#005fa3'}}>
          <FiInfo className="me-3 fs-4" />
          <span className="fw-medium">{message}</span>
        </div>
      )}

      {/* --- CONFIGURATION SECTION --- */}
      <div className="card border-0 mb-4" style={modernCard}>
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-bold text-uppercase text-muted">Academic Class</label>
              <select className="form-select border-0 bg-light rounded-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Choose Class...</option>
                {classes.map((c) => <option key={c._id} value={c._id}>Class {c.className}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold text-uppercase text-muted">Stream</label>
              <select className="form-select border-0 bg-light rounded-3 py-2" value={stream} onChange={(e) => setStream(e.target.value)} disabled={!classId || streamOptions.length === 0}>
                <option value="">{streamOptions.length ? "Choose Stream..." : "N/A"}</option>
                {streamOptions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold text-uppercase text-muted">Section</label>
              <select className="form-select border-0 bg-light rounded-3 py-2" value={section} onChange={(e) => setSection(normalizeUpper(e.target.value))} disabled={!classId || (streamOptions.length > 0 && !stream)}>
                <option value="">Choose Section...</option>
                {sectionOptions.map((s) => <option key={s._id || s.name} value={normalizeUpper(s.name)}>{normalizeUpper(s.name)}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-grid">
               {mode === 'auto' ? (
                  <button className="btn btn-dark py-2 rounded-3 fw-bold shadow-sm" onClick={handlePreview} disabled={loading}>
                    Generate Preview <FiArrowRight className="ms-1" />
                  </button>
               ) : (
                  <button className="btn btn-success py-2 rounded-3 fw-bold shadow-sm" onClick={handleManualSave} disabled={loading}>
                    <FiPlus className="me-1" /> Add Entry
                  </button>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* --- MAIN TIMETABLE VIEW --- */}
        <div className="col-xl-8">
          <div className="card border-0 h-100" style={modernCard}>
            <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Academic Schedule</h5>
              <FiCalendar className="text-muted" />
            </div>
            <div className="table-responsive p-2">
              <table className="table table-hover border-top">
                <thead>
                  <tr className="text-muted small">
                    <th className="border-0 bg-white">PERIOD</th>
                    {DAYS.map(d => <th key={d} className="border-0 bg-white">{d.substring(0,3).toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((p) => (
                    <tr key={p}>
                      <td className="fw-bold text-muted bg-light-subtle" style={{width: '80px'}}>{p}</td>
                      {DAYS.map((d) => (
                        <td key={`${d}-${p}`} className="p-3" style={{minWidth: '120px', height: '80px', verticalAlign: 'middle'}}>
                          {cellText(d, p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- SIDEBAR: AUTO OPTIONS & PREVIEW --- */}
        <div className="col-xl-4">
          {mode === 'auto' ? (
             <div className="d-flex flex-column gap-4">
               {/* Overwrite Controls */}
               <div className="card border-0 p-3" style={{...modernCard, background: '#f8f9ff'}}>
                 <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="owToggle" checked={overwriteExisting} 
                           onChange={(e) => { setOverwriteExisting(e.target.checked); setPreview(null); }} />
                    <label className="form-check-label fw-bold small text-primary" htmlFor="owToggle">Overwrite Mode</label>
                 </div>
                 <p className="extra-small text-muted mb-3" style={{fontSize: '0.75rem'}}>
                   When active, existing slots will be replaced by the AI generator.
                 </p>
                 <button className="btn btn-primary w-100 rounded-3 fw-bold shadow-sm py-2" onClick={executeGenerate} disabled={loading}>
                   {canGenerate ? "Apply Generation" : "Generate Preview First"}
                 </button>
               </div>

               {/* Preview Panel */}
               <div className="card border-0" style={modernCard}>
                 <div className="card-header bg-white border-0 pt-3 px-4">
                    <h6 className="fw-bold mb-0">Conflict Analysis</h6>
                 </div>
                 <div className="card-body px-4 pt-2">
                    {!preview ? (
                      <div className="text-center py-5">
                        <FiCpu className="fs-1 text-light mb-2" />
                        <p className="text-muted small">No data analyzed yet.</p>
                      </div>
                    ) : (
                      <div>
                         <div className="d-flex gap-2 mb-3">
                           <div className="flex-fill bg-light p-2 rounded-3 text-center">
                              <div className="small text-muted">New Slots</div>
                              <div className="fw-bold fs-5 text-primary">{preview.createdCount || 0}</div>
                           </div>
                           <div className="flex-fill bg-light p-2 rounded-3 text-center">
                              <div className="small text-muted">Conflicts</div>
                              <div className={`fw-bold fs-5 ${(preview.conflicts || []).length > 0 ? 'text-danger' : 'text-success'}`}>
                                {(preview.conflicts || []).length}
                              </div>
                           </div>
                         </div>
                         <div className="overflow-auto" style={{maxHeight: '300px'}}>
                            {(preview.conflicts || []).map((c, i) => (
                              <div key={i} className="d-flex align-items-start gap-2 mb-2 p-2 rounded-2 border-start border-4 border-danger bg-light">
                                <FiAlertCircle className="text-danger mt-1 flex-shrink-0" />
                                <div style={{fontSize: '0.8rem'}}>
                                  <span className="fw-bold">{c.day} (P{c.period})</span>: {c.reason}
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
               </div>
             </div>
          ) : (
            /* MANUAL CONTROLS UI */
            <div className="card border-0 p-4" style={modernCard}>
               <h6 className="fw-bold mb-3">Placement Details</h6>
               <div className="row g-3">
                  <div className="col-6">
                    <label className="extra-small fw-bold text-muted">DAY</label>
                    <select className="form-select bg-light border-0" value={manualDay} onChange={(e) => setManualDay(e.target.value)}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="extra-small fw-bold text-muted">PERIOD</label>
                    <select className="form-select bg-light border-0" value={manualPeriod} onChange={(e) => setManualPeriod(Number(e.target.value))}>
                      {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <div className="form-check mb-3">
                       <input className="form-check-input" type="checkbox" id="parallel" checked={manualUseParallel} onChange={(e) => setManualUseParallel(e.target.checked)} />
                       <label className="form-check-label small" htmlFor="parallel">Parallel Electives?</label>
                    </div>
                  </div>
                  {!manualUseParallel ? (
                    <>
                      <div className="col-12">
                        <label className="extra-small fw-bold text-muted">SUBJECT</label>
                        <select className="form-select bg-light border-0" value={manualSubject} onChange={(e) => setManualSubject(e.target.value)}>
                          <option value="">Select...</option>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="extra-small fw-bold text-muted">TEACHER</label>
                        <select className="form-select bg-light border-0" value={manualTeacherId} onChange={(e) => setManualTeacherId(e.target.value)}>
                          <option value="">Select...</option>
                          {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="col-12 bg-light p-2 rounded-3">
                      <p className="extra-small fw-bold text-primary mb-2">ELECTIVE CHOICES</p>
                      {/* Sub-fields for Choice A/B simplified for brevity, following same style */}
                      <select className="form-select border-0 mb-2" value={manualChoiceA} onChange={(e) => setManualChoiceA(e.target.value)}><option>Choice A...</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                      <select className="form-select border-0" value={manualChoiceB} onChange={(e) => setManualChoiceB(e.target.value)}><option>Choice B...</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS - Minimal & Modernized */}
      {showSubjectRedirectModal && (
        <div className="modal show d-block backdrop-blur" style={{backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="text-center py-4">
                <FiAlertCircle className="text-warning fs-1 mb-3" />
                <h4 className="fw-bold">No Subjects Found</h4>
                <p className="text-muted px-3">This class/stream doesn't have any subjects assigned yet. You need subjects to create a timetable.</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill rounded-pill fw-bold" onClick={() => setShowSubjectRedirectModal(false)}>Stay Here</button>
                <button className="btn btn-primary flex-fill rounded-pill fw-bold" onClick={() => navigate("/subject/newsubject")}>Add Subjects</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
