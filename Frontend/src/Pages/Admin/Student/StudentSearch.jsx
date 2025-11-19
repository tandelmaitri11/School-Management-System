import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form } from "react-bootstrap";

export default function StudentSearch() {
  const [studentName, setStudentName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // ✅ Fetch live search suggestions while typing
  useEffect(() => {
    if (!studentName.trim()) {
      setSuggestions([]);
      return;
    }

    // Debounce to avoid too many API calls
    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("/api/students/search", {
          params: { name: studentName },
        });
        setSuggestions(res.data);
      } catch (error) {
        setSuggestions([]);
      }
    }, 400);

    setTypingTimeout(timeout);
  }, [studentName]);

  // ✅ Handle full search (press Search button)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    setLoading(true);
    try {
      const res = await api.get("/api/students/search", {
        params: { name: studentName },
      });
      setResults(res.data);
    } catch (error) {
      console.error("Error searching students:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ When a suggestion is clicked
  const handleSuggestionClick = (student) => {
    setStudentName(student.name);
    setSuggestions([]);
    handleStudentClick(student._id);
  };

  // ✅ Show student details modal
  const handleStudentClick = async (studentId) => {
    try {
      const res = await api.get(`/api/students/details/${studentId}`);
      setStudentDetails(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  return (
    <div className="container mt-4 position-relative">
      <h4 className="text-center mb-4 text-primary fw-bold">
        🔍 Search Students
      </h4>

      {/* ✅ Search Bar with Auto Suggestions */}
      <Form
        className="card shadow-sm p-3 mb-4"
        style={{ borderRadius: "10px", background: "#f8f9fa" }}
        onSubmit={handleSearch}
      >
        <div className="row g-3 align-items-end justify-content-center">
          <div className="col-md-6 position-relative">
            <Form.Label className="fw-semibold">Student Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Type student name..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul
                className="list-group position-absolute w-100 shadow-sm"
                style={{
                  top: "100%",
                  zIndex: 1000,
                  borderRadius: "10px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {suggestions.map((student) => (
                  <li
                    key={student._id}
                    className="list-group-item list-group-item-action"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSuggestionClick(student)}
                  >
                    <div className="fw-semibold">{student.name}</div>
                    <small className="text-muted">{student.email}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-md-2 text-center">
            <Button
              type="submit"
              variant="primary"
              className="w-100 fw-semibold mt-2"
            >
              Search
            </Button>
          </div>
        </div>
      </Form>

      {/* ✅ Search Results */}
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Searching...</span>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
          {results.map((student) => (
            <div
              key={student._id}
              className="col"
              onClick={() => handleStudentClick(student._id)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="card border-0 shadow-sm h-100"
                style={{
                  borderRadius: "10px",
                  transition: "all 0.2s ease",
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
                <div className="card-body text-center p-3">
                  <h6 className="text-dark mb-1">{student.name}</h6>
                  <small className="text-muted d-block">{student.email}</small>
                  <small className="text-primary fw-bold">
                    Class: {student.studentClass}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading &&
        studentName &&
        results.length === 0 && (
          <div className="text-center mt-5 text-muted">
            No students found matching “{studentName}”.
          </div>
        )
      )}

      {/* ✅ Student Details Modal */}
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
                    <th>DOB</th>
                    <td>
                      {studentDetails.info?.dob
                        ? new Date(
                            studentDetails.info.dob
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{studentDetails.info?.address || "N/A"}</td>
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
