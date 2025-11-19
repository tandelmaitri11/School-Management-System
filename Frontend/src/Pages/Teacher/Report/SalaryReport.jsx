import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { Card, Table } from "react-bootstrap";

export default function SalaryReport() {
  const [salaryData, setSalaryData] = useState([]);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await api.get("/api/salary/all"); // Example endpoint
        setSalaryData(res.data);
      } catch (err) {
        console.error("Error fetching salary report:", err);
      }
    };
    fetchSalaries();
  }, []);

  return (
    <Card className="p-4 mt-3 shadow-sm">
      <h4 className="mb-3 text-center fw-bold">💰 Teacher Salary Report</h4>
      <Table bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Teacher Name</th>
            <th>Month</th>
            <th>Base Salary</th>
            <th>Bonus</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {salaryData.length > 0 ? (
            salaryData.map((s, index) => (
              <tr key={index}>
                <td>{s.teacherName}</td>
                <td>{s.month}</td>
                <td>₹{s.baseSalary}</td>
                <td>₹{s.bonus}</td>
                <td>₹{s.totalSalary}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">No salary data found</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
