import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Card, Row, Col, Badge, Spinner } from "react-bootstrap";

export default function StudentSearch() {
  const [studentName, setStudentName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/api/classes");
        setClasses(res.data || []);
      } catch (error) {
        setClasses([]);
      }
    };

    fetchClasses();
  }, []);

  // ✅ Live search suggestions with Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (studentName.trim().length > 1) {
        try {
          const res = await api.get("/api/students/search", {
            params: {
              name: studentName,
              studentClass: selectedClass ? Number(selectedClass) : undefined,
            },
          });
          setSuggestions(res.data);
        } catch (error) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [studentName, selectedClass]);

  // ✅ Search execution
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await api.get("/api/students/search", {
        params: {
          name: studentName,
          studentClass: selectedClass ? Number(selectedClass) : undefined,
        },
      });
      setResults(res.data);
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (student) => {
    setStudentName(student.name);
    setSuggestions([]);
    fetchStudentDetails(student._id);
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const res = await api.get(`/api/students/details/${studentId}`);
      setStudentDetails(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching details", error);
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-dark">Student Directory</h2>
        <p className="text-muted">Search by name or filter by class</p>
      </div>

      {/* --- Search Section --- */}
      <Card className="shadow-sm border-0 p-4 mb-5" style={{ borderRadius: "15px" }}>
        <Form onSubmit={handleSearch}>
          <Row className="g-3">
            <Col md={6} className="position-relative">
              <Form.Control
                size="lg"
                type="text"
                placeholder="Search name..."
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={{ borderRadius: "10px" }}
              />
              {/* Autocomplete Dropdown */}
              {suggestions.length > 0 && (
                <ul className="list-group position-absolute w-100 mt-1 shadow-lg" style={{ zIndex: 10, borderRadius: "10px" }}>
                  {suggestions.map((s) => (
                    <li 
                      key={s._id} 
                      className="list-group-item list-group-item-action border-0"
                      onClick={() => handleSuggestionClick(s)}
                      style={{ cursor: "pointer" }}
                    >
                      <strong>{s.name}</strong>{" "}
                      <small className="text-muted ml-2">Class {s.studentClass}</small>
                    </li>
                  ))}
                </ul>
              )}
            </Col>
            <Col md={4}>
              <Form.Select 
                size="lg" 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id || c.className} value={c.className}>
                    Class {c.className}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" size="lg" className="w-100" type="submit" style={{ borderRadius: "10px" }}>
                Search
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* --- Results Section --- */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Row className="g-4">
          {results.map((student) => (
            <Col key={student._id} lg={3} md={4} sm={6}>
              <Card 
                className="h-100 border-0 shadow-sm text-center student-card" 
                onClick={() => fetchStudentDetails(student._id)}
                style={{ borderRadius: "15px", cursor: "pointer", transition: "transform 0.2s" }}
              >
                <Card.Body>
                  <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                    <span className="fs-4 text-primary fw-bold">{student.name.charAt(0)}</span>
                  </div>
                  <h6 className="fw-bold mb-1">{student.name}</h6>
                  <p className="text-muted small mb-2">{student.email}</p>
                  <Badge bg="soft-primary" className="text-primary px-3 py-2" style={{ backgroundColor: "#e7f1ff" }}>
                    {student.studentClass}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* --- Details Modal --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Student Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {studentDetails && (
            <div className="text-center">
              <div className="my-4">
                <h4 className="mb-0">{studentDetails.student.name}</h4>
                <p className="text-muted">ID: {studentDetails.student.studentId || "N/A"}</p>
              </div>
              <table className="table table-borderless text-start">
                <tbody>
                  <tr className="border-bottom">
                    <td className="text-muted">Class</td>
                    <td className="fw-bold">{studentDetails.student.studentClass}</td>
                  </tr>
                  <tr className="border-bottom">
                    <td className="text-muted">Email</td>
                    <td className="fw-bold">{studentDetails.student.email}</td>
                  </tr>
                  <tr className="border-bottom">
                    <td className="text-muted">Gender</td>
                    <td className="fw-bold">{studentDetails.info?.gender || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
