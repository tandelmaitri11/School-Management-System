import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    if (teacherId) fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/classes/by-subject/${teacherId}`);
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Title */}
      <div className="text-center mb-4 mb-md-5 px-2">
        <h3 className="fw-bold text-primary fs-5 fs-md-3">
          <i className="bi bi-journal-text me-2"></i>My Classes
        </h3>
        <p className="text-muted mb-0 small">
          Overview of all classes and their assigned subjects
        </p>
      </div>

      {/* No Classes */}
      {classes.length === 0 ? (
        <div className="alert alert-warning text-center shadow-sm">
          <i className="bi bi-exclamation-circle me-2"></i>
          No classes assigned yet.
        </div>
      ) : (
        <div className="row g-3 g-md-4">
          {classes.map((cls) => (
            <div
              className="col-12 col-sm-6 col-lg-4"
              key={cls._id}
            >
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body p-3 p-md-4 d-flex flex-column">
                  {/* Class Header */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="card-title mb-0 fw-bold text-dark fs-6 fs-md-5">
                      <i className="bi bi-easel2 me-2 text-primary"></i>
                      Class {cls.className}
                    </h5>
                  </div>

                  <hr className="mt-2 mb-3" />

                  {/* Subject List */}
                  <h6 className="fw-semibold text-secondary mb-2 mb-md-3 small">
                    <i className="bi bi-book me-2 text-primary"></i>Subjects
                  </h6>

                  {cls.subjects && cls.subjects.length > 0 ? (
                    <ul className="list-group list-group-flush border rounded-3 mb-3">
                      {cls.subjects.map((sub, index) => (
                        <li
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                        >
                          <span className="fw-medium text-dark small">
                            {sub.subjectName}
                          </span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
                            {sub.marks} marks
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted fst-italic small mt-2">
                      No subjects found for this class.
                    </p>
                  )}

                  {/* Total Subjects */}
                  <div className="mt-auto pt-2 border-top text-end small">
                    <span className="fw-semibold text-primary">
                      <i className="bi bi-collection me-1"></i>
                      Total Subjects:{" "}
                      {cls.subjects ? cls.subjects.length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
