import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AllTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/teachers/getTeachers");
      setTeachers(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await api.delete(`/api/teachers/deleteTeacher/${id}`);
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      alert("Failed to delete teacher.");
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-5">
      {/* Header Section */}
      <div className="row align-items-center mb-5">
        <div className="col-md-6">
          <h2 className="fw-bold text-dark mb-1">Teacher Directory</h2>
          <p className="text-muted">Manage your faculty and their profiles</p>
        </div>
        <div className="col-md-6">
          <div className="input-group shadow-sm rounded-pill overflow-hidden border-0">
            <span className="input-group-text bg-white border-0 ps-3">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 py-2 shadow-none"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-grow text-primary" role="status"></div>
          <p className="mt-3 text-muted fw-medium">Assembling your team...</p>
        </div>
      ) : error ? (
        <div className="alert alert-custom bg-danger-subtle text-danger border-0 rounded-4 p-4 text-center">
          <i className="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
          {error}
        </div>
      ) : (
        <div className="row g-4">
          {/* Add Teacher Card (First Position) */}
          <div className="col-12 col-md-6 col-lg-4 col-xl-3">
            <div
              className="card h-100 border-0 shadow-sm d-flex flex-column align-items-center justify-content-center text-center p-4"
              style={{
                cursor: "pointer",
                border: "2px dashed #dee2e6",
                backgroundColor: "#f8f9fa",
                minHeight: "320px",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "#0d6efd")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "#dee2e6")}
              onClick={() => navigate("/teacher/addteacher")}
            >
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                <i className="bi bi-plus-lg text-primary fs-3"></i>
              </div>
              <h6 className="fw-bold mb-1">Add New Faculty</h6>
              <p className="small text-muted">Register a new teacher profile</p>
            </div>
          </div>

          {filteredTeachers.map((teacher) => (
            <div key={teacher._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
              <div className="card h-100 border-0 shadow-sm rounded-4 hover-lift position-relative overflow-hidden">
                {/* Visual Accent */}
                <div className="position-absolute top-0 start-0 w-100" style={{height: '4px', backgroundColor: '#0d6efd'}}></div>
                
                <div className="card-body p-4">
                  {/* Top: Avatar & Title */}
                  <div className="text-center mb-3">
                    {teacher.picture ? (
                      <img
                        src={`http://localhost:3000/${teacher.picture}`}
                        alt={teacher.teacherName}
                        className="rounded-circle shadow-sm mb-3 border border-3 border-white"
                        style={{ width: "90px", height: "90px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{width: '90px', height: '90px'}}>
                         <i className="bi bi-person text-secondary fs-1"></i>
                      </div>
                    )}
                    <h5 className="card-title fw-bold mb-0 text-truncate">{teacher.teacherName}</h5>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 mt-2" style={{fontSize: '0.7rem'}}>
                      ID: {teacher.regNumber || "PENDING"}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-envelope text-muted me-3"></i>
                      <span className="small text-muted text-truncate">{teacher.email || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-telephone text-muted me-3"></i>
                      <span className="small text-muted">{teacher.mobile || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-cash-stack text-muted me-3"></i>
                      <span className="small fw-bold text-dark">₹{teacher.salary?.toLocaleString() || 0}</span>
                    </div>
                  </div>

                  {/* Floating Action Menu */}
                  <div className="d-flex justify-content-between gap-2 mt-4 pt-2">
                    <button 
                      className="btn btn-light btn-sm flex-grow-1 rounded-3"
                      onClick={() => navigate(`/teachers/viewteacher/${teacher._id}`)}
                    >
                      <i className="bi bi-eye"></i> View
                    </button>
                    <button 
                      className="btn btn-light btn-sm flex-grow-1 rounded-3"
                      onClick={() => navigate(`/teachers/editteacher/${teacher._id}`)}
                    >
                      <i className="bi bi-pencil-square"></i> Edit
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm rounded-3"
                      onClick={() => handleDelete(teacher._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Hover CSS */}
      <style>{`
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important;
        }
        .btn-light:hover {
          background-color: #e9ecef;
        }
      `}</style>
    </div>
  );
}

export default AllTeachers;