import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Logic constants preserved
const STREAM_PRESETS = [
  { name: "Science", subjectOptions: ["Maths", "Biology"] },
  { name: "Commerce", subjectOptions: ["Maths", "IP"] },
  { name: "Arts", subjectOptions: ["History", "Geography"] },
];
const SUBJECT_CHOICE_LIBRARY = Array.from(new Set(STREAM_PRESETS.flatMap((s) => s.subjectOptions || [])));

const isValidSectionLetter = (v) => /^[A-Z]{1}$/.test(String(v || "").trim().toUpperCase());
const buildLetters = (from = "A", to = "Z") => {
  const a = String(from).toUpperCase().charCodeAt(0);
  const z = String(to).toUpperCase().charCodeAt(0);
  const out = [];
  for (let c = a; c <= z; c++) out.push(String.fromCharCode(c));
  return out;
};

export default function AllClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [classTotals, setClassTotals] = useState({});
  const [overallTotals, setOverallTotals] = useState({ totalStudents: 0, totalBoys: 0, totalGirls: 0, totalOther: 0 });

  const [editingTeacherClassId, setEditingTeacherClassId] = useState(null);
  const [updatedTeacher, setUpdatedTeacher] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); 
  const [manageSaving, setManageSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [editAcademicYear, setEditAcademicYear] = useState("");
  const [editStreams, setEditStreams] = useState([]);
  const [customChoiceByStream, setCustomChoiceByStream] = useState({});
  const [editSections, setEditSections] = useState([]);

  const [secName, setSecName] = useState("");
  const [secCap, setSecCap] = useState(40);
  const [secStream, setSecStream] = useState("");
  const [rangeFrom, setRangeFrom] = useState("A");
  const [rangeTo, setRangeTo] = useState("Z");
  const [rangeCap, setRangeCap] = useState(40);
  const [rangeStream, setRangeStream] = useState("");

  const isSenior = (cls) => Number(cls?.className) >= 11;

  // --- Logic remains exactly as provided ---
  const fetchTeachers = async () => {
    try {
      const res = await api.get("/api/classes/teachers");
      setTeachers(res.data || []);
    } catch { toast.error("Failed to fetch teachers!"); }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/classes");
      const sorted = (res.data || []).sort((a, b) => Number(a.className) - Number(b.className));
      setClasses(sorted);
      let totalsMap = {};
      let overall = { totalStudents: 0, totalBoys: 0, totalGirls: 0, totalOther: 0 };
      for (const cls of sorted) {
        try {
          const res2 = await api.get(`/api/classes/total/${cls._id}`);
          totalsMap[cls._id] = res2.data;
          overall.totalStudents += res2.data.totalStudents || 0;
          overall.totalBoys += res2.data.totalBoys || 0;
          overall.totalGirls += res2.data.totalGirls || 0;
          overall.totalOther += res2.data.totalOther || 0;
        } catch { totalsMap[cls._id] = { totalStudents: 0 }; }
      }
      setClassTotals(totalsMap);
      setOverallTotals(overall);
    } catch { toast.error("Failed to fetch classes!"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchTeachers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try { await api.delete(`/api/classes/${id}`); toast.success("Deleted!"); fetchData(); } catch { toast.error("Error!"); }
  };

  const handleEditTeacher = (cls) => {
    setEditingTeacherClassId(cls._id);
    setUpdatedTeacher(cls.classTeacher?._id || "");
  };

  const handleUpdateTeacher = async (id) => {
    if (!updatedTeacher) return toast.warning("Select teacher!");
    try {
      await api.put(`/api/classes/${id}`, { classTeacher: updatedTeacher });
      toast.success("Updated!");
      setEditingTeacherClassId(null);
      fetchData();
    } catch { toast.error("Failed!"); }
  };

  const openManage = (cls) => {
    setSelectedClass(cls);
    setEditAcademicYear(cls.academicYear || "");
    setEditStreams(Array.isArray(cls.streams) ? cls.streams.map((s) => ({ ...s })) : []);
    setCustomChoiceByStream({});
    setEditSections(Array.isArray(cls.sections) ? cls.sections.map((s) => ({ ...s })) : []);
    setActiveTab("general");
    setManageOpen(true);
  };

  const closeManage = () => {
    setManageOpen(false);
    setSelectedClass(null);
    setCustomChoiceByStream({});
  };

  const addStreamPreset = (preset) => {
    if (editStreams.some((s) => s.name.toLowerCase() === preset.name.toLowerCase())) return;
    setEditStreams([...editStreams, { ...preset, isActive: true }]);
  };

  const updateStreamField = (idx, patch) => setEditStreams(editStreams.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeStream = (idx) => {
    const key = String(editStreams[idx]?.name || "").toLowerCase();
    setEditStreams(editStreams.filter((_, i) => i !== idx));
    if (key) {
      setCustomChoiceByStream((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleStreamSubjectOption = (idx, choice) => {
    const option = String(choice || "").trim();
    if (!option) return;
    setEditStreams((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const current = Array.isArray(s.subjectOptions) ? s.subjectOptions : [];
        const exists = current.some((x) => String(x).toLowerCase() === option.toLowerCase());
        return {
          ...s,
          subjectOptions: exists
            ? current.filter((x) => String(x).toLowerCase() !== option.toLowerCase())
            : [...current, option],
        };
      })
    );
  };

  const addCustomStreamChoice = (idx, streamName) => {
    const key = String(streamName || "").toLowerCase();
    const raw = String(customChoiceByStream[key] || "").trim();
    if (!raw) return;
    toggleStreamSubjectOption(idx, raw);
    setCustomChoiceByStream((prev) => ({ ...prev, [key]: "" }));
  };

  const streamDropdownOptions = useMemo(() => {
    const active = editStreams.filter((s) => s?.isActive !== false).map((s) => String(s.name));
    return Array.from(new Set([...active, ...STREAM_PRESETS.map((x) => x.name)])).sort();
  }, [editStreams]);

  const addSectionLocal = (name, capacity, streamVal) => {
    const sec = String(name || "").trim().toUpperCase();
    if (!isValidSectionLetter(sec)) return toast.warning("A-Z only");
    if (editSections.some((x) => x.name.toUpperCase() === sec)) return;
    setEditSections([...editSections, { name: sec, capacity: Number(capacity), isActive: true, isLocked: false, stream: streamVal }]);
  };

  const updateSectionField = (name, patch) => setEditSections(editSections.map((x) => (x.name === name ? { ...x, ...patch } : x)));
  const removeSectionLocal = (name) => setEditSections(editSections.filter((x) => x.name !== name));

  const generateRangeLocal = (from, to, capacity, streamVal) => {
    const letters = buildLetters(from, to);
    letters.forEach((ltr) => addSectionLocal(ltr, capacity, streamVal));
  };

  const saveManage = async () => {
    try {
      setManageSaving(true);
      const payload = {
        academicYear: editAcademicYear,
        streams: isSenior(selectedClass) ? editStreams : [],
        sections: editSections,
      };
      await api.put(`/api/classes/${selectedClass._id}`, payload);
      toast.success("Saved!");
      closeManage();
      fetchData();
    } catch (err) { toast.error("Error updating"); } finally { setManageSaving(false); }
  };

  if (loading) return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100" style={{ background: '#f8fafc' }}>
      <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
      <p className="mt-3 fw-medium" style={{ color: '#64748b' }}>Loading directory...</p>
    </div>
  );

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1400, fontFamily: "'Inter', sans-serif" }}>
      <ToastContainer theme="colored" position="bottom-right" />

      {/* --- Premium Custom CSS --- */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); border-color: rgba(79, 70, 229, 0.3); }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; transition: all 0.2s; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); color: white; }
        .segmented-control { background: #f1f5f9; padding: 4px; border-radius: 12px; display: inline-flex; }
        .segmented-btn { border: none; background: transparent; padding: 8px 20px; border-radius: 8px; font-weight: 500; color: #64748b; transition: all 0.2s; }
        .segmented-btn.active { background: #ffffff; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Modern Header & Stats */}
      <div 
        className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 d-flex flex-column flex-md-row align-items-md-center justify-content-between p-4 p-md-5"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        
        <div className="position-relative z-1 mb-4 mb-md-0">
          <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
            <i className="bi bi-building me-1"></i> Admin Console
          </span>
          <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Class Directory</h2>
          <p className="text-white opacity-75 fw-medium mb-0">Manage academic sections, capacities, and streams.</p>
        </div>
        
        <div className="position-relative z-1 d-flex flex-column align-items-md-end gap-3">
          <div className="d-flex bg-white p-3 rounded-4 shadow-sm align-items-center">
            <div className="px-3 border-end text-center">
              <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Students</div>
              <div className="fw-bolder fs-4" style={{ color: '#0f172a' }}>{overallTotals.totalStudents.toLocaleString()}</div>
            </div>
            <div className="px-3 text-center">
              <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Classes</div>
              <div className="fw-bolder fs-4" style={{ color: '#0f172a' }}>{classes.length}</div>
            </div>
          </div>
          <a href="/classes/new" className="btn btn-light rounded-pill shadow-sm px-4 py-2 fw-semibold" style={{ color: '#4f46e5' }}>
            <i className="bi bi-plus-circle-fill me-2"></i>Add New Class
          </a>
        </div>
      </div>

      {/* Class Grid */}
      <div className="row g-4">
        {classes.map((cls) => (
          <div key={cls._id} className="col-12 col-md-6 col-xl-4">
            <div className="premium-card h-100 p-4 d-flex flex-column">
              
              {/* Card Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm" style={{ width: 56, height: 56, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                  <h3 className="mb-0 fw-bolder">{cls.className}</h3>
                </div>
                <div className="text-end">
                  <div className="fs-3 fw-bolder mb-0" style={{ color: '#0f172a', lineHeight: 1 }}>{classTotals[cls._id]?.totalStudents || 0}</div>
                  <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Enrolled</div>
                </div>
              </div>

              {/* Teacher Section */}
              <div className="mb-4">
                <label className="small fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Class Teacher</label>
                {editingTeacherClassId === cls._id ? (
                  <div className="input-group">
                    <select className="form-select input-premium py-2" value={updatedTeacher} onChange={(e) => setUpdatedTeacher(e.target.value)}>
                      <option value="">Choose...</option>
                      {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                    <button className="btn btn-brand px-3" onClick={() => handleUpdateTeacher(cls._id)}><i className="bi bi-check-lg"></i></button>
                    <button className="btn border bg-light text-muted px-3" onClick={() => setEditingTeacherClassId(null)}><i className="bi bi-x-lg"></i></button>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border" style={{ borderColor: '#f1f5f9' }}>
                    <div className="d-flex align-items-center fw-medium text-dark text-truncate">
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 32, height: 32, background: '#fff', color: '#4f46e5' }}>
                        <i className="bi bi-person-fill"></i>
                      </div>
                      <span className="text-truncate">{cls.classTeacher?.name || "Unassigned"}</span>
                    </div>
                    <button className="btn btn-sm text-primary fw-semibold p-0 ms-2 text-decoration-none" onClick={() => handleEditTeacher(cls)}>Edit</button>
                  </div>
                )}
              </div>

              {/* Sections Badges */}
              <div className="mb-4 flex-grow-1">
                <label className="small fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Sections</label>
                <div className="d-flex flex-wrap gap-2">
                  {cls.sections?.slice(0, 6).map(s => (
                    <span key={s.name} className="badge fw-semibold" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', padding: '6px 10px' }}>
                      {s.name}
                    </span>
                  ))}
                  {cls.sections?.length > 6 && <span className="badge bg-light text-muted border border-dashed py-2">+{cls.sections.length - 6} more</span>}
                  {(!cls.sections || cls.sections.length === 0) && <span className="small text-muted fst-italic">No sections added</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex gap-2 pt-3 border-top" style={{ borderColor: '#e2e8f0' }}>
                <button className="btn flex-grow-1 rounded-pill fw-semibold text-primary" style={{ background: 'rgba(79, 70, 229, 0.1)' }} onClick={() => openManage(cls)}>
                  <i className="bi bi-sliders me-2"></i>Configure
                </button>
                <button className="btn rounded-circle" style={{ background: '#fff0f2', color: '#e11d48' }} onClick={() => handleDelete(cls._id)}>
                  <i className="bi bi-trash3-fill"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Manage Modal */}
      {manageOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
              
              <div className="modal-header border-0 px-4 pt-4 pb-0 justify-content-between align-items-start">
                <div>
                  <h4 className="fw-bolder mb-1 text-dark">Class Configuration</h4>
                  <p className="text-muted fw-medium mb-0">Managing Class {selectedClass?.className}</p>
                </div>
                <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" onClick={closeManage} style={{ width: 36, height: 36 }}>
                  <i className="bi bi-x-lg text-muted"></i>
                </button>
              </div>

              <div className="px-4 mt-4">
                <div className="segmented-control w-100 w-md-auto">
                  <button className={`segmented-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
                  {isSenior(selectedClass) && (
                    <button className={`segmented-btn ${activeTab === 'streams' ? 'active' : ''}`} onClick={() => setActiveTab('streams')}>Streams</button>
                  )}
                  <button className={`segmented-btn ${activeTab === 'sections' ? 'active' : ''}`} onClick={() => setActiveTab('sections')}>Sections</button>
                </div>
              </div>

              <div className="modal-body px-4 py-4 custom-scroll">
                
                {/* General Tab */}
                {activeTab === 'general' && (
                  <div className="animate-fade-in p-4 bg-light rounded-4 border">
                    <label className="form-label fw-bold text-dark">Academic Year Label</label>
                    <input className="form-control input-premium fs-5" value={editAcademicYear} onChange={(e) => setEditAcademicYear(e.target.value)} placeholder="e.g. 2025-26" />
                    <div className="mt-3 text-muted small fw-medium d-flex align-items-center">
                      <i className="bi bi-info-circle text-primary me-2 fs-5"></i> 
                      Updates the overarching academic year identifier for this class's records.
                    </div>
                  </div>
                )}

                {/* Streams Tab */}
                {activeTab === 'streams' && (
                  <div className="animate-fade-in">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bolder mb-0 text-dark">Active Streams</h6>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-primary rounded-pill fw-semibold dropdown-toggle px-3" data-bs-toggle="dropdown">
                          <i className="bi bi-plus me-1"></i> Add Stream
                        </button>
                        <ul className="dropdown-menu shadow-sm border-0 rounded-3">
                          {STREAM_PRESETS.map(p => <li key={p.name}><button className="dropdown-item fw-medium" onClick={() => addStreamPreset(p)}>{p.name}</button></li>)}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="border rounded-4 overflow-hidden bg-white">
                      <table className="table table-premium mb-0">
                        <thead className="bg-light"><tr><th>Stream Name</th><th>Subject Requirements</th><th className="text-end">Actions</th></tr></thead>
                        <tbody>
                          {editStreams.length === 0 && (
                            <tr><td colSpan="3" className="text-center text-muted py-4">No streams configured.</td></tr>
                          )}
                          {editStreams.map((s, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold text-dark">{s.name}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                  {Array.from(new Set([...SUBJECT_CHOICE_LIBRARY, ...(s.subjectOptions || [])])).map((opt) => {
                                    const selected = (s.subjectOptions || []).some((x) => String(x).toLowerCase() === String(opt).toLowerCase());
                                    return (
                                      <button
                                        key={`${s.name}-${opt}`}
                                        type="button"
                                        className={`badge border-0 px-3 py-2 fw-medium ${selected ? "bg-primary text-white" : "bg-light text-muted border border-secondary"}`}
                                        onClick={() => toggleStreamSubjectOption(idx, opt)}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="input-group">
                                  <input
                                    className="form-control input-premium py-1"
                                    placeholder="Add custom subject..."
                                    value={customChoiceByStream[String(s.name || "").toLowerCase()] || ""}
                                    onChange={(e) => setCustomChoiceByStream((prev) => ({ ...prev, [String(s.name || "").toLowerCase()]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomStreamChoice(idx, s.name);
                                      }
                                    }}
                                  />
                                  <button type="button" className="btn border bg-light fw-medium text-dark px-3" onClick={() => addCustomStreamChoice(idx, s.name)}>
                                    Add
                                  </button>
                                </div>
                              </td>
                              <td className="text-end">
                                <button className="btn btn-sm text-danger bg-light rounded-circle p-2" onClick={() => removeStream(idx)}>
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sections Tab */}
                {activeTab === 'sections' && (
                  <div className="animate-fade-in">
                    
                    {/* Quick Gen Card */}
                    <div className="bg-light border p-4 rounded-4 mb-4">
                      <h6 className="fw-bolder mb-3 text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}><i className="bi bi-lightning-charge-fill text-warning me-2"></i>Quick Generate Sections</h6>
                      <div className="row g-2 align-items-center">
                        <div className="col-6 col-md-2">
                          <label className="small text-muted fw-bold mb-1">From</label>
                          <input className="form-control input-premium py-2 text-center text-uppercase fw-bold" placeholder="A" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} maxLength={1}/>
                        </div>
                        <div className="col-6 col-md-2">
                          <label className="small text-muted fw-bold mb-1">To</label>
                          <input className="form-control input-premium py-2 text-center text-uppercase fw-bold" placeholder="Z" value={rangeTo} onChange={e => setRangeTo(e.target.value)} maxLength={1}/>
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="small text-muted fw-bold mb-1">Capacity</label>
                          <input type="number" className="form-control input-premium py-2 text-center" value={rangeCap} onChange={e => setRangeCap(e.target.value)} />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="small text-muted fw-bold mb-1">Stream</label>
                          <select className="form-select input-premium py-2" value={rangeStream} onChange={e => setRangeStream(e.target.value)} disabled={!isSenior(selectedClass)}>
                            <option value="">General</option>
                            {streamDropdownOptions.map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                        <div className="col-12 col-md-2 mt-auto">
                          <button className="btn btn-dark w-100 rounded-3 py-2 fw-semibold" onClick={() => generateRangeLocal(rangeFrom, rangeTo, rangeCap, rangeStream)}>Generate</button>
                        </div>
                      </div>
                    </div>

                    {/* Sections Table */}
                    <div className="border rounded-4 overflow-hidden bg-white">
                      <table className="table table-premium align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="px-4">Section ID</th>
                            <th>Capacity Limit</th>
                            <th>Stream Mapping</th>
                            <th className="text-end px-4">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editSections.length === 0 && (
                            <tr><td colSpan="4" className="text-center text-muted py-4">No sections generated yet.</td></tr>
                          )}
                          {editSections.sort((a,b) => a.name.localeCompare(b.name)).map((s) => (
                            <tr key={s.name}>
                              <td className="px-4 fw-bolder text-dark fs-5">{s.name}</td>
                              <td>
                                <div className="input-group" style={{ width: '120px' }}>
                                  <input type="number" className="form-control bg-light border-0 fw-semibold text-center rounded-3" value={s.capacity} onChange={e => updateSectionField(s.name, { capacity: e.target.value })} />
                                </div>
                              </td>
                              <td>
                                <select className="form-select bg-light border-0 fw-medium rounded-3" style={{ width: '150px' }} value={s.stream} onChange={e => updateSectionField(s.name, { stream: e.target.value })} disabled={!isSenior(selectedClass)}>
                                  <option value="">General</option>
                                  {streamDropdownOptions.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                              </td>
                              <td className="text-end px-4">
                                <button className="btn btn-sm text-danger bg-light rounded-circle p-2" onClick={() => removeSectionLocal(s.name)}>
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top bg-light px-4 py-3 justify-content-between">
                <button className="btn text-muted fw-semibold px-4" onClick={closeManage}>Discard Changes</button>
                <button className="btn btn-brand rounded-pill px-5 py-2 fw-semibold shadow-sm" onClick={saveManage} disabled={manageSaving}>
                  {manageSaving ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>
                  ) : "Commit Changes"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}