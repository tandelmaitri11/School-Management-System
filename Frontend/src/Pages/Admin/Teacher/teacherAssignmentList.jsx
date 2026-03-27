import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function TeacherAssignmentList() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [teacherRes, classRes] = await Promise.all([
          api.get("/api/teachers/getTeachers"),
          api.get("/api/classes"),
        ]);
        setTeachers(teacherRes.data || []);
        setClasses(classRes.data || []);
        setError("");
      } catch (err) {
        setError("Failed to load teacher assignment list.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const classNameMap = useMemo(() => {
    const map = {};
    (classes || []).forEach((cls) => {
      map[String(cls._id)] = cls.className;
    });
    return map;
  }, [classes]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return (teachers || []).filter((t) => {
      const name = String(t.teacherName || "").toLowerCase();
      const reg = String(t.regNumber || "").toLowerCase();
      const email = String(t.email || "").toLowerCase();
      return name.includes(q) || reg.includes(q) || email.includes(q);
    });
  }, [teachers, search]);

  const handleDelete = async (teacher) => {
    const regOrId = teacher?.regNumber || teacher?._id;
    if (!regOrId) return;
    if (!window.confirm(`Are you sure you want to delete ${teacher?.teacherName || "this teacher"}?`)) return;

    try {
      setDeletingId(String(teacher._id || ""));
      await api.delete(`/api/teachers/deleteTeacher/${regOrId}`);
      setTeachers((prev) => prev.filter((t) => String(t._id) !== String(teacher._id)));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete teacher.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        
        .input-premium { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 50rem; padding: 12px 20px 12px 48px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 16px; background: #f8fafc; }
        .table-premium td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .table-premium tr:hover td { background-color: #f8fafc; }
        
        .pill-badge { padding: 6px 12px; border-radius: 50rem; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.2px; display: inline-flex; align-items: center; }
        
        .action-btn { background: #f8fafc; color: #64748b; border: 1px solid transparent; transition: all 0.2s; border-radius: 8px; padding: 6px 12px; font-weight: 600; font-size: 0.85rem; }
        .action-btn:hover { background: #ffffff; color: #4f46e5; border-color: #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .action-btn-danger:hover { color: #e11d48; border-color: #fecdd3; background: #fff1f2; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="container" style={{ maxWidth: "1400px" }}>
        
        {/* Premium Header Card */}
        <div 
          className="rounded-4 overflow-hidden mb-4 shadow-sm border-0 position-relative p-4 p-md-5"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
            <div>
              <span className="badge px-3 py-2 rounded-pill fw-semibold mb-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
                <i className="bi bi-diagram-3-fill me-1"></i> Academic Allocation
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Teacher Assignments</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Overview of faculty members and their assigned classes and sections.</p>
            </div>
            
            <div className="position-relative" style={{ minWidth: "300px" }}>
              <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '20px' }}></i>
              <input
                type="text"
                className="form-control input-premium w-100 shadow-sm"
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
            <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
            <p className="mt-3 text-muted fw-medium">Loading Assignment Data...</p>
          </div>
        ) : error ? (
          <div className="alert bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger border-0 rounded-4 p-4 d-flex align-items-center animate-fade-in">
            <i className="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
            <div>
              <h6 className="fw-bolder mb-1">Synchronization Error</h6>
              <span className="fw-medium">{error}</span>
            </div>
          </div>
        ) : (
          <div className="premium-card overflow-hidden animate-fade-in">
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center">
                <i className="bi bi-table text-primary me-2"></i> Assignment Roster
              </h5>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold shadow-sm">
                {filteredTeachers.length} Faculty Members
              </span>
            </div>
            
            <div className="table-responsive border-0">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">Teacher Profile</th>
                    <th>ID Number</th>
                    <th>Assigned Classes</th>
                    <th>Assigned Sections</th>
                    <th className="text-end pe-4">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                          <i className="bi bi-search text-muted opacity-50 fs-3"></i>
                        </div>
                        <h6 className="fw-bolder text-dark mb-1">No Records Found</h6>
                        <p className="text-muted small fw-medium mb-0">Adjust your search to see results.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t) => {
                      const classIds = Array.isArray(t.classes) ? t.classes.map((c) => String(c)) : [];
                      const assignedSections = Array.isArray(t.assignedSections) ? t.assignedSections : [];
                      
                      return (
                        <tr key={t._id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-3">
                              <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary fw-bolder shadow-sm border" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                                {t.teacherName?.charAt(0).toUpperCase() || "T"}
                              </div>
                              <div>
                                <div className="fw-bolder text-dark lh-sm mb-1">{t.teacherName || "Unknown Faculty"}</div>
                                <div className="small text-muted fw-medium d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-envelope-fill me-1 opacity-50"></i> {t.email || "No Email Provided"}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td>
                            <span className="fw-bold text-secondary font-monospace bg-light px-2 py-1 rounded border">
                              {t.regNumber || "---"}
                            </span>
                          </td>
                          
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              {classIds.length === 0 ? (
                                <span className="text-muted small fst-italic">Unassigned</span>
                              ) : (
                                classIds.map((id) => (
                                  <span key={id} className="pill-badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">
                                    Class {classNameMap[id] || "?"}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              {assignedSections.length === 0 ? (
                                <span className="text-muted small fst-italic">Unassigned</span>
                              ) : (
                                assignedSections.map((s, idx) => {
                                  const classId = String(s?.classId || "");
                                  const sec = String(s?.section || "").toUpperCase();
                                  const stream = String(s?.stream || "").trim();
                                  return (
                                    <span
                                      key={`${classId}-${sec}-${stream}-${idx}`}
                                      className="pill-badge bg-success bg-opacity-10 text-success border border-success border-opacity-10"
                                    >
                                      Class {classNameMap[classId] || "?"}-{sec || "?"}
                                      {stream ? ` (${stream})` : ""}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          
                          <td className="text-end pe-4">
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => navigate(`/teachers/editteacher/${t._id}`)}
                                title="Edit Assignments"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn-danger"
                                onClick={() => handleDelete(t)}
                                disabled={deletingId === String(t._id)}
                                title="Delete Teacher"
                              >
                                {deletingId === String(t._id) ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="bi bi-trash3-fill"></i>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherAssignmentList;