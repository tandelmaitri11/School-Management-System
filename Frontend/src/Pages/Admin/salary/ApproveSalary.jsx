import React, { useEffect, useState } from "react";
import api from "../../../api/api";

export default function SalaryApprove() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const res = await api.get("/api/teacher-salary/all");
    setRecords(res.data);
  };

  const updateStatus = async (id, status) => {
    await api.put(`/api/teacher-salary/status/${id}`, { status });
    loadRecords();
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Approve Teacher Salary</h2>

      <div className="row">
        {records.map((r) => (
          <div className="col-md-4 mb-3" key={r._id}>
            <div className="card shadow p-3">
              <h5>{r.teacher.teacherName}</h5>
              <p><b>Month:</b> {r.month}</p>
              <p><b>Amount:</b> ₹{r.paidAmount}</p>
              <p><b>Status:</b> 
                <span
                  className={`badge ${
                    r.status === "Approved"
                      ? "bg-success"
                      : r.status === "Rejected"
                      ? "bg-danger"
                      : "bg-warning"
                  }`}
                >
                  {r.status}
                </span>
              </p>

              <button
                className="btn btn-success w-100 mb-2"
                onClick={() => updateStatus(r._id, "Approved")}
              >
                Approve
              </button>

              <button
                className="btn btn-danger w-100"
                onClick={() => updateStatus(r._id, "Rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
