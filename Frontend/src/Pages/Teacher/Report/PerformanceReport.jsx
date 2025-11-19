import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Card, Table } from "react-bootstrap";

export default function PerformanceReport() {
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await api.get("/api/performance/all"); // your backend endpoint
        setPerformance(res.data);
      } catch (err) {
        console.error("Error fetching performance report:", err);
      }
    };
    fetchPerformance();
  }, []);

  return (
    <Card className="p-4 mt-3 shadow-sm">
      <h4 className="mb-3 text-center fw-bold">📈 Student Performance Report</h4>
      <Table bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Student Name</th>
            <th>Class</th>
            <th>Average Marks</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {performance.length > 0 ? (
            performance.map((p, index) => (
              <tr key={index}>
                <td>{p.studentName}</td>
                <td>{p.className}</td>
                <td>{p.averageMarks}</td>
                <td>{p.grade}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">No performance data found</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
