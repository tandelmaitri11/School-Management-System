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
  
  // New UI State for collapsing/expanding
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

  // Logic remains identical to your original code
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
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-white">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5 className="mt-4 fw-light text-secondary">Loading Curriculum...</h5>
      </div>
    );
  }

  return (
    <div className="min-vh-100 pb-5" style={{ backgroundColor: "#f4f7fe", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Toast */}
      <div className="toast-container position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1100 }}>
        <div className={`toast align-items-center border-0 shadow-lg ${toast.show ? 'show' : 'hide'} ${toast.type === 'danger' ? 'bg-danger text-white' : 'bg-dark text-white'}`} role="alert">
          <div className="d-flex p-2">
            <div className="toast-body"><i className={`bi ${toast.type === 'success' ? 'bi-check2-circle' : 'bi-exclamation-circle'} me-2`}></i>{toast.message}</div>
            <button type="button" className="btn-close btn-close-white m-auto me-2" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      {/* Modern Top Navigation */}
      <nav className="navbar sticky-top bg-white border-bottom py-3 px-lg-5 mb-4 shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-4 flex-grow-1">
            <div>
              <h3 className="fw-bold text-dark mb-0">Registry</h3>
              <p className="text-muted small mb-0">Manage Subjects</p>
            </div>
          </div>
          <button className="btn btn-primary rounded-pill px-4 py-2 fw-600 shadow-sm transition-all" onClick={() => navigate("/subject/newsubject")}>
            <i className="bi bi-plus-circle-fill me-2"></i>New Class
          </button>
        </div>
      </nav>

      <div className="container-fluid px-lg-5">
        <div className="row g-4">
          {sortedClasses.map((cls) => {
            const isExpanded = expandedClasses[cls._id];
            const totalSubs = (cls.common || cls.subjects || []).length + (cls.streams || []).reduce((a, s) => a + (s.subjects || []).length, 0);

            return (
              <div key={cls._id} className="col-12 col-xl-4 col-xxl-3">
                <div className={`card border-0 transition-all shadow-sm ${isExpanded ? 'card-active' : ''}`} style={{ borderRadius: "24px", overflow: 'hidden' }}>
                  
                  {/* Clickable Header */}
                  <div 
                    className="p-4 bg-white cursor-pointer d-flex justify-content-between align-items-center"
                    onClick={() => toggleClass(cls._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="class-avatar">
                        {cls.className}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">Class {cls.className}</h6>
                        <span className="text-muted small">{totalSubs} Subjects</span>
                      </div>
                    </div>
                    <div className={`arrow-icon ${isExpanded ? 'rotate-180' : ''}`}>
                      <i className="bi bi-chevron-down h5 mb-0 text-muted"></i>
                    </div>
                  </div>

                  {/* Expandable Content Area */}
                  <div className={`expandable-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="px-4 pb-4">
                      <hr className="mt-0 opacity-10 mb-4" />
                      
                      {/* Common Section */}
                      <div className="mb-4">
                        <label className="text-uppercase ls-1 fw-bold text-primary mb-3 d-block" style={{ fontSize: '0.65rem' }}>Core Curriculum</label>
                        {(cls.common || cls.subjects || []).map((sub, idx) => (
                          <div key={`common-${idx}`} className="subject-pill d-flex justify-content-between align-items-center p-3 mb-2">
                            {editingSubject?.docId === cls._id && editingSubject?.type === "common" && editingSubject?.index === idx ? (
                              <div className="w-100">
                                <input autoFocus value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} className="form-control form-control-sm mb-2 rounded-3 border-primary" />
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-dark flex-grow-1" onClick={() => handleUpdate(cls)}>Save</button>
                                  <button className="btn btn-sm btn-light border flex-grow-1" onClick={() => setEditingSubject(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="fw-medium text-secondary">{sub.subjectName}</span>
                                <div className="action-btns">
                                  <button className="btn btn-link btn-sm p-1 text-muted" onClick={(e) => { e.stopPropagation(); handleEdit(cls, "common", "", idx, sub.subjectName); }}><i className="bi bi-pencil"></i></button>
                                  <button className="btn btn-link btn-sm p-1 text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(cls, "common", "", idx); }}><i className="bi bi-trash"></i></button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Streams Section */}
                      {(cls.streams || []).map((st, sIdx) => (
                        <div key={`stream-${sIdx}`} className="mb-4">
                          <label className="text-uppercase ls-1 fw-bold text-success mb-3 d-block" style={{ fontSize: '0.65rem' }}>Stream: {st.name}</label>
                          {(st.subjects || []).map((sub, idx) => (
                            <div key={`stream-${sIdx}-sub-${idx}`} className="subject-pill d-flex justify-content-between align-items-center p-3 mb-2">
                              {editingSubject?.docId === cls._id && editingSubject?.type === "stream" && editingSubject?.streamName === st.name && editingSubject?.index === idx ? (
                                <div className="w-100">
                                  <input autoFocus value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} className="form-control form-control-sm mb-2 rounded-3 border-primary" />
                                  <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-dark flex-grow-1" onClick={() => handleUpdate(cls)}>Save</button>
                                    <button className="btn btn-sm btn-light border flex-grow-1" onClick={() => setEditingSubject(null)}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span className="fw-medium text-secondary">{sub.subjectName}</span>
                                  <div className="action-btns">
                                    <button className="btn btn-link btn-sm p-1 text-muted" onClick={(e) => { e.stopPropagation(); handleEdit(cls, "stream", st.name, idx, sub.subjectName); }}><i className="bi bi-pencil"></i></button>
                                    <button className="btn btn-link btn-sm p-1 text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(cls, "stream", st.name, idx); }}><i className="bi bi-trash"></i></button>
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
            );
          })}

          <div className="col-12 col-xl-4 col-xxl-3">
            <div className="add-card h-100 d-flex flex-column align-items-center justify-content-center p-5 text-center transition-all" onClick={() => navigate("/subject/newsubject")}>
              <div className="add-icon mb-3"><i className="bi bi-plus-lg"></i></div>
              <h6 className="fw-bold text-dark">Add New Class</h6>
              <p className="text-muted small mb-0">Define grade & subjects</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .ls-1 { letter-spacing: 0.05em; }
        .fw-600 { font-weight: 600; }
        .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        
        /* Expand/Collapse Animation */
        .expandable-content {
          display: grid;
          transition: grid-template-rows 0.3s ease-out, padding 0.3s ease;
        }
        .expandable-content.collapsed {
          grid-template-rows: 0fr;
          visibility: hidden;
        }
        .expandable-content.expanded {
          grid-template-rows: 1fr;
          visibility: visible;
        }
        .expandable-content > div {
          overflow: hidden;
        }

        .class-avatar {
          width: 48px;
          height: 48px;
          background: #EEF2FF;
          color: #6366F1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1.2rem;
        }

        .subject-pill {
          background-color: #F8FAFC;
          border-radius: 16px;
          border: 1px solid #F1F5F9;
          transition: all 0.2s ease;
        }
        .subject-pill:hover {
          background-color: #FFF;
          border-color: #E2E8F0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transform: translateX(4px);
        }

        .action-btns {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .subject-pill:hover .action-btns {
          opacity: 1;
        }

        .arrow-icon { transition: transform 0.3s ease; }
        .rotate-180 { transform: rotate(180deg); }

        .card-active {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }

        .add-card {
          border: 2px dashed #CBD5E1;
          border-radius: 24px;
          cursor: pointer;
          min-height: 200px;
        }
        .add-card:hover {
          border-color: #6366F1;
          background: #F5F7FF;
        }
        .add-icon {
          width: 50px;
          height: 50px;
          background: #6366F1;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }

        .btn-primary { background: #6366F1; border: none; }
        .btn-primary:hover { background: #4F46E5; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}

export default AllSubject;
