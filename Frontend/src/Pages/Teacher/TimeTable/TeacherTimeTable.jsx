import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Card, Spinner, Table, Container, Badge } from "react-bootstrap";

const TeacherTimeTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const teacherId = localStorage.getItem("teacherId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(
          `/api/teachers/timetable/${teacherId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId, token]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="p-3 shadow">
        <h4 className="text-center mb-3">My Teaching Periods</h4>

        <Table bordered hover responsive className="text-center align-middle">
          <thead className="table-dark">
            <tr>
              <th>Day</th>
              <th>Period</th>
              <th>Time</th>
              <th>Class</th>
              <th>Subject</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.day}</td>
                <td>Period {row.period}</td>
                <td>{row.time}</td>
                <td>
                  <Badge bg="info">{row.className}</Badge>
                </td>
                <td>
                  <Badge bg="primary">{row.subject}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default TeacherTimeTable;
