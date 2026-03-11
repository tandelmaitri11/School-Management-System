import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/teachers/teacher/profile/${teacherId}`);
      const profile = res.data || {};
      setClasses(profile.classesFull || []);
      setAssignedSections(profile.assignedSections || []);
    } catch (err) {
      console.error("Error fetching teacher classes:", err);
      setClasses([]);
      setAssignedSections([]);
    } finally {
      setLoading(false);
    }
  };

  const classSectionMap = useMemo(() => {
    const map = {};
    assignedSections.forEach((item) => {
      const key = String(item?.classId || "");
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push({
        section: String(item?.section || "").trim().toUpperCase(),
        stream: String(item?.stream || "").trim(),
      });
    });
    return map;
  }, [assignedSections]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3 py-md-5">
      <div className="text-center mb-4 mb-md-5 px-2">
        <h3 className="fw-bold text-primary fs-5 fs-md-3">
          <i className="bi bi-journal-text me-2"></i>My Classes
        </h3>
        <p className="text-muted mb-0 small">
          Assigned classes and managed sections
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="alert alert-warning text-center shadow-sm">
          <i className="bi bi-exclamation-circle me-2"></i>
          No classes assigned yet.
        </div>
      ) : (
        <div className="row g-3 g-md-4">
          {classes.map((cls) => {
            const managedSections = classSectionMap[String(cls._id)] || [];
            return (
              <div className="col-12 col-sm-6 col-lg-4" key={cls._id}>
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body p-3 p-md-4 d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="card-title mb-0 fw-bold text-dark fs-6 fs-md-5">
                        <i className="bi bi-easel2 me-2 text-primary"></i>
                        Class {cls.className}
                      </h5>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        Sections: {managedSections.length}
                      </span>
                    </div>

                    <hr className="mt-2 mb-3" />

                    <h6 className="fw-semibold text-secondary mb-2 mb-md-3 small">
                      <i className="bi bi-grid-3x3-gap me-2 text-primary"></i>Managed Sections
                    </h6>

                    {managedSections.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {managedSections.map((s, idx) => (
                          <span key={`${s.section}-${s.stream}-${idx}`} className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                            {s.section}
                            {s.stream ? ` (${s.stream})` : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted fst-italic small mt-2">
                        No sections assigned for this class.
                      </p>
                    )}

                    <div className="mt-auto pt-2 border-top text-end small">
                      <span className="fw-semibold text-primary">
                        <i className="bi bi-collection me-1"></i>
                        Streams: {(cls.streams || []).filter((s) => s?.isActive !== false).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
