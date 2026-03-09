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
  const navigate = useNavigate();

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

  const handleDelete = async (classId, subId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await api.delete(`/api/subjects/deleteSubject/${classId}/${subId}`);
      setClasses(
        classes.map((cls) =>
          cls._id === classId
            ? { ...cls, subjects: cls.subjects.filter((s) => s._id !== subId) }
            : cls
        )
      );
      setToast({ show: true, type: "success", message: "Subject removed." });
    } catch (err) {
      setToast({ show: true, type: "danger", message: "Failed to delete." });
    }
  };

  const handleEdit = (sub) => {
    setEditingSubject(sub._id);
    setUpdatedName(sub.subjectName);
  };

  const handleUpdate = async (classId, subId) => {
    try {
      await api.put(`/api/subjects/updateSubject/${subId}`, {
        subjects: [{ _id: subId, subjectName: updatedName }],
      });
      setClasses(
        classes.map((cls) =>
          cls._id === classId
            ? {
                ...cls,
                subjects: cls.subjects.map((s) =>
                  s._id === subId ? { ...s, subjectName: updatedName } : s
                ),
              }
            : cls
        )
      );
      setEditingSubject(null);
      setToast({ show: true, type: "success", message: "Subject updated." });
    } catch (err) {
      setToast({ show: true, type: "danger", message: "Update failed." });
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-grow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <p className="mt-3 fw-medium text-secondary">Organizing Curriculum...</p>
      </div>
    );
  }

  return (
    <div className="pb-5" style={{ backgroundColor: "#fcfcfd", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Dynamic Toast */}
      <div className={`toast-container position-fixed top-0 end-0 p-3`} style={{ zIndex: 1100 }}>
        <div className={`toast align-items-center text-white bg-${toast.type === 'danger' ? 'danger' : 'dark'} border-0 ${toast.show ? 'show' : 'hide'}`} role="alert">
          <div className="d-flex">
            <div className="toast-body">
              {toast.type === 'success' ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-bottom mb-4 py-4 shadow-sm">
        <div className="container-fluid px-lg-5">
          <div className="row align-items-center">
            <div className="col">
              
              <h2 className="fw-bold text-dark mb-0">Subjects</h2>
            </div>
            <div className="col-auto">
              <button 
                className="btn btn-primary px-4 py-2 d-flex align-items-center shadow-sm"
                style={{ borderRadius: "10px", fontWeight: "600", letterSpacing: "-0.3px" }}
                onClick={() => navigate("/subject/newsubject")}
              >
                <i className="bi bi-plus-lg me-2"></i> New Subject
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid px-lg-5">
        <div className="row g-4">
          {classes.length === 0 ? (
            <div className="col-12 text-center py-5">
              <div className="bg-light d-inline-block p-4 rounded-circle mb-3">
                <i className="bi bi-journal-x text-muted" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4 className="text-dark fw-bold">Empty Bookshelves</h4>
              <p className="text-muted">No subjects have been defined for any class yet.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls._id} className="col-xl-3 col-lg-4 col-md-6">
                <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: "16px" }}>
                  
                  {/* Class Header */}
                  <div className="px-4 py-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>Grade</span>
                      <h5 className="fw-bold mb-0 text-primary">Class {cls.className}</h5>
                    </div>
                    <div className="bg-light rounded-pill px-2 py-1 text-muted" style={{ fontSize: '12px' }}>
                      {cls.subjects.length} Total
                    </div>
                  </div>

                  {/* Subject List */}
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                      {cls.subjects.length === 0 ? (
                        <div className="p-4 text-center text-muted small">No subjects found.</div>
                      ) : (
                        cls.subjects.map((sub) => (
                          <div key={sub._id} className="list-group-item border-0 px-4 py-3 subject-row">
                            {editingSubject === sub._id ? (
                              <div className="d-flex flex-column gap-2 py-1">
                                <input
                                  autoFocus
                                  type="text"
                                  value={updatedName}
                                  onChange={(e) => setUpdatedName(e.target.value)}
                                  className="form-control form-control-sm border-primary"
                                />
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-primary flex-grow-1" onClick={() => handleUpdate(cls._id, sub._id)}>Save</button>
                                  <button className="btn btn-sm btn-light border flex-grow-1" onClick={() => setEditingSubject(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-medium text-dark">{sub.subjectName}</span>
                                <div className="action-btns">
                                  <button className="btn btn-link btn-sm text-muted p-1" onClick={() => handleEdit(sub)}>
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button className="btn btn-link btn-sm text-danger p-1" onClick={() => handleDelete(cls._id, sub._id)}>
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* New Class Placeholder Card */}
          <div className="col-xl-3 col-lg-4 col-md-6">
            <div 
              className="card h-100 d-flex flex-column align-items-center justify-content-center border-0" 
              style={{ border: "2px dashed #dee2e6", backgroundColor: "transparent", cursor: "pointer", minHeight: '220px', borderRadius: '16px' }}
              onClick={() => navigate("/subject/newsubject")}
            >
              <i className="bi bi-folder-plus text-muted mb-2" style={{ fontSize: '2rem' }}></i>
              <span className="fw-bold text-muted">Expand Grades</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .subject-row {
          transition: background-color 0.2s ease;
        }
        .subject-row:hover {
          background-color: #f8faff !important;
        }
        .subject-row .action-btns {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .subject-row:hover .action-btns {
          opacity: 1;
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
        }
        .btn-primary {
          background-color: #6366f1;
          border-color: #6366f1;
        }
        .btn-primary:hover {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }
      `}</style>
    </div>
  );
}

export default AllSubject;