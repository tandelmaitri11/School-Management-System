import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal } from "react-bootstrap";

export default function AllStudents() {
  const [data, setData] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchClass, setSearchClass] = useState("");

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const res = await api.get("/api/students/admin/all");
        setData(res.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStudents();
  }, []);

  const toggleClass = (className) => {
    setExpandedClass(expandedClass === className ? null : className);
  };

  const flatStudents = useMemo(() => {
    return data.flatMap((cls) =>
      (cls.students || []).map((student) => ({
        ...student,
        className: cls.className,
      }))
    );
  }, [data]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return flatStudents.filter((s) => {
      const classOk = !searchClass || String(s.className) === String(searchClass);
      const textOk =
        !q ||
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.email || "").toLowerCase().includes(q) ||
        String(s.studentId || "").toLowerCase().includes(q);
      return classOk && textOk;
    });
  }, [flatStudents, searchTerm, searchClass]);

  const isSearching = searchTerm.trim().length > 0 || searchClass !== "";

  const handleStudentClick = async (studentId) => {
    try {
      setShowModal(true);
      setStudentDetails(null); 
      const res = await api.get(`/api/students/details/${studentId}`);
      setStudentDetails(res.data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div>
        <span className="mt-3 fw-medium text-secondary">Synchronizing Student Data...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5 px-lg-5" style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Enhanced Header */}
      <div className="row mb-5 align-items-center">
        <div className="col-md-6">
          <h2 className="fw-extra-bold text-dark tracking-tight mb-1">Student Registry</h2>
          <p className="text-muted mb-0">Overview of institutional enrollment and profiles.</p>
        </div>
        <div className="col-md-6 text-md-end mt-3 mt-md-0">
          <span className="badge bg-white text-dark border shadow-sm p-2 px-3 rounded-pill">
            <i className="bi bi-mortarboard-fill text-primary me-2"></i>
            {flatStudents.length} Total Students
          </span>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="card border-0 shadow-sm mb-5 overflow-hidden" style={{ borderRadius: "20px" }}>
        <div className="card-body p-3 p-lg-4 bg-white">
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="input-group input-group-lg border rounded-3 overflow-hidden transition-all">
                <span className="input-group-text bg-white border-0 ps-3">
                  <i className="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 shadow-none ps-2"
                  placeholder="Find by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '1rem' }}
                />
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <select
                className="form-select form-select-lg border rounded-3 shadow-none"
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
                style={{ fontSize: '1rem' }}
              >
                <option value="">All Classes</option>
                {data.map((cls) => (
                  <option key={cls.className} value={cls.className}>
                    Class {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <button
                type="button"
                className="btn btn-lg btn-light w-100 border text-muted hover-dark"
                onClick={() => {
                  setSearchTerm("");
                  setSearchClass("");
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {data.length === 0 ? (
        <div className="text-center py-5 shadow-sm bg-white rounded-4 border-dashed border-2">
          <i className="bi bi-cloud-slash text-light display-1"></i>
          <h5 className="mt-3 text-secondary fw-bold">No Data Available</h5>
          <p className="text-muted">There are currently no students registered in the system.</p>
        </div>
      ) : isSearching ? (
        <div className="animate__animated animate__fadeIn">
          <div className="d-flex align-items-center mb-4 ps-2">
            <div className="vr me-3 bg-primary" style={{ width: '4px', opacity: 1, borderRadius: '2px' }}></div>
            <h5 className="fw-bold mb-0">Search Results ({filteredStudents.length})</h5>
          </div>
          <div className="row g-4">
            {filteredStudents.length === 0 ? (
              <div className="col-12 text-center py-5">
                <p className="text-muted">No matches found for "{searchTerm}"</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <StudentCard key={student.id} student={student} onClick={handleStudentClick} showClass={true} />
              ))
            )}
          </div>
        </div>
      ) : (
        data.map((cls, index) => (
          <div className="mb-4" key={index}>
            <div
              className={`p-4 d-flex justify-content-between align-items-center transition-all ${expandedClass === cls.className ? 'class-header-active shadow-lg' : 'class-header bg-white shadow-sm'}`}
              style={{ borderRadius: "18px", cursor: "pointer", border: expandedClass === cls.className ? '1px solid #6366f1' : '1px solid transparent' }}
              onClick={() => toggleClass(cls.className)}
            >
              <div className="d-flex align-items-center">
                <div className={`class-badge ${expandedClass === cls.className ? 'bg-white text-primary' : 'bg-primary-soft text-primary'} me-4 shadow-sm fw-bold`}>
                  {cls.className}
                </div>
                <div>
                  <h5 className={`fw-bold mb-0 ${expandedClass === cls.className ? 'text-white' : 'text-dark'}`}>Class {cls.className}</h5>
                  <div className={`d-flex align-items-center small ${expandedClass === cls.className ? 'text-white-50' : 'text-muted'}`}>
                    <i className="bi bi-person-workspace me-2"></i>
                    {cls.teacher}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-4">
                <span className={`fw-bold d-none d-md-inline ${expandedClass === cls.className ? 'text-white' : 'text-primary'}`}>
                  {cls.totalStudents} <span className="opacity-75 fw-normal">Students</span>
                </span>
                <div className={`chevron-circle ${expandedClass === cls.className ? 'bg-white text-primary rotate-180' : 'bg-light text-muted'}`}>
                  <i className="bi bi-chevron-down"></i>
                </div>
              </div>
            </div>

            {expandedClass === cls.className && (
              <div className="pt-4 px-2 animate__animated animate__slideInDown">
                <div className="row g-4">
                  {cls.students.map((student) => (
                    <StudentCard key={student.id} student={student} onClick={handleStudentClick} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Enhanced Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="modern-modal">
        <Modal.Body className="p-0 overflow-hidden rounded-4">
          {!studentDetails ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <div className="row g-0">
              <div className="col-lg-4 bg-primary p-5 text-center text-white">
                <div className="avatar-xl shadow-lg mx-auto mb-4 border border-4 border-white border-opacity-25 rounded-circle d-flex align-items-center justify-content-center bg-white text-primary fw-bold" style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}>
                  {studentDetails.student.name.charAt(0)}
                </div>
                <h4 className="fw-bold mb-1">{studentDetails.student.name}</h4>
                <p className="opacity-75 small mb-4">ID: {studentDetails.student.studentId}</p>
                
                <div className="text-start mt-auto">
                    <div className="p-3 bg-white bg-opacity-10 rounded-3 mb-2">
                        <small className="d-block opacity-50 text-uppercase fw-bold ls-1">Current Placement</small>
                        <div className="fw-bold">Class {studentDetails.student.studentClass} • {studentDetails.student.section || "A"}</div>
                    </div>
                </div>
              </div>
              <div className="col-lg-8 p-4 p-lg-5 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold text-dark mb-0">Academic Profile</h5>
                    <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                </div>
                
                <div className="row g-4 mb-5">
                    <InfoBox label="Email Address" value={studentDetails.student.email} icon="bi-envelope" />
                    <InfoBox label="Stream" value={studentDetails.student.stream} icon="bi-layers" />
                    <InfoBox label="Gender" value={studentDetails.info?.gender} icon="bi-person-venus-mars" />
                    <InfoBox label="Blood Group" value={studentDetails.info?.bloodGroup} icon="bi-droplet" color="text-danger" />
                </div>

                <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">Guardian Contact</h6>
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3 border-start border-primary border-4">
                            <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.65rem'}}>Father</small>
                            <div className="fw-bold">{studentDetails.info?.fatherName || "N/A"}</div>
                            <div className="small text-primary">{studentDetails.info?.fatherMobile}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3 border-start border-info border-4">
                            <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.65rem'}}>Mother</small>
                            <div className="fw-bold">{studentDetails.info?.motherName || "N/A"}</div>
                            <div className="small text-info">{studentDetails.info?.motherMobile}</div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .fw-extra-bold { font-weight: 800; }
        .ls-1 { letter-spacing: 1px; }
        
        .class-header { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .class-header:hover { transform: scale(1.01); background-color: #fdfdfd !important; }
        .class-header-active { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; }
        
        .class-badge { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .bg-primary-soft { background-color: rgba(99, 102, 241, 0.1); }
        
        .chevron-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .rotate-180 { transform: rotate(180deg); }
        
        .student-card-modern { 
            border: 1px solid #eef2f6;
            transition: all 0.3s ease;
            border-radius: 16px;
        }
        .student-card-modern:hover { 
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
            border-color: #6366f1;
        }

        .avatar-sm { width: 42px; height: 42px; border-radius: 10px; font-weight: 700; }
        
        .modern-modal .modal-content { border: none; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
      `}</style>
    </div>
  );
}

function StudentCard({ student, onClick, showClass = false }) {
    return (
        <div className="col-12 col-md-6 col-lg-4 col-xl-3">
            <div className="student-card-modern p-3 bg-white shadow-sm h-100 position-relative" onClick={() => onClick(student.id)} style={{ cursor: "pointer" }}>
                <div className="d-flex align-items-center mb-2">
                    <div className="avatar-sm bg-primary-soft text-primary d-flex align-items-center justify-content-center me-3">
                        {student.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <h6 className="mb-0 text-truncate fw-bold text-dark" style={{ fontSize: "0.95rem" }}>{student.name}</h6>
                        <small className="text-primary fw-bold" style={{ fontSize: "0.75rem" }}>ID: {student.studentId || "---"}</small>
                    </div>
                </div>
                <div className="pt-2 mt-2 border-top">
                    <div className="d-flex align-items-center text-muted mb-1" style={{ fontSize: "0.75rem" }}>
                        <i className="bi bi-envelope-at me-2"></i>
                        <span className="text-truncate">{student.email}</span>
                    </div>
                    {showClass && (
                        <div className="badge bg-light text-dark fw-normal border" style={{ fontSize: "0.7rem" }}>
                            Class {student.className}
                        </div>
                    )}
                    <div className="mt-2 d-flex flex-wrap gap-1">
                        {student.stream && <span className="badge bg-secondary-subtle text-secondary rounded-pill" style={{fontSize: '0.65rem'}}>{student.stream}</span>}
                        {student.section && <span className="badge bg-info-subtle text-info rounded-pill" style={{fontSize: '0.65rem'}}>Sec {student.section}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value, icon, color = "text-dark" }) {
    return (
        <div className="col-6">
            <div className="d-flex align-items-center mb-1 text-muted">
                <i className={`bi ${icon} me-2`} style={{fontSize: '0.8rem'}}></i>
                <small className="text-uppercase fw-bold ls-1" style={{fontSize: '0.65rem'}}>{label}</small>
            </div>
            <div className={`fw-semibold ${color}`}>{value || "Not Set"}</div>
        </div>
    );
}