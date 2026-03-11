import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";

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
    if (!window.confirm(`Delete ${teacher?.teacherName || "this teacher"}?`)) return;

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
    <div className="container py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Teacher Class/Section Assignment</h3>
          <p className="text-muted mb-0">List of teachers and their assigned classes and sections.</p>
        </div>
        <div className="input-group" style={{ maxWidth: 360 }}>
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher name / id / email"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Teacher</th>
                  <th>Teacher ID</th>
                  <th>Assigned Classes</th>
                  <th>Assigned Sections</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => {
                    const classIds = Array.isArray(t.classes) ? t.classes.map((c) => String(c)) : [];
                    const assignedSections = Array.isArray(t.assignedSections) ? t.assignedSections : [];
                    return (
                      <tr key={t._id}>
                        <td>
                          <div className="fw-semibold">{t.teacherName || "N/A"}</div>
                          <div className="small text-muted">{t.email || "-"}</div>
                        </td>
                        <td>{t.regNumber || "-"}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {classIds.length === 0 ? (
                              <span className="text-muted small">No class assigned</span>
                            ) : (
                              classIds.map((id) => (
                                <span key={id} className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                                  Class {classNameMap[id] || "?"}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {assignedSections.length === 0 ? (
                              <span className="text-muted small">No section assigned</span>
                            ) : (
                              assignedSections.map((s, idx) => {
                                const classId = String(s?.classId || "");
                                const sec = String(s?.section || "").toUpperCase();
                                const stream = String(s?.stream || "").trim();
                                return (
                                  <span
                                    key={`${classId}-${sec}-${stream}-${idx}`}
                                    className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2"
                                  >
                                    Class {classNameMap[classId] || "?"} - {sec || "?"}
                                    {stream ? ` (${stream})` : ""}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/teachers/editteacher/${t._id}`)}
                            >
                              <i className="bi bi-pencil-square me-1"></i>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(t)}
                              disabled={deletingId === String(t._id)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              {deletingId === String(t._id) ? "Deleting..." : "Delete"}
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
  );
}

export default TeacherAssignmentList;
