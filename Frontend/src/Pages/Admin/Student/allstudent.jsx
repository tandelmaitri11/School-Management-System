import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
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
      const res = await api.get(`/api/students/details/${studentId}`);
      setStudentDetails(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading students...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center mt-5">
        <h6>No students found!</h6>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h4 className="text-center mb-4 text-primary fw-bold">
        All Students by Class
      </h4>

      {data.map((cls, index) => (
        <div
          className="card mb-3 border-0 shadow-sm rounded-3"
          key={index}
          style={{ background: "#f8f9fa" }}
        >
          <div
            className="card-header bg-white border-0 py-2 d-flex justify-content-between align-items-center"
            style={{
              cursor: "pointer",
              borderBottom: "1px solid #dee2e6",
            }}
            onClick={() => toggleClass(cls.className)}
          >
            <div>
              <strong className="text-primary">Class {cls.className}</strong>
              <div className="small text-muted">Teacher: {cls.teacher}</div>
            </div>
            <span className="badge bg-primary">
              {cls.totalStudents} Students
            </span>
          </div>

          {expandedClass === cls.className && (
            <div className="card-body pt-2 pb-2">
              <div className="row">
                {cls.students.map((student, i) => (
                  <div
                    key={student.id}
                    className="col-md-3 col-sm-6 mb-3"
                    onClick={() => handleStudentClick(student.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="card border-0 shadow-sm h-100"
                      style={{
                        borderRadius: "10px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 0 8px rgba(0,0,0,0.2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 2px 6px rgba(0,0,0,0.1)")
                      }
                    >
                      <div className="card-body text-center p-2">
                        <h6 className="text-dark mb-1">{student.name}</h6>
                        <small className="text-muted d-block">
                          {student.email}
                        </small>
                        <small className="text-primary fw-bold">
                          ID: {student.studentId || "N/A"}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Student Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="fs-6 fw-bold">Student Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {!studentDetails ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-3">
                <h6 className="mb-0">{studentDetails.student.name}</h6>
                <small className="text-muted">
                  ({studentDetails.student.studentId || "N/A"})
                </small>
              </div>

              {/* Student Info */}
              <h6 className="text-primary mb-2">Basic Information</h6>
              <table className="table table-sm table-bordered mb-3">
                <tbody>
                  <tr>
                    <th>Email</th>
                    <td>{studentDetails.student.email}</td>
                  </tr>
                  <tr>
                    <th>Class</th>
                    <td>{studentDetails.student.studentClass}</td>
                  </tr>
                  <tr>
                    <th>Gender</th>
                    <td>{studentDetails.info?.gender || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Date of Birth</th>
                    <td>
                      {studentDetails.info?.dob
                        ? new Date(
                            studentDetails.info.dob
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Blood Group</th>
                    <td>{studentDetails.info?.bloodGroup || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Caste</th>
                    <td>{studentDetails.info?.cast || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{studentDetails.info?.address || "N/A"}</td>
                  </tr>
                </tbody>
              </table>

              {/* Father Details */}
              <h6 className="text-primary mt-3 mb-2">Father Details</h6>
              <table className="table table-sm table-bordered">
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td>{studentDetails.info?.fatherName || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Mobile</th>
                    <td>{studentDetails.info?.fatherMobile || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Occupation</th>
                    <td>{studentDetails.info?.fatherOccupation || "N/A"}</td>
                  </tr>
                </tbody>
              </table>

              {/* Mother Details */}
              <h6 className="text-primary mt-3 mb-2">Mother Details</h6>
              <table className="table table-sm table-bordered">
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td>{studentDetails.info?.motherName || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Mobile</th>
                    <td>{studentDetails.info?.motherMobile || "N/A"}</td>
                  </tr>
                  <tr>
                    <th>Occupation</th>
                    <td>{studentDetails.info?.motherOccupation || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
