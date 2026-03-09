import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button } from "react-bootstrap";

export default function AllStudents() {
  const [data, setData] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleStudentClick = async (studentId) => {
    try {
      setShowModal(true);
      setStudentDetails(null); // Reset for loader
      const res = await api.get(`/api/students/details/${studentId}`);
      setStudentDetails(res.data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-grow text-primary" role="status"></div>
        <span className="mt-3 fw-bold text-muted">Loading Directory...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-lg-5" style={{ backgroundColor: "#f4f7fe", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div className="mb-5 text-center text-md-start">
        <h3 className="fw-bold text-dark mb-1">Student Directory</h3>
        <p className="text-muted">Manage and view detailed profiles by class enrollment.</p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-5 shadow-sm bg-white rounded-4">
          <i className="bi bi-people text-light display-1"></i>
          <h5 className="mt-3 text-muted">No students registered yet.</h5>
        </div>
      ) : (
        data.map((cls, index) => (
          <div className="card border-0 shadow-sm mb-4" key={index} style={{ borderRadius: "20px", overflow: "hidden" }}>
            {/* Class Header Section */}
            <div
              className="p-4 d-flex flex-wrap justify-content-between align-items-center"
              style={{ 
                cursor: "pointer", 
                background: expandedClass === cls.className 
                  ? "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)" 
                  : "#ffffff",
                transition: "all 0.3s ease"
              }}
              onClick={() => toggleClass(cls.className)}
            >
              <div className="d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm ${expandedClass === cls.className ? 'bg-white text-primary' : 'bg-primary text-white'}`} style={{ width: "50px", height: "50px" }}>
                  <span className="fw-bold fs-5">{cls.className}</span>
                </div>
                <div>
                  <h5 className={`fw-bold mb-0 ${expandedClass === cls.className ? 'text-white' : 'text-dark'}`}>Class {cls.className}</h5>
                  <span className={`small ${expandedClass === cls.className ? 'text-white opacity-75' : 'text-muted'}`}>
                    <i className="bi bi-person-badge me-1"></i> {cls.teacher}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className={`badge rounded-pill px-3 py-2 ${expandedClass === cls.className ? 'bg-white text-primary' : 'bg-light text-primary border'}`}>
                  {cls.totalStudents} Students
                </span>
                <i className={`bi bi-chevron-down fw-bold transition-all ${expandedClass === cls.className ? 'rotate-180 text-white' : ''}`}></i>
              </div>
            </div>

            {/* Students Grid */}
            {expandedClass === cls.className && (
              <div className="card-body bg-light bg-opacity-50 p-4 animate__animated animate__fadeIn">
                <div className="row g-3">
                  {cls.students.map((student) => (
                    <div key={student.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                      <div
                        className="student-card p-3 bg-white shadow-sm h-100 position-relative"
                        onClick={() => handleStudentClick(student.id)}
                        style={{ borderRadius: "16px", cursor: "pointer", transition: "transform 0.2s" }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="avatar me-3 bg-soft-primary text-primary fw-bold d-flex align-items-center justify-content-center rounded-circle" style={{ width: "45px", height: "45px", backgroundColor: "#eef2ff" }}>
                            {student.name.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <h6 className="mb-0 text-truncate fw-bold" style={{ fontSize: "0.9rem" }}>{student.name}</h6>
                            <small className="text-muted text-truncate d-block" style={{ fontSize: "0.75rem" }}>{student.email}</small>
                            <span className="text-primary fw-bold" style={{ fontSize: "0.7rem" }}>ID: {student.studentId || "---"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Student Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="student-detail-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Student Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          {!studentDetails ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <div className="row mt-2">
              {/* Profile Sidebar */}
              <div className="col-lg-4 text-center border-end-lg">
                <div className="bg-primary text-white mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}>
                  {studentDetails.student.name.charAt(0)}
                </div>
                <h5 className="fw-bold mb-1">{studentDetails.student.name}</h5>
                <p className="text-muted small mb-3">Roll No: {studentDetails.student.studentId}</p>
                <div className="d-grid gap-2">
                   <div className="p-2 bg-light rounded-3 small">
                      <div className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.65rem" }}>Class</div>
                      <div className="text-dark fw-bold">Class {studentDetails.student.studentClass}</div>
                   </div>
                </div>
              </div>

              {/* Info Details */}
              <div className="col-lg-8 ps-lg-4 mt-4 mt-lg-0">
                <div className="mb-4">
                  <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">Personal Information</h6>
                  <div className="row g-3">
                    <div className="col-6 col-md-4">
                      <small className="text-muted d-block">Gender</small>
                      <span className="fw-semibold">{studentDetails.info?.gender || "N/A"}</span>
                    </div>
                    <div className="col-6 col-md-4">
                      <small className="text-muted d-block">Blood Group</small>
                      <span className="fw-semibold text-danger">{studentDetails.info?.bloodGroup || "N/A"}</span>
                    </div>
                    <div className="col-12 col-md-4">
                      <small className="text-muted d-block">DOB</small>
                      <span className="fw-semibold">{studentDetails.info?.dob ? new Date(studentDetails.info.dob).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">Address</small>
                      <span className="fw-semibold small">{studentDetails.info?.address || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">Parent Details</h6>
                  <div className="row g-3">
                    <div className="col-md-6 bg-light p-3 rounded-3 border-start border-primary border-4">
                      <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.7rem'}}>Father</small>
                      <div className="fw-bold">{studentDetails.info?.fatherName || "N/A"}</div>
                      <div className="small text-muted">{studentDetails.info?.fatherMobile || "No Mobile"}</div>
                    </div>
                    <div className="col-md-6 bg-light p-3 rounded-3 border-start border-info border-4">
                      <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.7rem'}}>Mother</small>
                      <div className="fw-bold">{studentDetails.info?.motherName || "N/A"}</div>
                      <div className="small text-muted">{studentDetails.info?.motherMobile || "No Mobile"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .rotate-180 { transform: rotate(180deg); }
        .transition-all { transition: all 0.3s ease; }
        .student-card:hover { 
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          border-left: 4px solid #4f46e5;
        }
        .border-end-lg { border-right: 1px solid #eee; }
        @media (max-width: 991px) { .border-end-lg { border-right: none; } }
      `}</style>
    </div>
  );
}