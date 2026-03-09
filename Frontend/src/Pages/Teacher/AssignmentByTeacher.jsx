import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Table, Spinner, Alert, Card, Row, Col } from "react-bootstrap";

export default function AssignmentsByTeacher({ teacherId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/api/assignments/teacher/${teacherId}`);
        setAssignments(res.data);
      } catch {
        console.error("Error loading assignments");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [teacherId]);

  if (loading)
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <Card className="p-3 p-md-4 mt-3 shadow">
      <h4 className="mb-3">My Assignments</h4>

      {assignments.length === 0 ? (
        <Alert variant="info">No assignments found</Alert>
      ) : (
        <>
          {/* Table view for medium and larger screens */}
          <div className="d-none d-md-block table-responsive">
            <Table bordered hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id}>
                    <td>{a.title}</td>
                    <td>{a.subject}</td>
                    <td>{a.classAssigned}</td>
                    <td>{new Date(a.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Card view for small screens */}
          <div className="d-block d-md-none">
            <Row className="g-3">
              {assignments.map((a) => (
                <Col xs={12} key={a._id}>
                  <Card className="p-3 shadow-sm">
                    <h6 className="mb-2 fw-bold">{a.title}</h6>
                    <p className="mb-1">
                      <strong>Subject:</strong> {a.subject}
                    </p>
                    <p className="mb-1">
                      <strong>Class:</strong> {a.classAssigned}
                    </p>
                    <p className="mb-0">
                      <strong>Due Date:</strong>{" "}
                      {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
    </Card>
  );
}
