import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Offcanvas,
  ProgressBar,
  Row,
  Spinner,
  Table,
  Toast,
  ToastContainer,
  InputGroup
} from "react-bootstrap";

// Helper function to generate avatar initials safely
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return "?";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
};

const StudentLMSProgress = () => {
  const teacherId = localStorage.getItem("teacherId");
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [sortBy, setSortBy] = useState("studentName");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  
  const [sanityData, setSanityData] = useState([]);
  const [sanityLoading, setSanityLoading] = useState(false);
  const [sanityError, setSanityError] = useState("");

  // Detail Panel State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Fetch teacher progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/api/lms/teacher/progress");
        setProgressData(response.data || []);
      } catch (err) {
        console.error("Error fetching progress data:", err);
        setError(
          err.response?.data?.message || 
          "Failed to load student LMS progress. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchProgressData();
    }
  }, [teacherId]);

  const fetchSanityData = async () => {
    try {
      setSanityLoading(true);
      setSanityError("");
      const response = await api.get("/api/lms/teacher/progress/sanity");
      setSanityData(response.data || []);
      setToast({ show: true, message: `Sanity check returned ${response.data.length} records`, variant: "success" });
    } catch (err) {
      console.error("Error fetching sanity data:", err);
      setSanityError(err.response?.data?.message || "Failed to load sanity data.");
      setToast({ show: true, message: "Sanity check failed", variant: "danger" });
    } finally {
      setSanityLoading(false);
    }
  };

  // Get unique courses for filter dropdown
  const courses = [...new Set(progressData.map(row => row.courseTitle).filter(Boolean))];

  // Get progress badge variant based on completion percentage
  const getProgressVariant = (completionPct) => {
    if (completionPct >= 100) return "success";
    if (completionPct >= 75) return "info";
    if (completionPct >= 40) return "warning";
    return "danger";
  };

  // Normalize per-row completion for consistent charting
  const getNormalizedCompletion = (row) => {
    const rawAvg = Number(row.avgProgressPct ?? row.completionPct ?? 0);
    const materialPct = row.totalMaterials > 0
      ? (row.completedMaterials / row.totalMaterials) * 100
      : null;
    const topicPct = row.totalTopics > 0
      ? (row.completedTopicsCount / row.totalTopics) * 100
      : null;

    const candidates = [rawAvg, materialPct, topicPct].filter(
      (value) => value !== null && value !== undefined && !Number.isNaN(value)
    );

    const best = candidates.length > 0 ? Math.max(...candidates) : 0;
    return Number.isFinite(best) ? Math.min(Math.max(Math.round(best), 0), 100) : 0;
  };

  // --- DATA PIPELINE: 1. Filter -> 2. Aggregate -> 3. Sort ---

  // 1. Filter the raw rows based on search and course selection
  const filteredRows = progressData.filter(row => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (row.studentName || "").toLowerCase().includes(searchLower) ||
      (row.studentEmail || "").toLowerCase().includes(searchLower) ||
      String(row.studentId || "").toLowerCase().includes(searchLower);
    
    const matchesCourse = !filterCourse || row.courseTitle === filterCourse;
    
    return matchesSearch && matchesCourse;
  });

  // 2. Aggregate the filtered rows by Student
  const studentMap = new Map();
  filteredRows.forEach(row => {
    const sId = String(row.studentId);
    if (!studentMap.has(sId)) {
      studentMap.set(sId, {
        studentId: sId,
        studentName: row.studentName || "Unknown Student",
        studentEmail: row.studentEmail || "No Email",
        studentClass: row.studentClass || "-",
        totalCourses: 0,
        completedCourses: 0,
        totalPct: 0,
        lastUpdated: null,
      });
    }

    const student = studentMap.get(sId);
    const completionPct = getNormalizedCompletion(row);
    
    student.totalCourses += 1;
    if (completionPct === 100) {
      student.completedCourses += 1;
    }
    student.totalPct += completionPct;

    if (!student.lastUpdated || new Date(row.lastCompletedAt) > new Date(student.lastUpdated)) {
      student.lastUpdated = row.lastCompletedAt;
    }
  });

  // Calculate final averages for each student
  const aggregatedStudents = Array.from(studentMap.values()).map(student => ({
    ...student,
    averageCompletion: student.totalCourses ? Math.round(student.totalPct / student.totalCourses) : 0
  }));

  // 3. Sort the aggregated students
  const finalStudentsList = aggregatedStudents.sort((a, b) => {
    if (sortBy === "completionPctDesc") {
      return b.averageCompletion - a.averageCompletion; // Highest first
    }
    if (sortBy === "completionPctAsc") {
      return a.averageCompletion - b.averageCompletion; // Lowest first
    }
    // Default: Sort by Name (A-Z)
    return a.studentName.localeCompare(b.studentName);
  });

  // Handle student row click to show ALL of their courses in Offcanvas
  const handleStudentClick = (studentId) => {
    // Look up courses from the UNFILTERED dataset so the panel shows their full profile
    const studentCourses = progressData.filter(row => String(row.studentId) === String(studentId));
    
    if (studentCourses.length > 0) {
      setSelectedStudent({
        studentId,
        studentName: studentCourses[0].studentName,
        studentEmail: studentCourses[0].studentEmail,
        studentClass: studentCourses[0].studentClass,
        courses: studentCourses
      });
      setShowDetailPanel(true);
    }
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setTimeout(() => setSelectedStudent(null), 300); // clear after animation finishes
  };

  // --- CSV EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (!finalStudentsList || finalStudentsList.length === 0) {
      setToast({ show: true, message: "No data to export.", variant: "warning" });
      return;
    }

    // Define the headers for the CSV
    const headers = [
      "Student Name",
      "Student ID",
      "Email",
      "Class",
      "Total Courses",
      "Completed Courses",
      "Average Completion (%)",
      "Last Active Date"
    ];

    // Map the aggregated list into CSV rows
    const csvRows = finalStudentsList.map(student => {
      // Wrapping strings in quotes prevents commas in names/emails from breaking the CSV columns
      return [
        `"${student.studentName || ""}"`,
        `"${student.studentId || ""}"`,
        `"${student.studentEmail || ""}"`,
        `"${student.studentClass || ""}"`,
        student.totalCourses || 0,
        student.completedCourses || 0,
        student.averageCompletion || 0,
        student.lastUpdated ? `"${new Date(student.lastUpdated).toLocaleDateString()}"` : `"N/A"`
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create a Blob and trigger a download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `student_progress_export_${new Date().toISOString().slice(0, 10)}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ show: true, message: "CSV Exported Successfully!", variant: "success" });
  };

  return (
    <Container fluid className="student-lms-progress-container py-4 bg-light min-vh-100">
      
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-1 fw-bold text-dark">
            <i className="bi bi-mortarboard-fill text-primary me-2"></i> 
            Student Progress Overview
          </h2>
          <p className="text-muted mb-0">Track and manage your students' course completions.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button 
            variant="primary" 
            className="d-flex align-items-center gap-2 shadow-sm"
            onClick={handleExportCSV} // <-- Attached the CSV Export Function here
          >
            <i className="bi bi-download"></i> Export CSV
          </Button>
          <Button
            variant={sanityLoading ? "secondary" : "outline-primary"}
            className="d-flex align-items-center gap-2 shadow-sm bg-white"
            disabled={sanityLoading}
            onClick={fetchSanityData}
          >
            <i className="bi bi-shield-check"></i> {sanityLoading ? "Checking..." : "Sanity Check"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </Alert>
      )}

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <Spinner animation="border" variant="primary" role="status" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted fw-medium">Loading student records...</p>
        </div>
      ) : progressData.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm rounded-4">
          <Card.Body>
            <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 text-dark">No Data Found</h5>
            <p className="text-muted mb-0">No student progress data is available yet.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Top KPI Cards */}
          <Row className="mb-4 g-3">
            <Col md={3}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="bi bi-people-fill text-primary fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Students</h6>
                    <h3 className="mb-0 fw-bold">{finalStudentsList.length}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="bi bi-book-fill text-info fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Active Courses</h6>
                    <h3 className="mb-0 fw-bold">{courses.length}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="bi bi-check-circle-fill text-success fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Perfect Completions</h6>
                    <h3 className="mb-0 fw-bold">{finalStudentsList.filter(s => s.averageCompletion === 100).length}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                    <i className="bi bi-graph-up-arrow text-warning fs-4"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Class Average</h6>
                    <h3 className="mb-0 fw-bold">
                      {finalStudentsList.length > 0
                        ? Math.round(finalStudentsList.reduce((sum, s) => sum + s.averageCompletion, 0) / finalStudentsList.length)
                        : 0}%
                    </h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Sanity Table (Hidden unless triggered) */}
          {sanityError && (
            <Alert variant="danger" dismissible onClose={() => setSanityError("")}>Sanity check error: {sanityError}</Alert>
          )}
          {sanityData.length > 0 && (
            <Card className="mb-4 border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-dark fw-bold">Sanity Data Inspector <Badge bg="secondary" className="ms-2">{sanityData.length} Rows</Badge></h5>
                <Button variant="close" size="sm" onClick={() => setSanityData([])}></Button>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive" style={{ maxHeight: "300px" }}>
                  <Table bordered hover size="sm" className="mb-0 align-middle text-nowrap">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Course Title</th>
                        <th>Progress %</th>
                        <th>Watched (s)</th>
                        <th>Completed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sanityData.slice(0, 100).map((row, idx) => (
                        <tr key={`${row.studentId}-${row.materialId}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td className="fw-semibold">{row.studentName || "-"}</td>
                          <td><Badge bg="light" text="dark">{row.studentId}</Badge></td>
                          <td>{row.courseTitle || row.courseId}</td>
                          <td>
                            <Badge bg={getProgressVariant(row.progressPct || 0)}>
                              {row.progressPct ?? 0}%
                            </Badge>
                          </td>
                          <td>{row.watchedSeconds ?? 0}s</td>
                          <td className="text-muted">{row.completedAt ? new Date(row.completedAt).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {sanityData.length > 100 && <div className="text-muted small mt-2 text-end">Showing first 100 records only.</div>}
              </Card.Body>
            </Card>
          )}

          {/* Main Data Card */}
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            
            {/* Inline Toolbar */}
            <Card.Header className="bg-white border-bottom p-3">
              <Row className="g-3 align-items-center">
                <Col md={5}>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, email, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-light border-start-0 shadow-none"
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    className="bg-light border shadow-none"
                  >
                    <option value="">All Courses</option>
                    {courses.map((course, idx) => (
                      <option key={idx} value={course}>{course}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-light border shadow-none"
                  >
                    <option value="studentName">Sort by Name (A-Z)</option>
                    <option value="completionPctDesc">Highest Completion</option>
                    <option value="completionPctAsc">Lowest Completion</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Header>

            {/* Table */}
            <Card.Body className="p-0">
              {finalStudentsList.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-search fs-1 mb-2 d-block"></i>
                  No students match your current search/filters.
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle text-nowrap">
                    <thead className="bg-light text-muted" style={{ fontSize: '0.85rem' }}>
                      <tr>
                        <th className="ps-4 py-3 fw-semibold border-0">STUDENT</th>
                        <th className="py-3 fw-semibold border-0">ID</th>
                        <th className="py-3 fw-semibold border-0 text-center">COURSES</th>
                        <th className="py-3 fw-semibold border-0" style={{ width: '25%' }}>OVERALL PROGRESS</th>
                        <th className="py-3 fw-semibold border-0">LAST ACTIVE</th>
                        <th className="pe-4 py-3 fw-semibold border-0 text-end">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalStudentsList.map((student) => (
                        <tr 
                          key={student.studentId} 
                          onClick={() => handleStudentClick(student.studentId)}
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        >
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle shadow-sm"
                                style={{ width: '40px', height: '40px', fontSize: '0.9rem', fontWeight: 'bold' }}
                              >
                                {getInitials(student.studentName)}
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{student.studentName}</div>
                                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{student.studentEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-muted bg-light px-2 py-1 rounded border" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                              {student.studentId}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="fw-bold text-dark">{student.completedCourses}</span>
                            <span className="text-muted"> / {student.totalCourses}</span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <ProgressBar
                                now={student.averageCompletion}
                                variant={getProgressVariant(student.averageCompletion)}
                                className="flex-grow-1 border"
                                style={{ height: '8px' }}
                              />
                              <span className="fw-bold text-dark" style={{ minWidth: '40px', fontSize: '0.9rem' }}>
                                {student.averageCompletion}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            {student.lastUpdated ? (
                              <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                {new Date(student.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-muted fst-italic">-</span>
                            )}
                          </td>
                          <td className="pe-4 py-3 text-end">
                            <Button
                              variant="light"
                              size="sm"
                              className="rounded-pill px-3 shadow-sm border"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStudentClick(student.studentId);
                              }}
                            >
                              Details <i className="bi bi-chevron-right ms-1"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* Modern Slide-out Offcanvas for Details */}
      <Offcanvas 
        show={showDetailPanel} 
        onHide={handleCloseDetailPanel} 
        placement="end"
        style={{ width: '450px' }}
        className="border-start-0 shadow-lg"
      >
        <Offcanvas.Header closeButton className="border-bottom bg-light py-3">
          <Offcanvas.Title className="fw-bold d-flex align-items-center gap-2 text-dark">
            <i className="bi bi-person-vcard text-primary"></i> 
            Student Report Card
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 bg-light">
          {selectedStudent && (
            <div className="p-4">
              
              {/* Profile Overview */}
              <div className="text-center mb-4">
                <div 
                  className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3 shadow"
                  style={{ width: '80px', height: '80px', fontSize: '1.8rem', fontWeight: 'bold' }}
                >
                  {getInitials(selectedStudent.studentName)}
                </div>
                <h4 className="fw-bold mb-1 text-dark">{selectedStudent.studentName}</h4>
                <p className="text-muted mb-3">{selectedStudent.studentEmail}</p>
                <div className="d-flex justify-content-center gap-2">
                  <Badge bg="white" text="dark" className="border shadow-sm px-3 py-2">ID: {selectedStudent.studentId}</Badge>
                  <Badge bg="white" text="dark" className="border shadow-sm px-3 py-2">Class: {selectedStudent.studentClass}</Badge>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-end mb-3">
                <h6 className="fw-bold text-uppercase text-muted mb-0" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                  Course Breakdown
                </h6>
                <Badge bg="light" text="dark" className="border">
                  {selectedStudent.courses.length} Enrolled
                </Badge>
              </div>
              
              {selectedStudent.courses.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {selectedStudent.courses.map((course, idx) => {
                    const completion = getNormalizedCompletion(course);
                    return (
                      <Card key={idx} className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Card.Body className="p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="fw-bold mb-1 text-dark">{course.courseTitle}</h6>
                              <Badge bg="secondary" className="bg-opacity-10 text-secondary border">{course.subject}</Badge>
                            </div>
                            <span className={`badge bg-${getProgressVariant(completion)} px-2 py-1 fs-6`}>
                              {completion}%
                            </span>
                          </div>

                          <ProgressBar
                            now={completion}
                            variant={getProgressVariant(completion)}
                            className="mb-4"
                            style={{ height: '6px' }}
                          />

                          <Row className="g-2 text-center text-muted" style={{ fontSize: '0.8rem' }}>
                            <Col xs={4}>
                              <div className="bg-light rounded p-2 border">
                                <div className="fw-bold text-dark fs-6">{course.completedMaterials}/{course.totalMaterials}</div>
                                <div>Materials</div>
                              </div>
                            </Col>
                            <Col xs={4}>
                              <div className="bg-light rounded p-2 border">
                                <div className="fw-bold text-dark fs-6">
                                  {course.totalTopics ? `${course.completedTopicsCount}/${course.totalTopics}` : "0/0"}
                                </div>
                                <div>Topics</div>
                              </div>
                            </Col>
                            <Col xs={4}>
                              <div className="bg-light rounded p-2 border">
                                <div className="fw-bold text-dark fs-6">
                                  {course.totalNotes ? `${course.completedNotesCount}/${course.totalNotes}` : "0/0"}
                                </div>
                                <div>Notes</div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Alert variant="secondary" className="text-center border-0 shadow-sm rounded-4 p-4">
                  <i className="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
                  No course data available for this student.
                </Alert>
              )}
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Toast Notifications */}
      <ToastContainer position="bottom-end" className="p-4 position-fixed" style={{ zIndex: 9999 }}>
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          delay={4000}
          autohide
          bg={toast.variant}
          className="shadow-lg border-0"
        >
          <Toast.Body className="text-white fw-medium d-flex align-items-center gap-2">
            {toast.variant === "success" ? <i className="bi bi-check-circle fs-5"></i> : <i className="bi bi-exclamation-triangle fs-5"></i>}
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default StudentLMSProgress;