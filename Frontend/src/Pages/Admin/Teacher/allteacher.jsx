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
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Custom CSS */}
      <style>{`
        .premium-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(79, 70, 229, 0.15); border-color: rgba(79, 70, 229, 0.3); }
        
        .input-premium { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 50rem; padding: 12px 20px 12px 48px; transition: all 0.2s; font-weight: 500; color: #0f172a; }
        .input-premium:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none; }
        
        .btn-brand { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: white; transition: all 0.2s; }
        .btn-brand:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3); color: white; }
        
        .avatar-box { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        
        .action-btn { background: #f8fafc; color: #64748b; border: 1px solid transparent; transition: all 0.2s; }
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
                <i className="bi bi-people-fill me-1"></i> Faculty Management
              </span>
              <h2 className="display-6 fw-bolder text-white mb-1" style={{ letterSpacing: '-1px' }}>Teacher Directory</h2>
              <p className="text-white opacity-75 fw-medium mb-0">View, manage, and update faculty profiles across the institution.</p>
            </div>
            
            <div className="d-flex flex-column flex-sm-row gap-3 align-items-center">
              <div className="position-relative" style={{ minWidth: "280px" }}>
                <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '20px' }}></i>
                <input
                  type="text"
                  className="form-control input-premium w-100"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                className="btn bg-white rounded-pill px-4 py-3 fw-bold shadow-sm d-flex align-items-center text-nowrap" 
                style={{ color: '#4f46e5' }} 
                onClick={() => navigate("/teacher/addteacher")}
              >
                <i className="bi bi-plus-circle-fill me-2 fs-5"></i> Enroll Teacher
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
            <div className="spinner-border" style={{ color: '#4f46e5', width: '3rem', height: '3rem' }} role="status"></div>
            <p className="mt-3 text-muted fw-medium">Synchronizing Faculty Data...</p>
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
          <div className="row g-4">
            
            {filteredTeachers.length === 0 ? (
              <div className="col-12 text-center py-5 mt-4">
                <div className="rounded-circle bg-white shadow-sm d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
                  <i className="bi bi-search text-muted opacity-50 fs-1"></i>
                </div>
                <h4 className="fw-bolder text-dark mb-2">No Faculty Found</h4>
                <p className="text-muted fw-medium">No records match your current search criteria.</p>
              </div>
            ) : (
              filteredTeachers.map((teacher, index) => (
                <div key={teacher._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                  <div 
                    className="premium-card h-100 d-flex flex-column position-relative overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/teachers/viewteacher/${teacher._id}`)}
                  >
                    {/* Top Accent Bar */}
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)' }}></div>
                    
                    <div className="p-4 flex-grow-1 d-flex flex-column align-items-center text-center mt-2">
                      
                      {/* Avatar */}
                      <div className="mb-3 position-relative">
                        {teacher.picture ? (
                          <img
                            src={`http://localhost:3000/${teacher.picture}`}
                            alt={teacher.teacherName}
                            className="avatar-box"
                          />
                        ) : (
                          <div className="avatar-box text-primary fs-3 fw-bolder">
                            {teacher.teacherName?.charAt(0).toUpperCase() || <i className="bi bi-person"></i>}
                          </div>
                        )}
                        <span className="position-absolute bottom-0 end-0 badge bg-success border border-2 border-white rounded-circle p-2" title="Active Account"></span>
                      </div>

                      {/* Header Info */}
                      <h5 className="fw-bolder text-dark mb-1 text-truncate w-100">{teacher.teacherName}</h5>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill px-3 py-1 mb-3 fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                        ID: {teacher.regNumber || "PENDING"}
                      </span>

                      {/* Detail Grid */}
                      <div className="w-100 bg-light rounded-4 p-3 text-start mt-auto mb-3 border">
                        <div className="d-flex align-items-center mb-2 overflow-hidden">
                          <div className="rounded bg-white shadow-sm d-flex align-items-center justify-content-center me-2 text-muted" style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            <i className="bi bi-envelope-fill"></i>
                          </div>
                          <span className="small fw-medium text-muted text-truncate" style={{ fontSize: '0.8rem' }}>{teacher.email || "No Email Provided"}</span>
                        </div>
                        
                        <div className="d-flex align-items-center mb-2 overflow-hidden">
                          <div className="rounded bg-white shadow-sm d-flex align-items-center justify-content-center me-2 text-muted" style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            <i className="bi bi-telephone-fill"></i>
                          </div>
                          <span className="small fw-medium text-muted text-truncate" style={{ fontSize: '0.8rem' }}>{teacher.mobile || "No Contact Provided"}</span>
                        </div>
                        
                        <div className="d-flex align-items-center overflow-hidden">
                          <div className="rounded bg-white shadow-sm d-flex align-items-center justify-content-center me-2 text-muted" style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            <i className="bi bi-wallet-fill"></i>
                          </div>
                          <span className="small fw-bolder text-dark text-truncate" style={{ fontSize: '0.8rem' }}>
                            ₹{teacher.salary?.toLocaleString() || "Not Disclosed"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex w-100 gap-2 border-top pt-3" style={{ borderColor: '#f1f5f9' }}>
                        <button 
                          className="btn action-btn btn-sm flex-grow-1 rounded-pill fw-bold"
                          onClick={(e) => { e.stopPropagation(); navigate(`/teachers/viewteacher/${teacher._id}`); }}
                        >
                          View
                        </button>
                        <button 
                          className="btn action-btn btn-sm flex-grow-1 rounded-pill fw-bold"
                          onClick={(e) => { e.stopPropagation(); navigate(`/teachers/editteacher/${teacher._id}`); }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn action-btn action-btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 32, height: 32 }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(teacher._id); }}
                          title="Delete Record"
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllTeachers;