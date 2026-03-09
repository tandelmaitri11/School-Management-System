import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Button, Form } from "react-bootstrap";
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
        <div className="spinner-border text-primary"></div>
        <span className="ms-2 text-muted">Loading students...</span>
      </div>
    );

  return (
    <div className="container-fluid px-2 px-md-4 py-4">
      {/* Header */}
      <div className="text-center mb-4 mb-md-5">
        <h3 className="fw-bold text-primary fs-5 fs-md-3">
          <i className="bi bi-people-fill me-2"></i>View & Manage Students
        </h3>
        <p className="text-muted small">
          Expand a class to see and manage its students
        </p>
      </div>

      {/* Class Cards */}
      <div className="row g-3 g-md-4">
        {classGroups.length === 0 ? (
          <div className="alert alert-warning text-center shadow-sm">
            <i className="bi bi-exclamation-circle me-2"></i>No classes assigned yet.
          </div>
        ) : (
          classGroups.map((cls, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <motion.div
                className="card border-0 shadow-sm h-100 rounded-4"
                whileHover={{ scale: 1.02 }}
                style={{ cursor: "pointer" }}
                onClick={() => handleToggle(cls.className)}
              >
                <div className="card-body text-center p-3 p-md-4">
                  <h5 className="fw-bold text-dark mb-1">
                    Class {cls.className}
                  </h5>
                  <p className="text-muted small mb-1">
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
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
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
                              className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center rounded-3 mb-2 border"
                              style={{ backgroundColor: "#f9fafc" }}
                            >
                              <span
                                className="fw-medium text-dark mb-1 mb-sm-0"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleViewDetails(student)}
                              >
                                <i className="bi bi-person-circle text-primary me-2"></i>
                                {student.name}
                              </span>
                              <small className="text-muted text-break">
                                {student.email}
                              </small>
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
          <Form>
            <div className="row g-3">
              {Object.entries(formData).map(
                ([key, value]) =>
                  typeof value === "string" && (
                    <div key={key} className="col-12 col-md-6">
                      <Form.Label className="fw-semibold text-capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </Form.Label>
                      <Form.Control
                        name={key}
                        value={value}
                        onChange={handleChange}
                      />
                    </div>
                  )
              )}
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="bg-white d-flex flex-column flex-sm-row gap-2">
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
