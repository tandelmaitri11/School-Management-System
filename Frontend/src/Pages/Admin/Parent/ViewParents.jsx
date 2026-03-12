import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";

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
    return <div className="container py-5 text-center">Loading parent records...</div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Parent Directory</h2>
          <div className="text-muted">Parents register themselves. Admin links them to students here.</div>
        </div>
        <div style={{ minWidth: "280px" }}>
          <input
            className="form-control"
            placeholder="Search by name, parent ID, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Select Parent</h5>
              <select
                className="form-select"
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
              >
                {filteredParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.parentId})
                  </option>
                ))}
              </select>

              <hr />

              {selectedParent ? (
                <>
                  <div className="fw-bold fs-5">{selectedParent.name}</div>
                  <div className="text-muted small mb-2">{selectedParent.email}</div>
                  <div className="small">Parent ID: <strong>{selectedParent.parentId}</strong></div>
                  <div className="small">Phone: <strong>{selectedParent.phone || "-"}</strong></div>
                  <div className="small">Status: <strong>{selectedParent.status}</strong></div>
                  <div className="small">Linked Students: <strong>{selectedParent.students?.length || 0}</strong></div>
                </>
              ) : (
                <div className="text-muted">No parent selected.</div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Link Student</h5>
              <form onSubmit={handleMapSubmit}>
                <div className="mb-3">
                  <label className="form-label">Student</label>
                  <select
                    className="form-select"
                    value={mappingForm.studentId}
                    onChange={(e) => setMappingForm((prev) => ({ ...prev, studentId: e.target.value }))}
                    required
                  >
                    <option value="">Select student</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.studentId}) - Class {student.className}
                        {student.section ? `/${student.section}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Relation</label>
                    <select
                      className="form-select"
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
                  <div className="col-md-6">
                    <label className="form-label">Access</label>
                    <select
                      className="form-select"
                      value={mappingForm.accessLevel}
                      onChange={(e) => setMappingForm((prev) => ({ ...prev, accessLevel: e.target.value }))}
                    >
                      <option value="view_only">View Only</option>
                      <option value="full">Full</option>
                    </select>
                  </div>
                </div>

                <div className="form-check mt-3">
                  <input
                    id="isPrimary"
                    type="checkbox"
                    className="form-check-input"
                    checked={mappingForm.isPrimary}
                    onChange={(e) => setMappingForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="isPrimary">
                    Set as primary
                  </label>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Linking..." : "Link Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Registered Parents</h5>
              {!filteredParents.length ? (
                <div className="text-muted">No parents found.</div>
              ) : (
                <div className="accordion" id="parentAccordion">
                  {filteredParents.map((parent, index) => (
                    <div className="accordion-item" key={parent.id}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${index === 0 ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#parent-${parent.id}`}
                        >
                          <div className="d-flex flex-column">
                            <span className="fw-bold">{parent.name}</span>
                            <span className="small text-muted">{parent.parentId} | {parent.email}</span>
                          </div>
                        </button>
                      </h2>
                      <div
                        id={`parent-${parent.id}`}
                        className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
                        data-bs-parent="#parentAccordion"
                      >
                        <div className="accordion-body">
                          <div className="small mb-2">Phone: <strong>{parent.phone || "-"}</strong></div>
                          <div className="small mb-3">Status: <strong>{parent.status}</strong></div>
                          {!parent.students?.length ? (
                            <div className="text-muted small">No students linked.</div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm align-middle mb-0">
                                <thead>
                                  <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Relation</th>
                                    <th>Access</th>
                                    <th>Status</th>
                                    <th>Primary</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parent.students.map((student) => (
                                    <tr key={student.mappingId}>
                                      <td>
                                        <div className="fw-semibold">{student.name}</div>
                                        <div className="small text-muted">{student.studentId}</div>
                                      </td>
                                      <td>
                                        {student.className}
                                        {student.section ? ` / ${student.section}` : ""}
                                      </td>
                                      <td>{student.relation || "-"}</td>
                                      <td>{student.accessLevel || "view_only"}</td>
                                      <td>
                                        <button
                                          className={`btn btn-sm ${student.isActive ? "btn-outline-success" : "btn-outline-secondary"}`}
                                          onClick={() => updateMapping(student.mappingId, { isActive: !student.isActive })}
                                        >
                                          {student.isActive ? "Active" : "Inactive"}
                                        </button>
                                      </td>
                                      <td>
                                        <button
                                          className={`btn btn-sm ${student.isPrimary ? "btn-primary" : "btn-outline-primary"}`}
                                          onClick={() => updateMapping(student.mappingId, { isPrimary: !student.isPrimary })}
                                        >
                                          {student.isPrimary ? "Primary" : "Set Primary"}
                                        </button>
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
