import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/api";
import { Alert, Badge, Button, Card, Form, Spinner, Table } from "react-bootstrap";

export default function AdminLmsProgress() {
  const [rows, setRows] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const showMessage = (type, text) => setMessage({ type, text });

  const fetchProgress = async (filterValue = appliedFilter) => {
    setLoading(true);
    try {
      const res = await api.get("/api/lms/admin/progress", {
        params: filterValue ? { classAssigned: filterValue } : {},
      });
      setRows(res.data || []);
    } catch (err) {
      showMessage("danger", "Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress(appliedFilter);
    const interval = setInterval(() => fetchProgress(appliedFilter), 15000);
    return () => clearInterval(interval);
  }, [appliedFilter]);

  const grouped = useMemo(() => {
    const classes = {};
    rows.forEach((row) => {
      const classKey = row.studentClass || "Unknown";
      const courseKey = row.courseId || row.courseTitle || "Unknown Course";
      if (!classes[classKey]) classes[classKey] = {};
      if (!classes[classKey][courseKey]) {
        classes[classKey][courseKey] = {
          courseTitle: row.courseTitle,
          subject: row.subject,
          rows: [],
        };
      }
      classes[classKey][courseKey].rows.push(row);
    });
    return classes;
  }, [rows]);

  const summary = useMemo(() => {
    const totalStudents = rows.length;
    const avgCompletion =
      rows.reduce((sum, r) => sum + (r.completionPct || 0), 0) / (rows.length || 1);
    const totalMaterials = rows.reduce((sum, r) => sum + (r.totalMaterials || 0), 0);
    const completedMaterials = rows.reduce((sum, r) => sum + (r.completedMaterials || 0), 0);
    const totalTopics = rows.reduce((sum, r) => sum + (r.totalTopics || 0), 0);
    const completedTopics = rows.reduce((sum, r) => sum + (r.completedTopicsCount || 0), 0);
    const totalNotes = rows.reduce((sum, r) => sum + (r.totalNotes || 0), 0);
    const completedNotes = rows.reduce((sum, r) => sum + (r.completedNotesCount || 0), 0);
    return {
      totalStudents,
      avgCompletion,
      totalMaterials,
      completedMaterials,
      totalTopics,
      completedTopics,
      totalNotes,
      completedNotes,
    };
  }, [rows]);

  const getStatusVariant = (pct) => {
    if (pct >= 70) return "success";
    if (pct >= 30) return "warning";
    return "danger";
  };

  const getStatusLabel = (pct) => {
    if (pct >= 70) return "On Track";
    if (pct >= 30) return "Needs Focus";
    return "At Risk";
  };

  return (
    <div className="container-fluid py-3">
      <h3 className="fw-semibold mb-3">LMS Progress Overview</h3>

      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      <Card className="p-3 shadow-sm border-0 mb-3">
        <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center">
          <Form.Label className="mb-0">Filter by class</Form.Label>
          <Form.Control
            type="number"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ maxWidth: 160 }}
          />
          <Button
            variant="primary"
            onClick={() => {
              setAppliedFilter(classFilter);
              fetchProgress(classFilter);
            }}
          >
            Apply
          </Button>
          <Button variant="outline-secondary" onClick={() => fetchProgress(appliedFilter)}>
            Refresh
          </Button>
        </div>
      </Card>

      {!loading && rows.length > 0 && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4 col-xl-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Overall Average</div>
                <div className="fw-bold fs-3">{Math.round(summary.avgCompletion)}%</div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-md-4 col-xl-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Materials Completed</div>
                <div className="fw-bold fs-5">
                  {summary.completedMaterials}/{summary.totalMaterials}
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-md-4 col-xl-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Topics Completed</div>
                <div className="fw-bold fs-5">
                  {summary.completedTopics}/{summary.totalTopics}
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-md-4 col-xl-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Notes Completed</div>
                <div className="fw-bold fs-5">
                  {summary.completedNotes}/{summary.totalNotes}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-4 text-center text-muted border-0 shadow-sm">
          No progress data available
        </Card>
      ) : (
        <div className="accordion" id="lmsProgressAccordion">
          {Object.entries(grouped).map(([classKey, courses], classIdx) => {
            const classId = `class-${classIdx}`;
            return (
              <div className="accordion-item mb-3 shadow-sm border-0" key={classKey}>
                <h2 className="accordion-header" id={`${classId}-header`}>
                  <button
                    className={`accordion-button ${classIdx === 0 ? "" : "collapsed"}`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${classId}-collapse`}
                    aria-expanded={classIdx === 0}
                    aria-controls={`${classId}-collapse`}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-people-fill text-primary" />
                      <span className="fw-semibold">Class {classKey}</span>
                      <Badge bg="light" text="dark">
                        {Object.keys(courses).length} courses
                      </Badge>
                    </div>
                  </button>
                </h2>
                <div
                  id={`${classId}-collapse`}
                  className={`accordion-collapse collapse ${classIdx === 0 ? "show" : ""}`}
                  aria-labelledby={`${classId}-header`}
                  data-bs-parent="#lmsProgressAccordion"
                >
                  <div className="accordion-body">
                    {Object.entries(courses).map(([courseId, courseGroup]) => {
                      const averagePct =
                        courseGroup.rows.reduce((sum, r) => sum + (r.completionPct || 0), 0) /
                        (courseGroup.rows.length || 1);
                      return (
                        <Card key={courseId} className="border-0 shadow-sm mb-3">
                          <Card.Body>
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                              <div>
                                <div className="fw-semibold">{courseGroup.courseTitle}</div>
                                <div className="text-muted small">{courseGroup.subject}</div>
                              </div>
                              <Badge bg={getStatusVariant(averagePct)}>
                                Avg {Math.round(averagePct)}% • {getStatusLabel(averagePct)}
                              </Badge>
                            </div>
                            <Table bordered responsive className="align-middle mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Student</th>
                                  <th>Email</th>
                                  <th>Completion</th>
                                  <th>Progress</th>
                                  <th>Topics</th>
                                  <th>Notes</th>
                                  <th>Status</th>
                                  <th>Last Activity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {courseGroup.rows.map((row, idx) => (
                                  <tr key={`${row.studentId}-${courseId}-${idx}`}>
                                    <td className="fw-semibold">{row.studentName}</td>
                                    <td className="text-muted">{row.studentEmail}</td>
                                    <td>{(row.avgProgressPct ?? row.completionPct) || 0}%</td>
                                    <td>
                                      {row.completedMaterials}/{row.totalMaterials}
                                    </td>
                                    <td>
                                      {row.totalTopics
                                        ? `${row.completedTopicsCount}/${row.totalTopics}`
                                        : "-"}
                                    </td>
                                    <td>
                                      {row.totalNotes ? `${row.completedNotesCount}/${row.totalNotes}` : "-"}
                                    </td>
                                    <td>
                                      <Badge bg={getStatusVariant(row.completionPct)}>
                                        {getStatusLabel(row.completionPct)}
                                      </Badge>
                                    </td>
                                    <td>
                                      {row.lastCompletedAt
                                        ? new Date(row.lastCompletedAt).toLocaleDateString()
                                        : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card.Body>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
