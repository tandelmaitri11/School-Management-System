import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ViewParents() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [mappingForm, setMappingForm] = useState({
    studentId: "",
    relation: "Parent",
    accessLevel: "view_only",
    isPrimary: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [parentsRes, studentsRes] = await Promise.all([
        api.get("/api/parent/admin/all"),
        api.get("/api/students/admin/all"),
      ]);

      const parentRows = parentsRes.data?.parents || [];
      const studentRows = (studentsRes.data || []).flatMap((cls) =>
        (cls.students || []).map((student) => ({
          id: student.id,
          studentId: student.studentId || "",
          name: student.name || "",
          email: student.email || "",
          className: cls.className,
          section: student.section || "",
          stream: student.stream || "",
        }))
      );

      setParents(parentRows);
      setStudents(studentRows);
      setSelectedParentId((prev) => prev || parentRows[0]?.id || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load parent data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedParent = parents.find((parent) => parent.id === selectedParentId) || null;

  const filteredParents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parents.filter((parent) => {
      if (!q) return true;
      return (
        String(parent.name || "").toLowerCase().includes(q) ||
        String(parent.parentId || "").toLowerCase().includes(q) ||
        String(parent.email || "").toLowerCase().includes(q)
      );
    });
  }, [parents, search]);

  const availableStudents = useMemo(() => {
    return students.filter((student) => {
      if (selectedParent?.students?.some((mapped) => String(mapped.id) === String(student.id))) {
        return false;
      }
      return true;
    });
  }, [students, selectedParent]);

  const handleMapSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParentId || !mappingForm.studentId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.post("/api/parent/admin/map-student", {
        parentId: selectedParentId,
        ...mappingForm,
      });
      setMappingForm({
        studentId: "",
        relation: "Parent",
        accessLevel: "view_only",
        isPrimary: false,
      });
      setMessage("Parent linked to student successfully");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to link parent and student");
    } finally {
      setSaving(false);
    }
  };

  const updateMapping = async (mappingId, payload) => {
    try {
      setError("");
      await api.patch(`/api/parent/admin/mapping/${mappingId}`, payload);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update mapping");
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh", backgroundColor: "#f8fafc" }}>
        <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
        <span className="mt-3 fw-medium text-muted">Synchronizing Directory...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.2s; }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background: #ffffff; outline: none; }
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .accordion-premium { --bs-accordion-border-color: transparent; --bs-accordion-bg: transparent; }
        .accordion-premium .accordion-item { border: 1px solid #e2e8f0; border-radius: 16px !important; margin-bottom: 12px; background: #ffffff; overflow: hidden; transition: all 0.2s; }
        .accordion-premium .accordion-item:hover { border-color: rgba(79, 70, 229, 0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .accordion-premium .accordion-button { padding: 16px 20px; font-weight: 600; color: #0f172a; background: transparent; box-shadow: none !important; }
        .accordion-premium .accordion-button:not(.collapsed) { background: #f8fafc; color: #4f46e5; }
        .accordion-premium .accordion-button::after { background-size: 1rem; }
        
        .table-premium th { text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding: 12px; }
        .table-premium td { padding: 12px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
        
        .form-switch .form-check-input { width: 2.5em; height: 1.25em; cursor: pointer; }
        .form-switch .form-check-input:checked { background-color: #4f46e5; border-color: #4f46e5; }
        
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
                <i className="bi bi-people-fill me-1"></i> User Management
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Parent Directory</h2>
              <p className="text-white opacity-75 fw-medium mb-0">Link registered parent accounts to enrolled students.</p>
            </div>
            
            <div className="d-flex align-items-center" style={{ minWidth: "300px" }}>
              <div className="position-relative w-100 shadow-sm">
                <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '16px' }}></i>
                <input
                  className="form-control border-0 rounded-pill py-3"
                  style={{ paddingLeft: '44px', fontWeight: '500' }}
                  placeholder="Search by name, ID, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Banners */}
        {message && (
          <div className="alert bg-success bg-opacity-10 border border-success border-opacity-25 text-success fw-semibold mb-4 d-flex align-items-center rounded-4 animate-fade-in">
            <i className="bi bi-check-circle-fill me-3 fs-4"></i> {message}
          </div>
        )}
        
        {error && (
          <div className="alert bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger fw-semibold mb-4 d-flex align-items-center rounded-4 animate-fade-in">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i> {error}
          </div>
        )}

        <div className="row g-4">
          
          {/* Left Column: Selection & Linking */}
          <div className="col-12 col-lg-5">
            
            {/* Parent Selection Card */}
            <div className="premium-card p-4 mb-4">
              <h6 className="fw-bolder mb-3 text-uppercase text-muted d-flex align-items-center" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-person-badge-fill text-primary me-2 fs-6"></i> Target Parent
              </h6>
              
              <div className="mb-4">
                <select
                  className="form-select input-premium py-2 fw-bold"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">Select a parent account...</option>
                  {filteredParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.parentId})
                    </option>
                  ))}
                </select>
              </div>

              {selectedParent ? (
                <div className="bg-light rounded-4 p-4 border animate-fade-in">
                  <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold text-white shadow-sm" style={{ width: 48, height: 48, background: '#4f46e5', fontSize: '1.2rem' }}>
                      {selectedParent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="fw-bolder fs-5 text-dark text-truncate lh-1 mb-1">{selectedParent.name}</div>
                      <div className={`badge ${selectedParent.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-secondary bg-opacity-10 text-secondary border border-secondary'} border-opacity-25 rounded-pill`}>
                        {selectedParent.status}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small fw-semibold">Parent ID</span>
                      <span className="fw-bolder text-dark font-monospace">{selectedParent.parentId}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small fw-semibold">Email</span>
                      <span className="fw-medium text-dark text-truncate ms-2" style={{ maxWidth: '180px' }}>{selectedParent.email}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small fw-semibold">Phone</span>
                      <span className="fw-medium text-dark">{selectedParent.phone || "---"}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                      <span className="text-muted small fw-bold">Linked Students</span>
                      <span className="badge bg-primary rounded-pill px-2">{selectedParent.students?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-light rounded-4 border">
                  <i className="bi bi-person-bounding-box text-muted opacity-50 fs-2 mb-2 d-block"></i>
                  <span className="small fw-medium text-muted">No parent selected.</span>
                </div>
              )}
            </div>

            {/* Link Student Card */}
            <div className="premium-card p-4 p-md-5" style={{ opacity: selectedParent ? 1 : 0.6, pointerEvents: selectedParent ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
              <h5 className="fw-bolder mb-4 d-flex align-items-center" style={{ color: '#0f172a' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 36, height: 36, background: '#e0e7ff', color: '#4f46e5' }}>
                  <i className="bi bi-link-45deg"></i>
                </div>
                Map Student
              </h5>

              <form onSubmit={handleMapSubmit}>
                <div className="row g-4">
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Student to Link</label>
                    <select
                      className="form-select input-premium"
                      value={mappingForm.studentId}
                      onChange={(e) => setMappingForm((prev) => ({ ...prev, studentId: e.target.value }))}
                      required
                    >
                      <option value="">Select an available student...</option>
                      {availableStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.studentId}) — Class {student.className}{student.section ? `-${student.section}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Relationship</label>
                    <select
                      className="form-select input-premium"
                      value={mappingForm.relation}
                      onChange={(e) => setMappingForm((prev) => ({ ...prev, relation: e.target.value }))}
                    >
                      <option value="Parent">Parent</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>App Access Level</label>
                    <select
                      className="form-select input-premium"
                      value={mappingForm.accessLevel}
                      onChange={(e) => setMappingForm((prev) => ({ ...prev, accessLevel: e.target.value }))}
                    >
                      <option value="view_only">View Only</option>
                      <option value="full">Full Access</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 mt-4 bg-light rounded-3 border">
                   <label className="form-check-label fw-bold text-dark mb-0" htmlFor="isPrimary">Set as Primary Contact</label>
                   <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                     <input
                        id="isPrimary"
                        type="checkbox"
                        className="form-check-input m-0"
                        checked={mappingForm.isPrimary}
                        onChange={(e) => setMappingForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                   </div>
                </div>

                <button type="submit" className="btn btn-brand w-100 py-3 rounded-pill fw-bold shadow-sm mt-4" disabled={saving || !selectedParentId}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Linking...</> : "Confirm Mapping"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Accordion List */}
          <div className="col-12 col-lg-7">
            <div className="premium-card p-4 p-md-5 h-100 bg-light bg-opacity-50">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bolder mb-0 text-dark">Registry Overview</h5>
                <span className="badge bg-white text-dark border px-3 py-2 rounded-pill fw-semibold shadow-sm">
                  {filteredParents.length} Records
                </span>
              </div>

              {!filteredParents.length ? (
                <div className="text-center py-5 bg-white rounded-4 border">
                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <i className="bi bi-search text-muted opacity-50 fs-2"></i>
                  </div>
                  <h6 className="fw-bold text-dark">No parents found.</h6>
                  <p className="text-muted small px-3">Try adjusting your search filters.</p>
                </div>
              ) : (
                <div className="accordion accordion-premium" id="parentAccordion">
                  {filteredParents.map((parent, index) => (
                    <div className="accordion-item" key={parent.id}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${index === 0 ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#parent-${parent.id}`}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center fw-bolder border shadow-sm" style={{ width: 40, height: 40 }}>
                              {parent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="d-flex flex-column lh-sm">
                              <span className="fw-bolder text-dark mb-1">{parent.name}</span>
                              <span className="small text-muted fw-medium font-monospace">{parent.parentId}</span>
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div
                        id={`parent-${parent.id}`}
                        className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
                        data-bs-parent="#parentAccordion"
                      >
                        <div className="accordion-body pt-0 pb-4 px-4">
                          
                          {/* Quick Info Bar */}
                          <div className="d-flex flex-wrap gap-3 mb-4 p-3 bg-light rounded-3 border">
                            <div className="d-flex align-items-center small">
                              <i className="bi bi-telephone-fill text-muted me-2"></i> 
                              <span className="fw-semibold text-dark">{parent.phone || "N/A"}</span>
                            </div>
                            <div className="d-flex align-items-center small">
                              <i className="bi bi-envelope-fill text-muted me-2"></i> 
                              <span className="fw-semibold text-dark">{parent.email}</span>
                            </div>
                            <div className="d-flex align-items-center small">
                              <i className="bi bi-activity text-muted me-2"></i> 
                              <span className={`badge ${parent.status === 'Active' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 text-${parent.status === 'Active' ? 'success' : 'secondary'} border`}>{parent.status}</span>
                            </div>
                          </div>

                          <h6 className="fw-bold text-dark small text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>Mapped Students</h6>
                          {!parent.students?.length ? (
                            <div className="text-muted small fst-italic py-2 px-3 bg-light rounded-3 border border-dashed">
                              No students are currently linked to this account.
                            </div>
                          ) : (
                            <div className="table-responsive border rounded-3 bg-white">
                              <table className="table table-premium mb-0">
                                <thead className="bg-light">
                                  <tr>
                                    <th>Student Info</th>
                                    <th>Class</th>
                                    <th>Relation</th>
                                    <th className="text-center">Toggles</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parent.students.map((student) => (
                                    <tr key={student.mappingId}>
                                      <td>
                                        <div className="fw-bolder text-dark mb-1">{student.name}</div>
                                        <div className="small text-muted font-monospace">{student.studentId}</div>
                                      </td>
                                      <td>
                                        <span className="badge bg-light text-dark border px-2 py-1 fw-semibold">
                                          {student.className}{student.section ? `-${student.section}` : ""}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="fw-medium text-muted small">{student.relation || "-"}</span>
                                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>{student.accessLevel === 'full' ? 'Full Access' : 'View Only'}</div>
                                      </td>
                                      <td className="text-center">
                                        <div className="d-flex flex-column gap-2 align-items-center">
                                          <button
                                            className={`badge border-0 px-3 py-2 w-100 ${student.isActive ? "bg-success text-white" : "bg-light text-muted border border-secondary"}`}
                                            onClick={() => updateMapping(student.mappingId, { isActive: !student.isActive })}
                                            style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                                          >
                                            {student.isActive ? "Active" : "Inactive"}
                                          </button>
                                          <button
                                            className={`badge border-0 px-3 py-2 w-100 ${student.isPrimary ? "bg-primary text-white" : "bg-light text-primary border border-primary"}`}
                                            onClick={() => updateMapping(student.mappingId, { isPrimary: !student.isPrimary })}
                                            style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                                          >
                                            {student.isPrimary ? "Primary" : "Set Primary"}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}