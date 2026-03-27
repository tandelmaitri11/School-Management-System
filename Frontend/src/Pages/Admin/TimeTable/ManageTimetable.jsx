import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiCpu, FiEdit3, FiAlertCircle, FiCheckCircle, FiArrowRight, FiInfo, FiPlus } from "react-icons/fi"; 
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
    if (!rows.length) return (
      <div className="d-flex align-items-center justify-content-center h-100 w-100 opacity-25 text-muted">
        <i className="bi bi-dash-lg fs-4"></i>
      </div>
    );
    return rows.map((r, i) => (
      <div key={i} className="timetable-slot p-2 rounded-3 mb-1 shadow-sm bg-white border">
        <div className="fw-bolder text-primary mb-1 lh-1 text-truncate" style={{ fontSize: '0.75rem', letterSpacing: '0.2px' }}>{r.subject}</div>
        <div className="text-muted text-truncate lh-1 fw-medium" style={{ fontSize: '0.65rem' }}>
          <i className="bi bi-person-fill me-1 opacity-75"></i>{r.teacherId?.name || r.teacherName || "N/A"}
        </div>
      </div>
    ));
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .segmented-control { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 4px; border-radius: 50rem; border: 1px solid rgba(255,255,255,0.3); display: inline-flex; }
        .segmented-btn { border: none; background: transparent; padding: 8px 24px; border-radius: 50rem; font-weight: 600; color: white; transition: all 0.2s; display: flex; align-items: center; }
        .segmented-btn.active { background: #ffffff; color: #4f46e5; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        
        .timetable-table th { text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; font-weight: 700; color: #64748b; background: #f8fafc !important; border-bottom: 2px solid #e2e8f0 !important; padding: 16px; text-align: center; }
        .timetable-table td { padding: 8px; border-color: #f1f5f9; background: #ffffff; vertical-align: top; }
        .timetable-slot { transition: all 0.2s ease; border-color: rgba(79, 70, 229, 0.15) !important; }
        .timetable-slot:hover { border-color: #4f46e5 !important; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15) !important; }
        
        .form-switch .form-check-input { width: 2.5em; height: 1.25em; cursor: pointer; }
        .form-switch .form-check-input:checked { background-color: #4f46e5; border-color: #4f46e5; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Premium Header Card */}
      <div 
        className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div>
            <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              <i className="bi bi-calendar-range me-1"></i> Scheduling Engine
            </span>
            <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Timetable Manager</h2>
            <p className="text-white opacity-75 fw-medium mb-0">Generate schedules automatically or fine-tune them manually.</p>
          </div>
          
          {/* Segmented Control for Mode */}
          <div className="segmented-control shadow-sm">
            <button 
              className={`segmented-btn ${mode === "auto" ? "active" : "opacity-75"}`}
              onClick={() => setMode("auto")}
            >
              <FiCpu className="me-2 fs-5" /> Auto-Generate
            </button>
            <button 
              className={`segmented-btn ${mode === "manual" ? "active" : "opacity-75"}`}
              onClick={() => setMode("manual")}
            >
              <FiEdit3 className="me-2 fs-5" /> Manual Editor
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div className="animate-fade-in mb-4">
          <div className="alert border-0 shadow-sm d-flex align-items-center rounded-4 m-0" 
               style={{ backgroundColor: message.includes('failed') ? '#fef2f2' : '#f0fdf4', borderLeft: `4px solid ${message.includes('failed') ? '#ef4444' : '#10b981'}` }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 p-2 ${message.includes('failed') ? 'bg-danger text-white' : 'bg-success text-white'}`}>
              {message.includes('failed') ? <FiAlertCircle className="fs-5" /> : <FiCheckCircle className="fs-5" />}
            </div>
            <span className="fw-semibold" style={{ color: message.includes('failed') ? '#991b1b' : '#166534' }}>{message}</span>
          </div>
        </div>
      )}

      {/* --- CONFIGURATION SECTION --- */}
      <div className="premium-card p-4 mb-4">
        <h6 className="fw-bolder text-dark mb-3 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Target Audience Details</h6>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small fw-bold text-muted mb-2">Academic Class</label>
            <select className="form-select input-premium" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Choose Class...</option>
              {classes.map((c) => <option key={c._id} value={c._id}>Class {c.className}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-bold text-muted mb-2">Academic Stream</label>
            <select className="form-select input-premium" value={stream} onChange={(e) => setStream(e.target.value)} disabled={!classId || streamOptions.length === 0}>
              <option value="">{streamOptions.length ? "Choose Stream..." : "Core (No Stream)"}</option>
              {streamOptions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-bold text-muted mb-2">Section Identifier</label>
            <select className="form-select input-premium" value={section} onChange={(e) => setSection(normalizeUpper(e.target.value))} disabled={!classId || (streamOptions.length > 0 && !stream)}>
              <option value="">Choose Section...</option>
              {sectionOptions.map((s) => <option key={s._id || s.name} value={normalizeUpper(s.name)}>Section {normalizeUpper(s.name)}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex align-items-end">
             {mode === 'auto' ? (
                <button className="btn btn-dark w-100 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center h-100" onClick={handlePreview} disabled={loading} style={{ minHeight: '44px' }}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <FiCpu className="me-2" />} Generate Preview
                </button>
             ) : (
                <button className="btn btn-success w-100 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center h-100" onClick={handleManualSave} disabled={loading} style={{ minHeight: '44px' }}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <FiPlus className="me-2" />} Save Entry
                </button>
             )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        
        {/* --- MAIN TIMETABLE VIEW --- */}
        <div className="col-12 col-xl-8">
          <div className="premium-card h-100 d-flex flex-column overflow-hidden">
            <div className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bolder text-dark d-flex align-items-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary bg-opacity-10 text-primary" style={{ width: 36, height: 36 }}>
                  <FiCalendar />
                </div>
                Master Schedule
              </h5>
              {classId && section && (
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold">
                  Class {selectedClass?.className}-{section} {stream ? `(${stream})` : ''}
                </span>
              )}
            </div>
            
            <div className="table-responsive flex-grow-1 p-0 m-0">
              <table className="table timetable-table mb-0 w-100 h-100">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Period</th>
                    {DAYS.map(d => <th key={d}>{d.substring(0,3)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((p) => (
                    <tr key={p}>
                      <td className="fw-bolder text-muted align-middle text-center bg-light" style={{ fontSize: '1.2rem' }}>{p}</td>
                      {DAYS.map((d) => (
                        <td key={`${d}-${p}`}>
                          <div className="d-flex flex-column h-100" style={{ minHeight: '70px' }}>
                            {cellText(d, p)}
                          </div>
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
        <div className="col-12 col-xl-4">
          {mode === 'auto' ? (
             <div className="d-flex flex-column gap-4 h-100">
               
               {/* Overwrite Controls */}
               <div className="premium-card p-4" style={{ background: '#f8fafc' }}>
                 <div className="d-flex align-items-center justify-content-between mb-3">
                   <div className="d-flex align-items-center">
                     <i className="bi bi-arrow-repeat text-primary fs-5 me-2"></i>
                     <h6 className="fw-bolder text-dark mb-0">Overwrite Mode</h6>
                   </div>
                   <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                     <input className="form-check-input m-0" type="checkbox" id="owToggle" checked={overwriteExisting} 
                            onChange={(e) => { setOverwriteExisting(e.target.checked); setPreview(null); }} />
                   </div>
                 </div>
                 <p className="text-muted mb-4 fw-medium" style={{ fontSize: '0.8rem' }}>
                   When active, existing slots will be replaced by the AI generator. Otherwise, only empty slots will be filled.
                 </p>
                 <button className="btn btn-brand w-100 rounded-pill fw-bold shadow-sm py-3" onClick={executeGenerate} disabled={loading || !classId || !section}>
                   {loading ? <span className="spinner-border spinner-border-sm"></span> : canGenerate ? "Apply Final Generation" : "Generate Preview First"}
                 </button>
               </div>

               {/* Preview Panel */}
               <div className="premium-card d-flex flex-column flex-grow-1 overflow-hidden">
                 <div className="bg-white border-bottom py-3 px-4">
                    <h6 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                      <i className="bi bi-shield-exclamation text-warning me-2"></i> Conflict Analysis
                    </h6>
                 </div>
                 <div className="p-4 flex-grow-1 d-flex flex-column bg-light">
                    {!preview ? (
                      <div className="text-center py-5 my-auto">
                        <div className="rounded-circle d-inline-flex align-items-center justify-content-center bg-white shadow-sm mb-3" style={{ width: 64, height: 64 }}>
                          <FiCpu className="fs-2 text-muted opacity-50" />
                        </div>
                        <h6 className="fw-bold text-dark">Awaiting Analysis</h6>
                        <p className="text-muted small px-3">Select a class and click "Generate Preview" to analyze potential scheduling conflicts.</p>
                      </div>
                    ) : (
                      <div className="animate-fade-in d-flex flex-column h-100">
                         <div className="row g-2 mb-4">
                           <div className="col-6">
                             <div className="bg-white border p-3 rounded-4 text-center shadow-sm">
                                <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>New Slots</div>
                                <div className="fw-bolder fs-3 text-primary lh-1">{preview.createdCount || 0}</div>
                             </div>
                           </div>
                           <div className="col-6">
                             <div className="bg-white border p-3 rounded-4 text-center shadow-sm">
                                <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Conflicts</div>
                                <div className={`fw-bolder fs-3 lh-1 ${(preview.conflicts || []).length > 0 ? 'text-danger' : 'text-success'}`}>
                                  {(preview.conflicts || []).length}
                                </div>
                             </div>
                           </div>
                         </div>
                         
                         <h6 className="fw-bold text-dark small text-uppercase mb-3">Detailed Log</h6>
                         <div className="overflow-auto custom-scroll flex-grow-1 pe-2" style={{ maxHeight: '350px' }}>
                           {(preview.conflicts || []).length === 0 ? (
                             <div className="alert alert-success border-0 small fw-medium d-flex align-items-center">
                               <FiCheckCircle className="me-2 fs-5" /> Perfect! No conflicts detected.
                             </div>
                           ) : (
                             (preview.conflicts || []).map((c, i) => (
                               <div key={i} className="d-flex align-items-start gap-3 mb-2 p-3 rounded-3 bg-white border shadow-sm border-start border-4 border-danger animate-fade-in">
                                 <FiAlertCircle className="text-danger mt-1 fs-5 flex-shrink-0" />
                                 <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                                   <span className="fw-bolder text-dark">{c.day} (P{c.period})</span><br/>
                                   <span className="fw-medium">{c.reason}</span>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                      </div>
                    )}
                 </div>
               </div>
             </div>
          ) : (
            /* MANUAL CONTROLS UI */
            <div className="premium-card p-4 p-md-5 h-100">
               <h5 className="fw-bolder text-dark mb-4 d-flex align-items-center border-bottom pb-3">
                 <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-success bg-opacity-10 text-success" style={{ width: 36, height: 36 }}>
                   <FiEdit3 />
                 </div>
                 Manual Placement
               </h5>
               
               <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Day of Week</label>
                    <select className="form-select input-premium" value={manualDay} onChange={(e) => setManualDay(e.target.value)}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Time Period</label>
                    <select className="form-select input-premium" value={manualPeriod} onChange={(e) => setManualPeriod(Number(e.target.value))}>
                      {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                    </select>
                  </div>

                  <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border">
                       <label className="form-check-label fw-bold text-dark mb-0" htmlFor="parallel">Parallel Electives Mode</label>
                       <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                         <input className="form-check-input m-0" type="checkbox" id="parallel" checked={manualUseParallel} onChange={(e) => setManualUseParallel(e.target.checked)} />
                       </div>
                    </div>
                  </div>

                  {!manualUseParallel ? (
                    <>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted text-uppercase">Primary Subject</label>
                        <select className="form-select input-premium" value={manualSubject} onChange={(e) => setManualSubject(e.target.value)}>
                          <option value="">Select subject...</option>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted text-uppercase">Assigned Teacher</label>
                        <select className="form-select input-premium" value={manualTeacherId} onChange={(e) => setManualTeacherId(e.target.value)}>
                          <option value="">Select teacher...</option>
                          {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="col-12 animate-fade-in">
                      <div className="p-3 bg-light rounded-4 border">
                        <p className="small fw-bolder text-primary mb-3 text-uppercase"><i className="bi bi-diagram-2-fill me-2"></i>Parallel Options</p>
                        
                        <div className="mb-3 p-3 bg-white rounded-3 border shadow-sm">
                          <label className="form-label small fw-bold text-muted text-uppercase">Option A Subject & Teacher</label>
                          <select className="form-select input-premium mb-2" value={manualChoiceA} onChange={(e) => setManualChoiceA(e.target.value)}>
                            <option value="">Select Option A Subject...</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select className="form-select input-premium" value={manualChoiceATeacher} onChange={(e) => setManualChoiceATeacher(e.target.value)}>
                            <option value="">Select Option A Teacher...</option>
                            {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                          </select>
                        </div>
                        
                        <div className="p-3 bg-white rounded-3 border shadow-sm">
                          <label className="form-label small fw-bold text-muted text-uppercase">Option B Subject & Teacher</label>
                          <select className="form-select input-premium mb-2" value={manualChoiceB} onChange={(e) => setManualChoiceB(e.target.value)}>
                            <option value="">Select Option B Subject...</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select className="form-select input-premium" value={manualChoiceBTeacher} onChange={(e) => setManualChoiceBTeacher(e.target.value)}>
                            <option value="">Select Option B Teacher...</option>
                            {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Modal for Missing Subjects */}
      {showSubjectRedirectModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
              <div className="p-5 text-center">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 mb-4" style={{ width: 80, height: 80 }}>
                  <FiAlertCircle className="text-warning" style={{ fontSize: '2.5rem' }} />
                </div>
                <h3 className="fw-bolder text-dark mb-3">No Curriculum Found</h3>
                <p className="text-muted fw-medium mb-4 px-3" style={{ fontSize: '0.95rem' }}>
                  This class/stream combination doesn't have any subjects assigned yet. You must define a curriculum before generating a timetable.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <button className="btn bg-light border text-dark fw-bold rounded-pill px-4 py-2" onClick={() => setShowSubjectRedirectModal(false)}>Cancel</button>
                  <button className="btn btn-brand fw-bold rounded-pill px-4 py-2 shadow-sm" onClick={() => navigate("/subject/newsubject")}>Setup Curriculum <i className="bi bi-arrow-right ms-2"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}