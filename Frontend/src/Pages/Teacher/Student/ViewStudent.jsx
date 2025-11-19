import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

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
        alert("❌ Failed to load classes or students!");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) fetchStudentsByClass();
  }, [teacherId]);

  const handleToggle = (className) => {
    setExpandedClass(expandedClass === className ? null : className);
  };

  const handleViewDetails = async (student) => {
    try {
      const res = await api.get(`/api/students/details/${student.id}`);
      const { student: basic, info } = res.data;
      setSelectedStudent(basic);
      setFormData({ ...basic, ...info });
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching student details:", err);
      alert("❌ Failed to load student details!");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/api/students/details/${selectedStudent._id}`, formData);
      alert("✅ Student info updated successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Error updating student info:", error);
      alert("❌ Update failed! Check field values.");
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2 text-muted">Loading students...</span>
      </div>
    );

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="fw-bold text-primary">
          <i className="bi bi-people-fill me-2"></i>View & Manage Students
        </h3>
        <p className="text-muted">
          Expand a class to see and manage its students
        </p>
      </div>

      {/* Class Cards */}
      <div className="row g-4">
        {classGroups.length === 0 ? (
          <div className="alert alert-warning text-center shadow-sm">
            <i className="bi bi-exclamation-circle me-2"></i>No classes assigned yet.
          </div>
        ) : (
          classGroups.map((cls, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <motion.div
                className="card border-0 shadow-sm h-100 rounded-4"
                whileHover={{ scale: 1.02 }}
                style={{ cursor: "pointer" }}
                onClick={() => handleToggle(cls.className)}
              >
                <div className="card-body text-center">
                  <h5 className="fw-bold text-dark mb-1">Class {cls.className}</h5>
                  <p className="text-muted mb-1 small">
                    Teacher: {cls.teacher}
                  </p>
                  <p className="fw-semibold text-primary mb-0">
                    <i className="bi bi-people-fill me-1"></i>
                    Total Students: {cls.totalStudents}
                  </p>
                </div>

                {/* Student List */}
                <AnimatePresence>
                  {expandedClass === cls.className && (
                    <motion.div
                      key="student-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="border-top bg-light p-3 rounded-bottom"
                    >
                      {cls.students.length === 0 ? (
                        <p className="text-center text-muted mb-0">
                          No students in this class.
                        </p>
                      ) : (
                        <ul className="list-group list-group-flush">
                          {cls.students.map((student) => (
                            <li
                              key={student.id}
                              className="list-group-item d-flex justify-content-between align-items-center rounded-3 mb-2 border"
                              style={{ backgroundColor: "#f9fafc" }}
                            >
                              <span
                                className="fw-medium text-dark"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleViewDetails(student)}
                              >
                                <i className="bi bi-person-circle text-primary me-2"></i>
                                {student.name}
                              </span>
                              <small className="text-muted">{student.email}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          ))
        )}
      </div>

      {/* Student Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        scrollable
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-person-lines-fill me-2"></i>Student Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light">
          {formData && (
            <Form>
              <div className="row">
                {/* Basic Info */}
                <div className="col-md-6 mb-3">
                  <Form.Label>Student Name</Form.Label>
                  <Form.Control type="text" value={formData.name || ""} readOnly />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Registration No</Form.Label>
                  <Form.Control type="text" value={formData.studentId || ""} readOnly />
                </div>

                <div className="col-md-4 mb-3">
                  <Form.Label>Class</Form.Label>
                  <Form.Control type="text" value={formData.studentClass || ""} readOnly />
                </div>

                <div className="col-md-4 mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={formData.email || ""} readOnly />
                </div>

                <div className="col-md-4 mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dob"
                    value={formData.dob ? formData.dob.substring(0, 10) : ""}
                    onChange={handleChange}
                  />
                </div>

                {/* Updated Gender & BloodGroup */}
                <div className="col-md-4 mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Boy">Boy</option>
                    <option value="Girl">Girl</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </div>

                <div className="col-md-4 mb-3">
                  <Form.Label>Blood Group</Form.Label>
                  <Form.Select
                    name="bloodGroup"
                    value={formData.bloodGroup || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Form.Select>
                </div>

                <div className="col-md-4 mb-3">
                  <Form.Label>Caste</Form.Label>
                  <Form.Control
                    type="text"
                    name="cast"
                    value={formData.cast || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-12 mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                  />
                </div>

                {/* Father Info */}
                <h6 className="text-primary fw-bold mt-4">
                  <i className="bi bi-person-badge-fill me-2"></i>Father’s Details
                </h6>
                <div className="col-md-6 mb-3">
                  <Form.Label>Father Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Father Mobile</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherMobile"
                    value={formData.fatherMobile || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Occupation</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherOccupation"
                    value={formData.fatherOccupation || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Income</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherIncome"
                    value={formData.fatherIncome || ""}
                    onChange={handleChange}
                  />
                </div>

                {/* Mother Info */}
                <h6 className="text-primary fw-bold mt-4">
                  <i className="bi bi-person-badge me-2"></i>Mother’s Details
                </h6>
                <div className="col-md-6 mb-3">
                  <Form.Label>Mother Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherName"
                    value={formData.motherName || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Mother Mobile</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherMobile"
                    value={formData.motherMobile || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Occupation</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherOccupation"
                    value={formData.motherOccupation || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>Income</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherIncome"
                    value={formData.motherIncome || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-white">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            <i className="bi bi-save me-2"></i>Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
