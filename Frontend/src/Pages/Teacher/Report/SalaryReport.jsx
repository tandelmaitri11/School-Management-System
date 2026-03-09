import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Card, Table } from "react-bootstrap";

export default function SalaryReport() {
  const [salaryData, setSalaryData] = useState([]);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await api.get("/api/salary/all");
        setSalaryData(res.data);
      } catch (err) {
        console.error("Error fetching salary report:", err);
      }
    };
    fetchSalaries();
  }, []);

  return (
    <div className="container-fluid px-2 px-md-4">
      <Card className="p-3 p-md-4 mt-3 shadow-sm rounded-4">
        <h4 className="mb-3 text-center fw-bold fs-6 fs-md-4">
          💰 Teacher Salary Report
        </h4>

        <div className="table-responsive">
          <Table
            bordered
            hover
            className="align-middle text-nowrap mb-0"
          >
            <thead className="table-dark text-center">
              <tr>
                <th>Teacher Name</th>
                <th>Month</th>
                <th>Base Salary</th>
                <th>Bonus</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody className="text-center">
              {salaryData.length > 0 ? (
                salaryData.map((s, index) => (
                  <tr key={index}>
                    <td className="fw-medium">{s.teacherName}</td>
                    <td>{s.month}</td>
                    <td>₹{s.baseSalary}</td>
                    <td>₹{s.bonus}</td>
                    <td>
                      <span className="badge bg-success-subtle text-success px-3 py-2">
                        ₹{s.totalSalary}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No salary data found
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
