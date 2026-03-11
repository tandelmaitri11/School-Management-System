import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Spinner, Container, Badge, Row, Col, Card } from "react-bootstrap";

const TeacherTimeTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const teacherId = localStorage.getItem("teacherId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/teachers/timetable/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacherId, token]);

  // Grouping data by day for a better organized UI
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <Spinner animation="grow" variant="primary" />
          <p className="mt-2 fw-bold text-secondary">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <i className="bi bi-calendar3 me-2 text-primary"></i>Weekly Schedule
            </h2>
            <p className="text-muted mb-0">Manage your teaching periods and classroom assignments.</p>
          </div>
          <Badge bg="white" text="dark" className="border shadow-sm p-2 px-3 rounded-pill">
            <i className="bi bi-person-badge me-2 text-primary"></i>Teacher Portal
          </Badge>
        </div>

        <Row className="g-4">
          {days.map((day) => {
            const dayClasses = data.filter((item) => item.day === day);

            return (
              <Col lg={4} md={6} key={day}>
                <Card className="border-0 shadow-sm rounded-4 h-100">
                  <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-primary">{day}</h5>
                    <Badge bg="primary-subtle" text="primary" className="rounded-pill">
                      {dayClasses.length} Periods
                    </Badge>
                  </Card.Header>

                  <Card.Body className="px-4 pb-4">
                    {dayClasses.length === 0 ? (
                      <div className="text-center py-5 opacity-50">
                        <i className="bi bi-cup-hot fs-1 d-block mb-2"></i>
                        <small className="fw-semibold">No Classes Assigned</small>
                      </div>
                    ) : (
                      <div className="mt-3">
                        {dayClasses
                          .sort((a, b) => a.period - b.period)
                          .map((row, idx) => (
                            <div key={idx} className="position-relative ps-4 pb-4 border-start border-2 border-light">
                              {/* Timeline Dot */}
                              <div 
                                className="position-absolute rounded-circle bg-primary" 
                                style={{ width: '12px', height: '12px', left: '-7px', top: '5px', border: '2px solid white' }}
                              ></div>

                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <span className="text-muted small fw-bold d-block mb-1">
                                    <i className="bi bi-clock me-1"></i> {row.time}
                                  </span>
                                  <h6 className="fw-bold mb-1 text-dark">
                                    {row.subject} 
                                    {row.subjectChoice && <small className="text-success ms-2">({row.subjectChoice})</small>}
                                  </h6>
                                  
                                  <div className="d-flex gap-1 flex-wrap mt-2">
                                    <Badge bg="info-subtle" text="info" className="fw-medium border border-info-subtle">
                                      Class {row.className}
                                    </Badge>
                                    {row.section && (
                                      <Badge bg="secondary-subtle" text="secondary" className="fw-medium border border-secondary-subtle">
                                        Sec: {row.section}
                                      </Badge>
                                    )}
                                    {row.stream && (
                                      <Badge bg="warning-subtle" text="warning" className="fw-medium border border-warning-subtle">
                                        {row.stream}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className="badge bg-light text-dark border fw-normal">P{row.period}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
};

export default TeacherTimeTable;