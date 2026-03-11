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
  const [activeTab, setActiveTab] = useState("general"); // UI State for Tabs
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
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
      <div className="spinner-grow text-primary" role="status"></div>
      <p className="mt-3 fw-bold text-secondary">Loading your school...</p>
    </div>
  );

  return (
    <div className="container-fluid py-5 px-lg-5 bg-light min-vh-100">
      <ToastContainer theme="colored" />

      {/* Modern Header & Stats */}
      <div className="row mb-5 align-items-end">
        <div className="col-md-6">
          <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 rounded-pill fw-bold">ADMIN CONSOLE</span>
          <h2 className="display-6 fw-bold text-dark">Class Directory</h2>
          <p className="text-muted">Manage academic sections, student capacities, and stream allocations.</p>
        </div>
        <div className="col-md-6 text-md-end">
          <div className="d-inline-flex gap-3 bg-white p-3 rounded-4 shadow-sm border mb-3 me-3">
             <div className="text-center px-3 border-end">
                <div className="small text-muted">Total Students</div>
                <div className="fw-bold h5 mb-0">{overallTotals.totalStudents}</div>
             </div>
             <div className="text-center px-3">
                <div className="small text-muted">Active Classes</div>
                <div className="fw-bold h5 mb-0">{classes.length}</div>
             </div>
          </div>
          <a href="/classes/new" className="btn btn-primary btn-lg rounded-pill shadow px-4">
            <i className="bi bi-plus-lg me-2"></i>Add Class
          </a>
        </div>
      </div>

      {/* Class Grid */}
      <div className="row g-4">
        {classes.map((cls) => (
          <div key={cls._id} className="col-xl-4 col-md-6">
            <div className="card border-0 shadow-sm rounded-4 h-100 class-card">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="bg-primary text-white rounded-3 p-3 shadow-sm">
                    <h3 className="mb-0 fw-bold">{cls.className}</h3>
                  </div>
                  <div className="text-end">
                    <div className="h4 fw-bold mb-0 text-primary">{classTotals[cls._id]?.totalStudents || 0}</div>
                    <div className="small text-muted text-uppercase fw-bold">Enrollment</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="small text-muted fw-bold text-uppercase mb-2 d-block">Class Teacher</label>
                  {editingTeacherClassId === cls._id ? (
                    <div className="input-group input-group-sm">
                      <select className="form-select border-primary" value={updatedTeacher} onChange={(e) => setUpdatedTeacher(e.target.value)}>
                        <option value="">Choose...</option>
                        {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                      <button className="btn btn-primary" onClick={() => handleUpdateTeacher(cls._id)}><i className="bi bi-check"></i></button>
                      <button className="btn btn-light" onClick={() => setEditingTeacherClassId(null)}><i className="bi bi-x"></i></button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded-3 border border-dashed">
                      <span className="fw-semibold text-dark"><i className="bi bi-person-badge me-2 text-primary"></i>{cls.classTeacher?.name || "Unassigned"}</span>
                      <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => handleEditTeacher(cls)}>Change</button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="small text-muted fw-bold text-uppercase mb-2 d-block">Sections</label>
                  <div className="d-flex flex-wrap gap-1">
                    {cls.sections?.slice(0, 6).map(s => (
                      <span key={s.name} className="badge bg-white text-dark border px-2 py-1 fw-medium">{s.name}</span>
                    ))}
                    {cls.sections?.length > 6 && <span className="badge bg-light text-muted">+{cls.sections.length - 6} more</span>}
                  </div>
                </div>

                <div className="d-flex gap-2 pt-3 border-top">
                  <button className="btn btn-outline-primary flex-grow-1 rounded-pill fw-bold" onClick={() => openManage(cls)}>
                    <i className="bi bi-gear-fill me-2"></i>Configure
                  </button>
                  <button className="btn btn-light rounded-circle" onClick={() => handleDelete(cls._id)}><i className="bi bi-trash text-danger"></i></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manage Modal - Redesigned with Tabs */}
      {manageOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-0 px-4 pt-4">
                <div>
                  <h4 className="fw-bold mb-0 text-dark">Management Console</h4>
                  <p className="text-muted small mb-0">Configuring Class {selectedClass?.className}</p>
                </div>
                <button className="btn-close" onClick={closeManage}></button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-4">
                <ul className="nav nav-pills bg-light p-1 rounded-pill mt-3 mb-3 border d-inline-flex">
                  <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 ${activeTab === 'general' ? 'active shadow-sm' : ''}`} onClick={() => setActiveTab('general')}>General</button>
                  </li>
                  {isSenior(selectedClass) && (
                    <li className="nav-item">
                      <button className={`nav-link rounded-pill px-4 ${activeTab === 'streams' ? 'active shadow-sm' : ''}`} onClick={() => setActiveTab('streams')}>Streams</button>
                    </li>
                  )}
                  <li className="nav-item">
                    <button className={`nav-link rounded-pill px-4 ${activeTab === 'sections' ? 'active shadow-sm' : ''}`} onClick={() => setActiveTab('sections')}>Sections</button>
                  </li>
                </ul>
              </div>

              <div className="modal-body px-4 py-2">
                {activeTab === 'general' && (
                  <div className="p-3 bg-light rounded-4 border animate-fade-in">
                    <label className="form-label fw-bold">Academic Year Label</label>
                    <input className="form-control form-control-lg border-0 shadow-sm rounded-3" value={editAcademicYear} onChange={(e) => setEditAcademicYear(e.target.value)} placeholder="e.g. 2025-26" />
                    <div className="mt-4 alert alert-warning border-0 rounded-4">
                      <i className="bi bi-info-circle-fill me-2"></i> Changes here will update student record visibility for this class.
                    </div>
                  </div>
                )}

                {activeTab === 'streams' && (
                  <div className="animate-fade-in">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Active Streams</h6>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-primary rounded-pill dropdown-toggle" data-bs-toggle="dropdown">+ Add Stream</button>
                        <ul className="dropdown-menu shadow border-0">
                          {STREAM_PRESETS.map(p => <li key={p.name}><button className="dropdown-item" onClick={() => addStreamPreset(p)}>{p.name}</button></li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="table-responsive border rounded-3 overflow-hidden">
                      <table className="table table-hover mb-0">
                        <thead className="bg-light"><tr><th>Name</th><th>Subject Choices</th><th className="text-end">Actions</th></tr></thead>
                        <tbody>
                          {editStreams.map((s, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold">{s.name}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                  {Array.from(new Set([...SUBJECT_CHOICE_LIBRARY, ...(s.subjectOptions || [])])).map((opt) => {
                                    const selected = (s.subjectOptions || []).some(
                                      (x) => String(x).toLowerCase() === String(opt).toLowerCase()
                                    );
                                    return (
                                      <button
                                        key={`${s.name}-${opt}`}
                                        type="button"
                                        className={`btn btn-sm rounded-pill ${selected ? "btn-primary" : "btn-outline-secondary"}`}
                                        onClick={() => toggleStreamSubjectOption(idx, opt)}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="input-group input-group-sm">
                                  <input
                                    className="form-control"
                                    placeholder="Add custom choice"
                                    value={customChoiceByStream[String(s.name || "").toLowerCase()] || ""}
                                    onChange={(e) =>
                                      setCustomChoiceByStream((prev) => ({
                                        ...prev,
                                        [String(s.name || "").toLowerCase()]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomStreamChoice(idx, s.name);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-dark"
                                    onClick={() => addCustomStreamChoice(idx, s.name)}
                                  >
                                    Add
                                  </button>
                                </div>
                              </td>
                              <td className="text-end"><button className="btn btn-sm btn-link text-danger" onClick={() => removeStream(idx)}><i className="bi bi-trash"></i></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'sections' && (
                  <div className="animate-fade-in">
                    <div className="card border-0 bg-light rounded-4 mb-4">
                      <div className="card-body p-3">
                        <h6 className="fw-bold mb-3 small">QUICK GENERATE</h6>
                        <div className="row g-2">
                          <div className="col-3"><input className="form-control form-control-sm" placeholder="From" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} /></div>
                          <div className="col-3"><input className="form-control form-control-sm" placeholder="To" value={rangeTo} onChange={e => setRangeTo(e.target.value)} /></div>
                          <div className="col-4">
                            <select className="form-select form-select-sm" value={rangeStream} onChange={e => setRangeStream(e.target.value)} disabled={!isSenior(selectedClass)}>
                              <option value="">General</option>
                              {streamDropdownOptions.map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                          </div>
                          <div className="col-2"><button className="btn btn-dark btn-sm w-100" onClick={() => generateRangeLocal(rangeFrom, rangeTo, rangeCap, rangeStream)}>Go</button></div>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive border rounded-4 overflow-hidden">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr className="small text-muted text-uppercase">
                            <th className="px-3">Sec</th>
                            <th>Cap</th>
                            <th>Stream Mapping</th>
                            <th className="text-end px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editSections.sort((a,b) => a.name.localeCompare(b.name)).map((s) => (
                            <tr key={s.name}>
                              <td className="px-3 fw-bold">{s.name}</td>
                              <td><input type="number" className="form-control form-control-sm w-75 border-0 bg-light" value={s.capacity} onChange={e => updateSectionField(s.name, { capacity: e.target.value })} /></td>
                              <td>
                                <select className="form-select form-select-sm border-0 bg-light" value={s.stream} onChange={e => updateSectionField(s.name, { stream: e.target.value })} disabled={!isSenior(selectedClass)}>
                                  <option value="">N/A</option>
                                  {streamDropdownOptions.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                              </td>
                              <td className="text-end px-3">
                                <button className="btn btn-sm btn-outline-danger border-0" onClick={() => removeSectionLocal(s.name)}><i className="bi bi-trash"></i></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light border-0 px-4 py-3 mt-3">
                <button className="btn btn-white rounded-pill px-4" onClick={closeManage}>Discard</button>
                <button className="btn btn-primary rounded-pill px-5 shadow" onClick={saveManage} disabled={manageSaving}>
                  {manageSaving ? "Updating..." : "Commit Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .class-card { transition: transform 0.2s, box-shadow 0.2s; }
        .class-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
        .nav-pills .nav-link { color: #6c757d; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
        .nav-pills .nav-link.active { background-color: #fff; color: #0d6efd; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
