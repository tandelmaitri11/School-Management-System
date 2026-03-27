import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AllSubject() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  
  // UI State for collapsing/expanding
  const [expandedClasses, setExpandedClasses] = useState({});

  const navigate = useNavigate();

  const toggleClass = (id) => {
    setExpandedClasses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/api/subjects/getSubjects");
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setToast({ show: true, type: "danger", message: "Failed to load subjects." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Logic remains identical
  const normalizeList = (list) =>
    (list || [])
      .map((s) => ({
        subjectName: String(s.subjectName || s || "").trim(),
      }))
      .filter((s) => s.subjectName);

  const updateDoc = async (doc, nextCommon, nextStreams) => {
    await api.put(`/api/subjects/updateSubject/${doc._id}`, {
      common: nextCommon,
      streams: nextStreams,
    });
  };

  const handleDelete = async (doc, type, streamName, index) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      const common = normalizeList(doc.common || doc.subjects);
      const streams = (doc.streams || []).map((s) => ({
        name: s.name,
        subjects: normalizeList(s.subjects),
      }));

      let nextCommon = common;
      let nextStreams = streams;

      if (type === "common") {
        nextCommon = common.filter((_, i) => i !== index);
      } else {
        nextStreams = streams.map((s) =>
          String(s.name) === String(streamName)
            ? { ...s, subjects: s.subjects.filter((_, i) => i !== index) }
            : s
        );
      }
      await updateDoc(doc, nextCommon, nextStreams);
      setClasses(classes.map((cls) => cls._id === doc._id ? { ...cls, common: nextCommon, streams: nextStreams } : cls));
      setToast({ show: true, type: "success", message: "Subject removed." });
    } catch (err) {
      setToast({ show: true, type: "danger", message: "Failed to delete." });
    }
  };

  const handleEdit = (doc, type, streamName, index, name) => {
    setEditingSubject({ docId: doc._id, type, streamName, index });
    setUpdatedName(name);
  };

  const handleUpdate = async (doc) => {
    try {
      const common = normalizeList(doc.common || doc.subjects);
      const streams = (doc.streams || []).map((s) => ({
        name: s.name,
        subjects: normalizeList(s.subjects),
      }));

      let nextCommon = common;
      let nextStreams = streams;

      if (editingSubject?.type === "common") {
        nextCommon = common.map((s, i) => i === editingSubject.index ? { subjectName: updatedName } : s);
      } else {
        nextStreams = streams.map((s) =>
          String(s.name) === String(editingSubject.streamName)
            ? { ...s, subjects: s.subjects.map((sub, i) => i === editingSubject.index ? { subjectName: updatedName } : sub) }
            : s
        );
      }
      await updateDoc(doc, nextCommon, nextStreams);
      setClasses(classes.map((cls) => cls._id === doc._id ? { ...cls, common: nextCommon, streams: nextStreams } : cls));
      setEditingSubject(null);
      setToast({ show: true, type: "success", message: "Subject updated." });
    } catch (err) {
      setToast({ show: true, type: "danger", message: "Update failed." });
    }
  };

  const sortedClasses = [...classes]
    .sort((a, b) => {
      const aClass = String(a.className || "");
      const bClass = String(b.className || "");

      const aNum = Number(aClass);
      const bNum = Number(bClass);
      const aIsNum = !Number.isNaN(aNum);
      const bIsNum = !Number.isNaN(bNum);
      if (aIsNum && bIsNum) return aNum - bNum;

      return aClass.localeCompare(bClass, undefined, { numeric: true, sensitivity: "base" });
    });

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100" style={{ background: '#f8fafc' }}>
        <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
        <p className="mt-3 fw-medium" style={{ color: '#64748b' }}>Loading Curriculum...</p>
      </div>
    );
  }

  return (
    <div className="min-vh-100 pb-5" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .premium-card:hover, .card-active { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); border-color: rgba(79, 70, 229, 0.3); }
        .card-active { border-color: #4f46e5 !important; }
        
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); color: white; }
        
        .class-avatar { width: 48px; height: 48px; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: 800; font-size: 1.2rem; }
        
        /* Expand/Collapse Animation */
        .expandable-content { display: grid; transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .expandable-content.collapsed { grid-template-rows: 0fr; }
        .expandable-content.expanded { grid-template-rows: 1fr; }
        .expandable-inner { overflow: hidden; }

        .subject-pill { background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; transition: all 0.2s ease; }
        .subject-pill:hover { background-color: #ffffff; border-color: #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transform: translateX(2px); }
        
        .action-btns { opacity: 0; transition: opacity 0.2s ease; }
        .subject-pill:hover .action-btns { opacity: 1; }
        
        .arrow-icon { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .rotate-180 { transform: rotate(180deg); }

        .add-card { border: 2px dashed #cbd5e1; border-radius: 16px; cursor: pointer; min-height: 100px; background: transparent; transition: all 0.2s; }
        .add-card:hover { border-color: #4f46e5; background: #f5f7ff; }
        
        /* Custom Toast */
        .premium-toast { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); color: white; border-radius: 50rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: opacity 0.3s, transform 0.3s; }
        .premium-toast.bg-danger { background: rgba(225, 29, 72, 0.9) !important; }
      `}</style>

      {/* Floating Toast */}
      <div className="toast-container position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1100 }}>
        <div className={`toast premium-toast border-0 ${toast.show ? 'show' : 'hide'} ${toast.type === 'danger' ? 'bg-danger' : ''}`} role="alert">
          <div className="d-flex align-items-center px-4 py-3">
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-white'} fs-5 me-3`}></i>
            <div className="fw-medium me-4">{toast.message}</div>
            <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      {/* Premium Header */}
      <div className="container-fluid px-lg-5 pt-4">
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-journal-bookmark-fill me-1"></i> Curriculum Registry
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Manage Subjects</h2>
              <p className="text-white opacity-75 fw-medium mb-0">View and edit core subjects and stream allocations across classes.</p>
            </div>
            <button className="btn bg-white rounded-pill px-4 py-3 fw-bold shadow-sm d-flex align-items-center" style={{ color: '#4f46e5' }} onClick={() => navigate("/subject/newsubject")}>
              <i className="bi bi-plus-circle-fill me-2 fs-5"></i> New Subject Group
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="container-fluid px-lg-5">
        <div className="row g-4">
          {sortedClasses.map((cls) => {
            const isExpanded = expandedClasses[cls._id];
            const totalSubs = (cls.common || cls.subjects || []).length + (cls.streams || []).reduce((a, s) => a + (s.subjects || []).length, 0);

            return (
              <div key={cls._id} className="col-12 col-md-6 col-xl-4 col-xxl-3">
                <div className={`premium-card h-100 d-flex flex-column ${isExpanded ? 'card-active' : ''}`}>
                  
                  {/* Clickable Header */}
                  <div 
                    className="p-4 d-flex justify-content-between align-items-center"
                    onClick={() => toggleClass(cls._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="class-avatar shadow-sm">
                        {cls.className}
                      </div>
                      <div>
                        <h6 className="fw-bolder mb-0" style={{ color: '#0f172a' }}>Class {cls.className}</h6>
                        <span className="fw-medium text-muted" style={{ fontSize: '0.8rem' }}>{totalSubs} Subjects Configured</span>
                      </div>
                    </div>
                    <div className={`arrow-icon ${isExpanded ? 'rotate-180' : ''}`}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: isExpanded ? '#e0e7ff' : '#f1f5f9', color: isExpanded ? '#4f46e5' : '#64748b' }}>
                        <i className="bi bi-chevron-down"></i>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content Area */}
                  <div className={`expandable-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="expandable-inner">
                      <div className="px-4 pb-4">
                        <hr className="mt-0 mb-4" style={{ borderColor: '#e2e8f0' }} />
                        
                        {/* Common Section */}
                        <div className="mb-4">
                          <label className="fw-bold text-uppercase mb-3 d-flex align-items-center" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#4f46e5' }}>
                            <i className="bi bi-layers-fill me-2"></i> Core Curriculum
                          </label>
                          
                          {(cls.common || cls.subjects || []).length === 0 && (
                            <div className="text-muted small fst-italic ps-2 mb-2">No core subjects added.</div>
                          )}

                          {(cls.common || cls.subjects || []).map((sub, idx) => (
                            <div key={`common-${idx}`} className="subject-pill d-flex justify-content-between align-items-center p-3 mb-2">
                              {editingSubject?.docId === cls._id && editingSubject?.type === "common" && editingSubject?.index === idx ? (
                                <div className="w-100">
                                  <input autoFocus value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} className="form-control input-premium mb-2 w-100" />
                                  <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-brand flex-grow-1 fw-semibold" onClick={() => handleUpdate(cls)}>Save</button>
                                    <button className="btn btn-sm bg-white border text-muted flex-grow-1 fw-semibold" onClick={() => setEditingSubject(null)}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span className="fw-semibold text-dark">{sub.subjectName}</span>
                                  <div className="action-btns d-flex gap-1">
                                    <button className="btn btn-sm text-primary bg-white border rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); handleEdit(cls, "common", "", idx, sub.subjectName); }}><i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i></button>
                                    <button className="btn btn-sm text-danger bg-white border rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); handleDelete(cls, "common", "", idx); }}><i className="bi bi-trash3-fill" style={{ fontSize: '0.75rem' }}></i></button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Streams Section */}
                        {(cls.streams || []).map((st, sIdx) => (
                          <div key={`stream-${sIdx}`} className="mb-4">
                            <label className="fw-bold text-uppercase mb-3 d-flex align-items-center" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#059669' }}>
                              <i className="bi bi-diagram-3-fill me-2"></i> Stream: {st.name}
                            </label>
                            
                            {(st.subjects || []).length === 0 && (
                              <div className="text-muted small fst-italic ps-2 mb-2">No subjects in this stream.</div>
                            )}

                            {(st.subjects || []).map((sub, idx) => (
                              <div key={`stream-${sIdx}-sub-${idx}`} className="subject-pill d-flex justify-content-between align-items-center p-3 mb-2">
                                {editingSubject?.docId === cls._id && editingSubject?.type === "stream" && editingSubject?.streamName === st.name && editingSubject?.index === idx ? (
                                  <div className="w-100">
                                    <input autoFocus value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} className="form-control input-premium mb-2 w-100" />
                                    <div className="d-flex gap-2">
                                      <button className="btn btn-sm btn-brand flex-grow-1 fw-semibold" onClick={() => handleUpdate(cls)}>Save</button>
                                      <button className="btn btn-sm bg-white border text-muted flex-grow-1 fw-semibold" onClick={() => setEditingSubject(null)}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <span className="fw-semibold text-dark">{sub.subjectName}</span>
                                    <div className="action-btns d-flex gap-1">
                                      <button className="btn btn-sm text-primary bg-white border rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); handleEdit(cls, "stream", st.name, idx, sub.subjectName); }}><i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i></button>
                                      <button className="btn btn-sm text-danger bg-white border rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); handleDelete(cls, "stream", st.name, idx); }}><i className="bi bi-trash3-fill" style={{ fontSize: '0.75rem' }}></i></button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Card */}
          <div className="col-12 col-md-6 col-xl-4 col-xxl-3">
            <div className="add-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center" onClick={() => navigate("/subject/newsubject")}>
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: 48, height: 48, background: '#4f46e5', color: 'white' }}>
                <i className="bi bi-plus-lg fs-4"></i>
              </div>
              <h6 className="fw-bolder text-dark mb-1">Add Curriculum</h6>
              <p className="text-muted small mb-0 fw-medium">Create subject mapping for a new grade</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AllSubject;