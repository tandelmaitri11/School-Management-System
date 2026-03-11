import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ViewStudent() {
  const [classGroups, setClassGroups] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    const fetchStudentsByClass = async () => {
      try {
        const res = await api.get(`/api/students/by-teacher/${teacherId}`);
        const sortedClasses = res.data.sort((a, b) =>
          a.className.toString().localeCompare(b.className.toString(), "en", {
            numeric: true,
          })
        );
        setClassGroups(sortedClasses);
      } catch (err) {
        console.error("Error fetching class groups:", err);
        toast.error("Failed to load classes or students.");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchStudentsByClass();
    } else {
      setLoading(false);
      toast.warn("Teacher session missing. Please login again.");
    }
  }, [teacherId]);

  const handleToggle = (className) => {
    setExpandedClass(expandedClass === className ? null : className);
  };

  const handleViewDetails = async (student) => {
    try {
      const res = await api.get(`/api/students/details/${student.id}`);
      const { student: basic, info } = res.data;
      setSelectedStudent(basic);
      setFormData({
        name: basic?.name || "",
        email: basic?.email || "",
        studentId: basic?.studentId || "",
        studentClass: basic?.studentClass ?? student?.studentClass ?? "",
        section: basic?.section || student?.section || "",
        stream: basic?.stream || student?.stream || "",
        subjectChoice: basic?.subjectChoice || student?.subjectChoice || "",
        gender: info?.gender || "",
        dob: info?.dob ? new Date(info.dob).toISOString().slice(0, 10) : "",
        bloodGroup: info?.bloodGroup || "",
        cast: info?.cast || "",
        address: info?.address || "",
        fatherName: info?.fatherName || "",
        fatherMobile: info?.fatherMobile || "",
        fatherOccupation: info?.fatherOccupation || "",
        fatherIncome: info?.fatherIncome || "",
        motherName: info?.motherName || "",
        motherMobile: info?.motherMobile || "",
        motherOccupation: info?.motherOccupation || "",
        motherIncome: info?.motherIncome || "",
      });
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching student details:", err);
      toast.error("Failed to load student details.");
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      await api.put(`/api/students/details/${selectedStudent._id}`, formData);
      toast.success("Student info updated successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Error updating student info:", error);
      toast.error(error?.response?.data?.message || "Update failed. Check field values.");
    }
  };

  const DETAIL_FIELDS = [
    "name", "email", "studentId", "studentClass", "section", "stream",
    "subjectChoice", "gender", "dob", "bloodGroup", "cast", "address",
    "fatherName", "fatherMobile", "fatherOccupation", "fatherIncome",
    "motherName", "motherMobile", "motherOccupation", "motherIncome",
  ];

  const FIELD_LABELS = {
    studentId: "Student ID",
    studentClass: "Class",
    subjectChoice: "Subject Choice",
    fatherName: "Father's Name",
    fatherMobile: "Father's Mobile",
    motherName: "Mother's Name",
    dob: "Date of Birth",
    cast: "Caste / Category",
  };

  const READONLY_FIELDS = new Set([
    "name", "email", "studentId", "studentClass", "section", "stream", "subjectChoice",
  ]);

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-grow text-primary" role="status"></div>
        <span className="mt-3 fw-bold text-primary text-uppercase letter-spacing-1">Syncing Data...</span>
      </div>
    );

  return (
    <div className="min-vh-100 bg-light py-5 px-3">
      <div className="container">
        {/* Modern Hero Header */}
        <div className="row mb-5">
          <div className="col-12 text-center">
            <h1 className="display-5 fw-black text-dark mb-2">Classroom Overview</h1>
            <p className="lead text-muted mx-auto" style={{ maxWidth: "600px" }}>
              Efficiently manage your students, track details, and update academic profiles.
            </p>
          </div>
        </div>

        {/* Class Groups Grid */}
        <div className="row g-4">
          {classGroups.length === 0 ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm p-5 text-center rounded-4 bg-white">
                <i className="bi bi-person-x display-1 text-light mb-3"></i>
                <h4 className="text-muted">No Classes Assigned</h4>
                <p className="text-secondary">Please contact the administrator for classroom access.</p>
              </div>
            </div>
          ) : (
            classGroups.map((cls, index) => (
              <div key={index} className="col-12">
                <motion.div 
                  className={`card border-0 shadow-sm overflow-hidden rounded-4 transition-all ${expandedClass === cls.className ? 'ring-primary' : ''}`}
                >
                  {/* Class Header Strip */}
                  <div 
                    className={`p-4 d-flex justify-content-between align-items-center cursor-pointer bg-white`}
                    onClick={() => handleToggle(cls.className)}
                  >
                    <div className="d-flex align-items-center">
                      <div className="bg-primary text-white rounded-3 p-3 me-3 d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                        <span className="h4 mb-0 fw-bold">{cls.className}</span>
                      </div>
                      <div>
                        <h4 className="mb-0 fw-bold text-dark">Class {cls.className}</h4>
                        <span className="text-muted small">Academic Year 2024-25 • {cls.totalStudents} Students</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="text-end d-none d-md-block me-4">
                        <small className="text-muted d-block text-uppercase fw-bold ls-1">Supervisor</small>
                        <span className="fw-semibold text-dark">{cls.teacher}</span>
                      </div>
                      <i className={`bi bi-chevron-down fs-4 text-primary transition-transform ${expandedClass === cls.className ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>

                  {/* Expandable Student Section */}
                  <AnimatePresence>
                    {expandedClass === cls.className && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="bg-white border-top"
                      >
                        <div className="p-4 bg-light-subtle">
                          <div className="row g-3">
                            {cls.students.length === 0 ? (
                              <div className="col-12 text-center py-4 text-muted">No students currently enrolled.</div>
                            ) : (
                              cls.students.map((student) => (
                                <div key={student.id} className="col-12 col-lg-6">
                                  <div 
                                    className="p-3 bg-white rounded-3 border border-light shadow-sm d-flex justify-content-between align-items-center hover-shadow transition-all cursor-pointer"
                                    onClick={() => handleViewDetails(student)}
                                  >
                                    <div className="d-flex align-items-center overflow-hidden">
                                      <div className="avatar bg-primary-subtle text-primary rounded-circle me-3 flex-shrink-0">
                                        {student.name.charAt(0)}
                                      </div>
                                      <div className="overflow-hidden">
                                        <h6 className="mb-0 fw-bold text-dark text-truncate">{student.name}</h6>
                                        <small className="text-muted text-truncate d-block">{student.email}</small>
                                      </div>
                                    </div>
                                    <div className="ms-3 text-end flex-shrink-0">
                                      <span className="badge bg-light text-primary border border-primary-subtle rounded-pill">View Profile</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Styled Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" scrollable className="student-detail-modal">
        <Modal.Header closeButton className="border-0 pb-0 px-4 pt-4">
          <div>
            <Modal.Title className="fw-black h3 mb-1">Student Profile</Modal.Title>
            <p className="text-muted mb-0">Personal and Academic Information Record</p>
          </div>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Form>
            <div className="row g-4">
              {/* Profile Card Sidebar - Hidden on small, shown on MD */}
              <div className="col-12 col-md-4">
                <div className="bg-primary rounded-4 p-4 text-white h-100">
                  <div className="text-center mb-4">
                    <div className="bg-white text-primary rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px", fontSize: "2rem", fontWeight: "bold" }}>
                      {formData.name ? formData.name.charAt(0) : "?"}
                    </div>
                    <h4 className="fw-bold mb-0">{formData.name}</h4>
                    <small className="opacity-75">{formData.studentId}</small>
                  </div>
                  <hr className="opacity-25" />
                  <div className="small mb-2"><strong>Class:</strong> {formData.studentClass}</div>
                  <div className="small mb-2"><strong>Section:</strong> {formData.section || "N/A"}</div>
                  <div className="small mb-4"><strong>Stream:</strong> {formData.stream || "General"}</div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <small>Fields like ID and Class are locked and can only be modified by Admins.</small>
                  </div>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="col-12 col-md-8">
                <div className="row g-3">
                  {DETAIL_FIELDS.map((key) => {
                    const value = formData[key] || "";
                    if (key === "name" || key === "studentId" || key === "email") return null; // Already in sidebar

                    return (
                      <div key={key} className="col-12 col-sm-6">
                        <Form.Group className="form-floating mb-2">
                          {key === "gender" ? (
                            <Form.Select
                              name={key}
                              value={value}
                              onChange={handleChange}
                              disabled={READONLY_FIELDS.has(key)}
                              className="form-control"
                            >
                              <option value="">Select gender</option>
                              <option value="Boy">Boy</option>
                              <option value="Girl">Girl</option>
                              <option value="Other">Other</option>
                            </Form.Select>
                          ) : key === "bloodGroup" ? (
                            <Form.Select
                              name={key}
                              value={value}
                              onChange={handleChange}
                              disabled={READONLY_FIELDS.has(key)}
                              className="form-control"
                            >
                              <option value="">Select blood group</option>
                              <option value="A+">A+</option><option value="A-">A-</option>
                              <option value="B+">B+</option><option value="B-">B-</option>
                              <option value="AB+">AB+</option><option value="AB-">AB-</option>
                              <option value="O+">O+</option><option value="O-">O-</option>
                            </Form.Select>
                          ) : (
                            <Form.Control
                              name={key}
                              placeholder={key}
                              value={value}
                              onChange={handleChange}
                              type={key === "dob" ? "date" : "text"}
                              readOnly={READONLY_FIELDS.has(key)}
                              className={READONLY_FIELDS.has(key) ? "bg-light text-muted border-0" : ""}
                            />
                          )}
                          <label className="fw-bold text-muted small text-uppercase letter-spacing-1">
                            {FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1")}
                          </label>
                        </Form.Group>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="link" className="text-decoration-none text-muted" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" className="px-5 py-2 rounded-pill fw-bold shadow-sm" onClick={handleUpdate}>
            Update Record
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        .fw-black { font-weight: 900; }
        .ls-1 { letter-spacing: 1px; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.3s ease; }
        .rotate-180 { transform: rotate(180deg); }
        .transition-transform { transition: transform 0.3s ease; }
        
        .avatar {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .hover-shadow:hover {
          background-color: #f8f9ff !important;
          border-color: #d1d9ff !important;
          transform: translateY(-2px);
        }

        .ring-primary {
          box-shadow: 0 0 0 2px #0d6efd !important;
        }

        .form-floating > label {
          font-size: 0.75rem;
          opacity: 0.8;
          transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
        }

        .student-detail-modal .modal-content {
          border-radius: 24px;
          border: none;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

