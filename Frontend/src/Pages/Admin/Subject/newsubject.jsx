import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function NewSubject() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([{ subjectName: "" }]);
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

  const addSubject = () => setSubjects([...subjects, { subjectName: "" }]);
  
  const removeSpecificSubject = (index) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setToast({ show: true, type: "warning", message: "Please select a target class." });
      return;
    }

    const validSubjects = subjects.filter((s) => s.subjectName.trim());
    if (validSubjects.length === 0) {
      setToast({ show: true, type: "warning", message: "Enter at least one subject name." });
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/subjects/createSubject", {
        className: Number(selectedClass),
        subjects: validSubjects,
      });
      setToast({ show: true, type: "success", message: "Curriculum updated successfully!" });
      setSelectedClass("");
      setSubjects([{ subjectName: "" }]);
    } catch (err) {
      setToast({ show: true, type: "danger", message: "Technical error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Refined Toast Notification */}
      <div className={`toast-container position-fixed top-0 end-0 p-4`} style={{ zIndex: 1100 }}>
        <div className={`toast align-items-center text-white bg-${toast.type === 'danger' ? 'danger' : toast.type === 'warning' ? 'dark' : 'success'} border-0 shadow-lg ${toast.show ? 'show' : 'hide'}`} role="alert">
          <div className="d-flex">
            <div className="toast-body">
              <i className={`bi bi-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-6">
          
          {/* Back Button and Breadcrumb */}
          <div className="mb-4 d-flex align-items-center">
             <button onClick={() => window.history.back()} className="btn btn-link text-decoration-none text-muted p-0 me-3">
                <i className="bi bi-arrow-left fs-5"></i>
             </button>
             <span className="text-muted fw-medium">Back to Subjects</span>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: "24px" }}>
            <div className="text-center mb-5">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: "64px", height: "64px" }}>
                <i className="bi bi-journal-plus fs-2"></i>
              </div>
              <h3 className="fw-bold text-dark">Define Curriculum</h3>
              <p className="text-muted">Batch assign subjects to specific class.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Section 1: Target */}
              <div className="mb-5">
                <div className="d-flex align-items-center mb-3">
                    <span className="badge bg-primary rounded-circle me-2" style={{ padding: "6px 10px" }}>1</span>
                    <label className="form-label mb-0 fw-bold text-dark">Target Grade</label>
                </div>
                <select
                  className="form-select border-0 bg-light py-3 px-4 shadow-none"
                  style={{ borderRadius: "14px", fontSize: "1rem" }}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  required
                >
                  <option value="">Select Class / Grade Level</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.className}>
                      Class {cls.className} 
                    </option>
                  ))}
                </select>
              </div>

              {/* Section 2: Subject Entries */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                        <span className="badge bg-primary rounded-circle me-2" style={{ padding: "6px 10px" }}>2</span>
                        <label className="form-label mb-0 fw-bold text-dark">Subject Details</label>
                    </div>
                    <span className="text-muted small">{subjects.length} item(s)</span>
                </div>
                
                <div className="subject-container">
                  {subjects.map((sub, index) => (
                    <div className="group-input position-relative mb-3 animate__animated animate__fadeInUp" key={index}>
                      <input
                        type="text"
                        className="form-control border-0 bg-light py-3 px-4 pe-5"
                        style={{ borderRadius: "14px" }}
                        placeholder="Enter subject name (e.g. Advanced Mathematics)"
                        value={sub.subjectName}
                        onChange={(e) => handleChange(index, "subjectName", e.target.value)}
                        required
                      />
                      {subjects.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-link text-danger position-absolute end-0 top-50 translate-middle-y me-2 text-decoration-none"
                          onClick={() => removeSpecificSubject(index)}
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary border-0 w-100 py-2 mt-2"
                  onClick={addSubject}
                  style={{ borderRadius: "12px", borderStyle: "dashed !important", backgroundColor: "#f0f7ff" }}
                >
                  <i className="bi bi-plus-circle me-2"></i>Add Another Subject
                </button>
              </div>

              {/* Action Footer */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 fw-bold shadow-sm transition-all submit-btn"
                  style={{ borderRadius: "14px", letterSpacing: "0.5px" }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    "Save Subjects"
                  )}
                </button>
                <p className="text-center text-muted small mt-3">
                    Review entries before saving. Subjects will be visible to students immediately.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .transition-all { transition: all 0.3s ease; }
        
        .submit-btn {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border: none;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3) !important;
            filter: brightness(1.1);
        }

        .form-select:focus, .form-control:focus {
            background-color: #fff !important;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
            border: 1px solid #6366f1 !important;
        }

        .subject-container {
            max-height: 400px;
            overflow-y: auto;
            padding-right: 5px;
        }

        .subject-container::-webkit-scrollbar {
            width: 4px;
        }

        .subject-container::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export default NewSubject;