import React, { useState, useEffect } from "react";
import api from '../../../api/api';

const FeeParticulars = () => {
  const [selectedClass, setSelectedClass] = useState("All Students");
  const [fees, setFees] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const response = await api.get(`/api/fees/${selectedClass}`);
        setFees(response.data.fees);
      } catch (error) {
        console.warn("No fees found, loading defaults");
        setFees(defaultFees);
      }
    };
    fetchFees();
  }, [selectedClass]);

  const handleChange = (index, value) => {
    const newFees = [...fees];
    if (!newFees[index].fixed) {
      newFees[index].amount = value;
      setFees(newFees);
    }
  };

  const validateFees = () => {
    const validationErrors = {};
    fees.forEach((fee) => {
      if (!fee.fixed && (fee.amount === "" || fee.amount < 0)) {
        validationErrors[fee.label] = "Amount must be a positive number";
      }
    });
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateFees();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await api.post("api/fees", { className: selectedClass, fees });
      alert(`Fees for ${selectedClass} saved successfully!`);
    } catch (error) {
      const serverError =
        error.response?.data?.error || "Server error, please try again later.";
      setErrors({ server: serverError });
    }
  };

  const handleReset = () => {
    setFees(defaultFees);
    setErrors({});
  };

  return (
    <div className="container my-5">
      {/* Top Breadcrumb + Reset */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <p className="text-muted m-0">
          Settings / <span className="fw-bold">Change Fee Particulars</span>
        </p>
        <button onClick={handleReset} className="btn btn-dark btn-sm">
          <i className="bi bi-arrow-counterclockwise me-1"></i> Reset To Default
        </button>
      </div>

      {/* Card */}
      <div className="card shadow rounded-4 p-4">
        <h3 className="text-center fw-bold mb-4">Change Fee Particulars</h3>

        {/* Class Dropdown */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Fee Particulars For*</label>
          <select
            className="form-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option>All Students</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={`Class ${i + 1}`}>
                Class {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Fee Form */}
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {fees.map((fee, index) => (
              <React.Fragment key={index}>
                <div className="col-md-6">
                  <label className="form-label">{fee.label}</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={fee.label}
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Amount*</label>
                  <input
                    type={fee.fixed ? "text" : "number"}
                    className={`form-control ${fee.fixed ? "bg-light" : ""}`}
                    value={fee.amount}
                    onChange={(e) => handleChange(index, e.target.value)}
                    readOnly={fee.fixed}
                  />
                  {errors[fee.label] && (
                    <div className="text-danger small mt-1">{errors[fee.label]}</div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Save Button */}
          <div className="text-center mt-4">
            <button type="submit" className="btn btn-warning px-4 fw-semibold">
              Save Changes
            </button>
          </div>
          {errors.server && (
            <div className="text-danger text-center mt-3">{errors.server}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FeeParticulars;
