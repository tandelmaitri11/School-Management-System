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

  // Logic for dynamic toast coloring
  const getToastBg = () => {
    if (toast.type === 'danger') return '#ef4444';   // Crimson
    if (toast.type === 'warning') return '#f59e0b';  // Amber
    return '#10b981';                                // Emerald Green
  };

  return (
    <div className="container-fluid min-vh-100 bg-light-subtle py-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Toast Notification - Relocated to Top Right */}
      <div className="toast-container position-fixed top-0 end-0 p-4" style={{ zIndex: 1200 }}>
        <div className={`toast align-items-center text-white border-0 shadow-lg ${toast.show ? 'show' : 'hide'}`} 
             style={{ 
               backgroundColor: getToastBg(),
               borderRadius: '10px',
               minWidth: '300px'
             }} 
             role="alert">
          <div className="d-flex p-2 align-items-center">
            <div className="toast-body fw-semibold flex-grow-1 py-2 px-3">
              <i className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1000px" }}>
        {/* Header Section */}
        <div className="row mb-4 align-items-end">
          <div className="col">
            <button onClick={() => window.history.back()} className="btn btn-white shadow-sm rounded-3 mb-3 border">
              <i className="bi bi-chevron-left me-1"></i> Back
            </button>
            <h1 className="display-6 fw-bold text-dark mb-1">Define Curriculum</h1>
            <p className="text-muted">Configure academic subjects and streams for your institution.</p>
          </div>
          <div className="col-auto d-none d-md-block">
            <button form="curriculum-form" type="submit" className="btn btn-primary px-5 py-2 fw-bold rounded-3 shadow-sm" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>}
                Save Configuration
            </button>
          </div>
        </div>

        <form id="curriculum-form" onSubmit={handleSubmit}>
          <div className="row g-4">
            
            {/* Left: Configuration Controls */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-2 me-3">
                    <i className="bi bi-layers-half fs-4"></i>
                  </div>
                  <h5 className="mb-0 fw-bold">Class & Stream</h5>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase">Target Grade</label>
                  <select
                    className="form-select form-select-lg custom-input"
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
                  <label className="form-label small fw-bold text-muted text-uppercase">Specific Stream</label>
                  {!selectedClass ? (
                    <div className="alert alert-secondary py-2 border-0 small">Please select a class first.</div>
                  ) : (selectedClassObj?.streams || []).length === 0 ? (
                    <div className="alert alert-secondary py-2 border-0 small">No streams available for Class {selectedClass}.</div>
                  ) : (
                    <select
                      className="form-select form-select-lg custom-input"
                      value={selectedStream}
                      onChange={(e) => setSelectedStream(e.target.value)}
                    >
                      <option value="">Common Subjects</option>
                      {selectedClassObj.streams.map((st) => (
                        <option key={st.name} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Subject List Editor */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="mb-0 fw-bold">
                    {selectedStream ? `Stream: ${selectedStream}` : "Common Subjects"}
                  </h5>
                  <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                    {activeSubjects.length} Total
                  </span>
                </div>

                <div className="subject-container px-1" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {activeSubjects.map((sub, index) => (
                    <div className="input-group mb-3 animate-slide-in" key={index}>
                      <span className="input-group-text border-0 bg-light text-muted fw-bold px-3" style={{ borderRadius: '12px 0 0 12px' }}>
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-lg border-0 bg-light py-3"
                        placeholder="Enter subject name (e.g. Mathematics)"
                        value={sub.subjectName}
                        onChange={(e) => handleChange(index, "subjectName", e.target.value)}
                        required
                        style={{ borderLeft: '1px solid #dee2e6' }}
                      />
                      {activeSubjects.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-light border-0 text-danger px-3" 
                          onClick={() => removeSpecificSubject(index)}
                          style={{ borderRadius: '0 12px 12px 0' }}
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary border-2 fw-bold w-100 py-3 mt-3 rounded-4 dashed-border"
                  onClick={addSubject}
                >
                  <i className="bi bi-plus-circle-dotted me-2"></i>Add New Subject
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="d-md-none fixed-bottom p-3 bg-white border-top">
            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow" disabled={loading}>
              {loading ? "Saving..." : "Save Curriculum"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .bg-light-subtle { background-color: #f8f9fc; }
        .custom-input {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 0.75rem 1rem;
            transition: all 0.2s ease;
        }
        .custom-input:focus {
            border-color: #0d6efd;
            box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.1);
            background-color: #fff;
        }
        .dashed-border {
            border-style: dashed !important;
            background-color: transparent;
        }
        .dashed-border:hover {
            background-color: rgba(13, 110, 253, 0.05);
        }
        .animate-slide-in {
            animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .subject-container::-webkit-scrollbar {
            width: 6px;
        }
        .subject-container::-webkit-scrollbar-thumb {
            background-color: #e2e8f0;
            border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export default NewSubject;