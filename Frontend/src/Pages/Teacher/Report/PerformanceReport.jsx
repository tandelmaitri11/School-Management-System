import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { Card, Table, Form, Row, Col, Spinner, Badge, Button, Modal } from "react-bootstrap";

const EMPTY_SUMMARY = {
  totalStudents: 0,
  totalExams: 0,
  averagePercentage: 0,
  passRate: 0,
};

const EMPTY_FILTERS = {
  classes: [],
  sections: [],
  streams: [],
};

export default function PerformanceReport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [serverFilters, setServerFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState({
    search: "",
    className: "",
    section: "",
    stream: "",
  });
  const [gradeFilter, setGradeFilter] = useState("");
  const [sortBy, setSortBy] = useState("average-desc");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [savingRemark, setSavingRemark] = useState(false);

  const fetchPerformance = async (options = {}) => {
    const withLoading = Boolean(options.withLoading);
    if (withLoading) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (query.search.trim()) params.set("search", query.search.trim());
      if (query.className) params.set("className", query.className);
      if (query.section) params.set("section", query.section);
      if (query.stream) params.set("stream", query.stream);

      const url = `/api/performance/all${params.toString() ? `?${params}` : ""}`;
      const res = await api.get(url);
      const payload = res.data || {};

      setRows(Array.isArray(payload.data) ? payload.data : []);
      setSummary(payload.summary || EMPTY_SUMMARY);
      setServerFilters(payload.filters || EMPTY_FILTERS);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load performance report");
    } finally {
      if (withLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance({ withLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.className, query.section, query.stream]);

  const visibleRows = useMemo(() => {
    const list = [...rows];
    const filtered = gradeFilter ? list.filter((r) => String(r.grade || "") === gradeFilter) : list;

    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) => String(a.studentName || "").localeCompare(String(b.studentName || "")));
        break;
      case "name-desc":
        filtered.sort((a, b) => String(b.studentName || "").localeCompare(String(a.studentName || "")));
        break;
      case "exams-desc":
        filtered.sort((a, b) => Number(b.examsAttempted || 0) - Number(a.examsAttempted || 0));
        break;
      case "average-asc":
        filtered.sort((a, b) => Number(a.averagePercentage || 0) - Number(b.averagePercentage || 0));
        break;
      default:
        filtered.sort((a, b) => Number(b.averagePercentage || 0) - Number(a.averagePercentage || 0));
    }

    return filtered;
  }, [rows, gradeFilter, sortBy]);

  const openStudentReport = async (student) => {
    try {
      setSelectedStudent(student);
      setReportModalOpen(true);
      setReportLoading(true);
      const res = await api.get(`/api/reports/student/${student.studentMongoId || student.studentId}`);
      setStudentReport(res.data || null);
      setRemarkDraft(res.data?.teacherRemarksMeta?.hasCustomRemark ? res.data?.teacherRemarks || "" : "");
    } catch (err) {
      setStudentReport(null);
      setRemarkDraft("");
      setError(err.response?.data?.message || "Failed to load student report");
    } finally {
      setReportLoading(false);
    }
  };

  const saveRemark = async () => {
    if (!selectedStudent || !remarkDraft.trim()) return;
    try {
      setSavingRemark(true);
      await api.put(`/api/reports/student/${selectedStudent.studentMongoId || selectedStudent.studentId}/remark`, {
        remarks: remarkDraft.trim(),
      });
      const res = await api.get(`/api/reports/student/${selectedStudent.studentMongoId || selectedStudent.studentId}`);
      setStudentReport(res.data || null);
      setRemarkDraft(res.data?.teacherRemarks || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save report remark");
    } finally {
      setSavingRemark(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-2 px-md-4 py-4 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-4">
      <Card className="p-3 p-md-4 mt-3 shadow-sm rounded-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <h4 className="mb-0 fw-bold fs-6 fs-md-4">Student Performance Report</h4>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => fetchPerformance()}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        <Row className="g-2 mb-3">
          <Col md={3} sm={6}>
            <Card className="border-0 bg-light h-100">
              <Card.Body className="py-3">
                <div className="small text-muted">Students</div>
                <div className="h5 mb-0 fw-bold">{summary.totalStudents}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="border-0 bg-light h-100">
              <Card.Body className="py-3">
                <div className="small text-muted">Exams Tracked</div>
                <div className="h5 mb-0 fw-bold">{summary.totalExams}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="border-0 bg-light h-100">
              <Card.Body className="py-3">
                <div className="small text-muted">Class Average</div>
                <div className="h5 mb-0 fw-bold">{summary.averagePercentage}%</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="border-0 bg-light h-100">
              <Card.Body className="py-3">
                <div className="small text-muted">Pass Rate</div>
                <div className="h5 mb-0 fw-bold">{summary.passRate}%</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-2 mb-3">
          <Col md={3}>
            <Form.Control
              placeholder="Search by name or student ID"
              value={query.search}
              onChange={(e) => setQuery((prev) => ({ ...prev, search: e.target.value }))}
            />
          </Col>
          <Col md={2}>
            <Form.Select
              value={query.className}
              onChange={(e) => setQuery((prev) => ({ ...prev, className: e.target.value }))}
            >
              <option value="">All Classes</option>
              {serverFilters.classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select
              value={query.section}
              onChange={(e) => setQuery((prev) => ({ ...prev, section: e.target.value }))}
            >
              <option value="">All Sections</option>
              {serverFilters.sections.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select
              value={query.stream}
              onChange={(e) => setQuery((prev) => ({ ...prev, stream: e.target.value }))}
            >
              <option value="">All Streams</option>
              {serverFilters.streams.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={1}>
            <Form.Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="">Grade</option>
              {["A", "B", "C", "D", "E", "F"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="average-desc">Top Average</option>
              <option value="average-asc">Low Average</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="exams-desc">Most Exams</option>
            </Form.Select>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table bordered hover className="align-middle text-nowrap mb-0">
            <thead className="table-dark text-center">
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Stream</th>
                <th>Exams</th>
                <th>Average %</th>
                <th>Best %</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Last Exam</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {visibleRows.length > 0 ? (
                visibleRows.map((p, index) => (
                  <tr key={p.studentMongoId || `${p.studentId}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{p.studentId || "N/A"}</td>
                    <td className="fw-medium">{p.studentName}</td>
                    <td>{p.className}</td>
                    <td>{p.section || "N/A"}</td>
                    <td>{p.stream || "General"}</td>
                    <td>{p.examsAttempted}</td>
                    <td>{p.averagePercentage}%</td>
                    <td>{p.bestPercentage}%</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary px-3 py-2">{p.grade}</span>
                    </td>
                    <td>
                      <Badge bg={p.status === "Pass" ? "success" : "warning"} text={p.status === "Pass" ? undefined : "dark"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td>{p.lastExamAt ? new Date(p.lastExamAt).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => openStudentReport(p)}>
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="text-center text-muted py-3">
                    No performance data found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal show={reportModalOpen} onHide={() => setReportModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Student Report Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reportLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : studentReport ? (
            <div className="d-flex flex-column gap-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <div className="fw-bold">{studentReport.studentName}</div>
                      <div className="small text-muted">
                        {studentReport.studentId} | Class {studentReport.className}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <div className="small text-muted">Overall Result</div>
                      <div className="fw-bold">
                        {studentReport.overallResult?.label || "N/A"} ({studentReport.overallResult?.score || 0})
                      </div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-4">
                  <Card className="border-0 bg-light"><Card.Body><div className="small text-muted">Attendance</div><div className="fw-bold">{studentReport.attendance?.percentage || 0}%</div></Card.Body></Card>
                </div>
                <div className="col-md-4">
                  <Card className="border-0 bg-light"><Card.Body><div className="small text-muted">Exam Average</div><div className="fw-bold">{studentReport.academicPerformance?.averagePercentage || 0}%</div></Card.Body></Card>
                </div>
                <div className="col-md-4">
                  <Card className="border-0 bg-light"><Card.Body><div className="small text-muted">Fee Status</div><div className="fw-bold">{studentReport.feeStatus?.status || "N/A"}</div></Card.Body></Card>
                </div>
              </div>

              <div>
                <div className="fw-bold mb-2">AI Insight</div>
                <div className="small text-muted">{studentReport.aiInsights?.summary || "No insight available."}</div>
              </div>

              <div>
                <div className="fw-bold mb-2">Teacher Remarks</div>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={remarkDraft}
                  onChange={(e) => setRemarkDraft(e.target.value)}
                  placeholder="Write teacher remarks for this student report"
                />
                <div className="d-flex justify-content-end mt-3">
                  <Button
                    variant="dark"
                    className="me-2"
                    onClick={() =>
                      navigate(
                        `/teacher/reports/student/${selectedStudent?.studentMongoId || selectedStudent?.studentId}?pdf=1`
                      )
                    }
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => navigate(`/teacher/reports/student/${selectedStudent?.studentMongoId || selectedStudent?.studentId}`)}
                  >
                    Full Report
                  </Button>
                  <Button onClick={saveRemark} disabled={savingRemark || !remarkDraft.trim()}>
                    {savingRemark ? "Saving..." : "Save Remarks"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted py-4">No report found.</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
