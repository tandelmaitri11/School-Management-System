import React, { useEffect, useState } from "react";
import api from "../../../api/api";

export default function TeacherSalaryHistory() {
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get teacher ID from localStorage (assuming login saved teacherId)
  const teacherId = localStorage.getItem("teacherId");

  useEffect(() => {
    const fetchSalaryHistory = async () => {
      if (!teacherId) return;
      try {
        const res = await api.get(`/api/teacher-salary/teacher/${teacherId}/salary`);
        setSalaryHistory(res.data);
      } catch (err) {
        console.error("Error fetching salary history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryHistory();
  }, [teacherId]);

  // Map status to badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "badge bg-success";
      case "Pending":
        return "badge bg-warning text-dark";
      case "Approved":
        return "badge bg-primary";
      case "Rejected":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center text-primary">
        <i className="bi bi-cash-stack me-2"></i>My Salary History
      </h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : salaryHistory.length === 0 ? (
        <div className="alert alert-info text-center">
          No salary records found.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered text-center align-middle">
            <thead className="table-primary">
              <tr>
                <th>#</th>
                <th>Month</th>
                <th>Paid Amount (₹)</th>
                <th>Status</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {salaryHistory.map((record, index) => (
                <tr key={record._id}>
                  <td>{index + 1}</td>
                  <td>{record.month}</td>
                  <td>₹ {record.paidAmount}</td>
                  <td>
                    <span className={getStatusClass(record.status)}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {record.createdAt
                      ? new Date(record.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
