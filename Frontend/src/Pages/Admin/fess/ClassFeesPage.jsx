// src/pages/admin/ClassFeesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../../api/api";

export default function ClassFeesPage() {
  const [className, setClassName] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [feesList, setFeesList] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Load all class fees
  const loadClassFees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/fees/all-class-fees");
      setFeesList(res.data.classFees || []);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Error fetching fees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassFees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!className || !totalFees) {
      return setMessage("Enter class and total fees");
    }

    try {
      const res = await api.post("/api/fees/class-fee", {
        className: Number(className),
        totalFees: Number(totalFees),
      });

      setMessage(res.data.message || "Class fee saved successfully");
      setClassName("");
      setTotalFees("");
      loadClassFees();
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Error saving class fee");
    }
  };

  // Fill form to edit
  const handleEdit = (fee) => {
    setClassName(fee.className);
    setTotalFees(fee.totalFees);
  };

  return (
    <div className="container mt-4">
      <h3>Manage Class Fees</h3>

      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row">
          <div className="col-md-3">
            <label className="form-label">Class</label>
            <input
              type="number"
              min="1"
              max="12"
              className="form-control"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Total Fees</label>
            <input
              type="number"
              className="form-control"
              value={totalFees}
              onChange={(e) => setTotalFees(e.target.value)}
            />
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button type="submit" className="btn btn-primary">
              Save Fee
            </button>
          </div>
        </div>
      </form>

      <h5>All Class Fees</h5>
      {loading ? (
        <p>Loading class fees...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Class</th>
              <th>Total Fees</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {feesList.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center">
                  No fees set
                </td>
              </tr>
            ) : (
              feesList.map((f) => (
                <tr key={f._id}>
                  <td>{f.className}</td>
                  <td>{f.totalFees}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleEdit(f)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
