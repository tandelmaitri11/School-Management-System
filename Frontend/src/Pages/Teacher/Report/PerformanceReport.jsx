import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Card, Table } from "react-bootstrap";

export default function PerformanceReport() {
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await api.get("/api/performance/all");
        setPerformance(res.data);
      } catch (err) {
        console.error("Error fetching performance report:", err);
      }
    };
    fetchPerformance();
  }, []);

  return (
    <div className="container-fluid px-2 px-md-4">
      <Card className="p-3 p-md-4 mt-3 shadow-sm rounded-4">
        <h4 className="mb-3 text-center fw-bold fs-6 fs-md-4">
          📈 Student Performance Report
        </h4>

        <div className="table-responsive">
          <Table
            bordered
            hover
            className="align-middle text-nowrap mb-0"
          >
            <thead className="table-dark text-center">
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Average Marks</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {performance.length > 0 ? (
                performance.map((p, index) => (
                  <tr key={index}>
                    <td className="fw-medium">{p.studentName}</td>
                    <td>{p.className}</td>
                    <td>{p.averageMarks}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary px-3 py-2">
                        {p.grade}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-3">
                    No performance data found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
