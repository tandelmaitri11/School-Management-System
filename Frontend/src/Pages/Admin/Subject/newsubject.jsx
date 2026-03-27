import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function NewSubject() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([{ subjectName: "" }]);
  const [streamOptions, setStreamOptions] = useState([]);
  const [selectedStream, setSelectedStream] = useState("");
  const [streamSubjects, setStreamSubjects] = useState([{ subjectName: "" }]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  const fetchClasses = async () => {
    try {
      const res = await api.get("/api/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  useEffect(() => {
    fetchClasses();
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const selectedClassObj = classes.find((c) => String(c.className) === String(selectedClass));

  useEffect(() => {
    if (!selectedStream || !selectedClass) return;
    api
      .get(`/api/subjects/getSubjects/${selectedClass}?stream=${encodeURIComponent(selectedStream)}&mode=streamOnly`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setStreamSubjects(list.length ? list : [{ subjectName: "" }]);
      })
      .catch(() => setStreamSubjects([{ subjectName: "" }]));
  }, [selectedStream, selectedClass]);

  const isStreamMode = !!selectedStream;
  const activeSubjects = isStreamMode ? streamSubjects : subjects;
  const setActiveSubjects = isStreamMode ? setStreamSubjects : setSubjects;

  const addSubject = () => setActiveSubjects([...activeSubjects, { subjectName: "" }]);
  
  const removeSpecificSubject = (index) => {
    if (activeSubjects.length > 1) {
      setActiveSubjects(activeSubjects.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index, field, value) => {
    const newSubjects = [...activeSubjects];
    newSubjects[index][field] = value;
    setActiveSubjects(newSubjects);
  };

  const normalizeList = (list) =>
    (list || [])
      .map((s) => String(s.subjectName || "").trim())
      .filter((s) => s)
      .map((s) => ({ subjectName: s }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setToast({ show: true, type: "warning", message: "Please select a target class." });
      return;
    }
    const list = normalizeList(activeSubjects);
    const validSubjects = list.filter((s) => s.subjectName.trim());
    if (validSubjects.length === 0) {
      setToast({ show: true, type: "warning", message: "Enter at least one subject name." });
      return;
    }
    try {
      setLoading(true);
      if (isStreamMode && selectedStream) {
        await api.post("/api/subjects/createSubject", {
          className: Number(selectedClass),
          streamName: selectedStream,
          streamSubjects: validSubjects,
        });
      } else {
        await api.post("/api/subjects/createSubject", {
          className: Number(selectedClass),
          common: validSubjects,
        });
      }
      setToast({ show: true, type: "success", message: "Curriculum updated successfully!" });
      setSelectedClass("");
      setSubjects([{ subjectName: "" }]);
      setSelectedStream("");
      setStreamOptions([]);
      setStreamSubjects([{ subjectName: "" }]);
    } catch (err) {
      setToast({ show: true, type: "danger", message: "Technical error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .dashed-btn { border: 2px dashed #cbd5e1; background: transparent; color: #4f46e5; font-weight: 600; border-radius: 12px; transition: all 0.2s; }
        .dashed-btn:hover { border-color: #4f46e5; background: rgba(79, 70, 229, 0.05); }
        
        .subject-row { transition: all 0.2s; border: 1px solid transparent; }
        .subject-row:hover { background: #f8fafc; border-color: #e2e8f0; border-radius: 12px; }
        
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .premium-toast { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); color: white; border-radius: 50rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: opacity 0.3s, transform 0.3s; }
        .premium-toast.bg-danger { background: rgba(225, 29, 72, 0.9) !important; }
        .premium-toast.bg-warning { background: rgba(245, 158, 11, 0.9) !important; }
      `}</style>

      {/* Floating Toast Notification */}
      <div className="toast-container position-fixed top-0 end-0 p-4 mt-2" style={{ zIndex: 1200 }}>
        <div className={`toast premium-toast border-0 ${toast.show ? 'show' : 'hide'} ${toast.type === 'danger' ? 'bg-danger' : toast.type === 'warning' ? 'bg-warning' : ''}`} role="alert">
          <div className="d-flex align-items-center px-4 py-3">
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-success' : toast.type === 'warning' ? 'bi-exclamation-triangle-fill text-white' : 'bi-exclamation-circle-fill text-white'} fs-5 me-3`}></i>
            <div className="fw-medium me-4">{toast.message}</div>
            <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      <div className="container-fluid" style={{ maxWidth: "1100px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-journal-plus me-1"></i> Curriculum Setup
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Define Subjects</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Configure core subjects and stream-specific curriculum.</p>
            </div>
            <button onClick={() => window.history.back()} className="btn bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center transition-all hover-scale" style={{ width: 48, height: 48 }}>
              <i className="bi bi-arrow-left fs-5" style={{ color: '#4f46e5' }}></i>
            </button>
          </div>
        </div>

        <form id="curriculum-form" onSubmit={handleSubmit}>
          <div className="row g-4">
            
            {/* Left: Configuration Controls */}
            <div className="col-12 col-lg-5">
              <div className="premium-card p-4 p-md-5 h-100">
                <h5 className="fw-bolder mb-4 d-flex align-items-center" style={{ color: '#0f172a' }}>
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>1</div>
                  Target Audience
                </h5>

                <div className="mb-4">
                  <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Target Grade / Class</label>
                  <select
                    className="form-select input-premium"
                    value={selectedClass}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedClass(value);
                      const cls = classes.find((c) => String(c.className) === String(value));
                      setStreamOptions(Array.isArray(cls?.streams) ? cls.streams.map((s) => ({ ...s })) : []);
                      setSelectedStream("");
                      setStreamSubjects([{ subjectName: "" }]);
                      if (value) {
                        api.get(`/api/subjects/getSubjects/${value}`)
                          .then((res) => {
                            const list = Array.isArray(res.data) ? res.data : [];
                            setSubjects(list.length ? list : [{ subjectName: "" }]);
                          })
                          .catch(() => setSubjects([{ subjectName: "" }]));
                      } else {
                        setSubjects([{ subjectName: "" }]);
                      }
                    }}
                    required
                  >
                    <option value="">Select a Class...</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls.className}>Class {cls.className}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Specific Stream Filter</label>
                  {!selectedClass ? (
                    <div className="alert bg-light border text-muted py-3 px-4 rounded-3 small fw-medium">
                      <i className="bi bi-info-circle me-2 text-primary"></i> Select a class first to view available streams.
                    </div>
                  ) : (selectedClassObj?.streams || []).length === 0 ? (
                    <div className="alert bg-light border text-muted py-3 px-4 rounded-3 small fw-medium">
                      <i className="bi bi-info-circle me-2 text-primary"></i> No specialized streams configured for Class {selectedClass}. Only core curriculum applies.
                    </div>
                  ) : (
                    <select
                      className="form-select input-premium"
                      value={selectedStream}
                      onChange={(e) => setSelectedStream(e.target.value)}
                    >
                      <option value="">Core Subjects (Common to all)</option>
                      {selectedClassObj.streams.map((st) => (
                        <option key={st.name} value={st.name}>{st.name} Stream</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Subject List Editor */}
            <div className="col-12 col-lg-7">
              <div className="premium-card p-4 p-md-5 h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: '#e2e8f0' }}>
                  <h5 className="fw-bolder mb-0 d-flex align-items-center" style={{ color: '#0f172a' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>2</div>
                    {selectedStream ? `Curriculum: ${selectedStream}` : "Core Curriculum"}
                  </h5>
                  <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold shadow-sm">
                    {activeSubjects.length} Subjects
                  </span>
                </div>

                <div className="flex-grow-1 overflow-auto pe-2 mb-4" style={{ maxHeight: '400px' }}>
                  {activeSubjects.map((sub, index) => (
                    <div className="subject-row d-flex align-items-center gap-3 p-2 mb-3 animate-slide-in" key={index}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-light text-muted fw-bolder border shadow-sm flex-shrink-0" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        className="form-control input-premium flex-grow-1"
                        placeholder="e.g. Mathematics, Physics, History..."
                        value={sub.subjectName}
                        onChange={(e) => handleChange(index, "subjectName", e.target.value)}
                        required
                      />
                      {activeSubjects.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-light rounded-circle text-danger d-flex align-items-center justify-content-center flex-shrink-0 border shadow-sm" 
                          onClick={() => removeSpecificSubject(index)}
                          style={{ width: 40, height: 40 }}
                          title="Remove Subject"
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn dashed-btn w-100 py-3 mt-auto"
                  onClick={addSubject}
                >
                  <i className="bi bi-plus-lg me-2"></i> Add Another Subject
                </button>
              </div>
            </div>
          </div>

          {/* Floating Bottom Action Bar */}
          <div className="premium-card p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 mb-5" style={{ position: 'sticky', bottom: '20px', zIndex: 100 }}>
            <div className="d-flex align-items-center text-muted">
              <i className="bi bi-journal-check fs-4 text-success me-3"></i>
              <div>
                <div className="fw-bold text-dark">Ready to finalize?</div>
                <div className="small fw-medium">Changes will be immediately reflected in class timetables.</div>
              </div>
            </div>
            <button type="submit" className="btn btn-brand btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm w-100 w-md-auto" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
              ) : (
                <>Save Configuration <i className="bi bi-arrow-right ms-2"></i></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewSubject;