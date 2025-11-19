import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Table, Spinner, Alert, Card } from "react-bootstrap";

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

  if (loading) return <Spinner animation="border" />;

  return (
    <Card className="p-4 mt-3 shadow">
      <h4>My Assignments</h4>
      {assignments.length === 0 ? (
        <Alert>No assignments found</Alert>
      ) : (
        <Table bordered hover>
          <thead>
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
      )}
    </Card>
  );
}
