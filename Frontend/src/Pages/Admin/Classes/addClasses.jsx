import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";

function NewClass() {
  const [formData, setFormData] = useState({ className: "", classTeacher: "" });
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get("/api/classes/teachers");
        setTeachers(res.data);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const classNum = Number(formData.className);
    if (!Number.isInteger(classNum) || classNum < 1 || classNum > 12) {
      setMessage("Class name must be between 1 and 12");
      return;
    }

    try {
      const res = await api.post("/api/classes", formData);
      setMessage(res.data.message);
      setFormData({ className: "", classTeacher: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Error adding class");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: "600px" }}>
        <h4 className="text-center mb-4 fw-bold text-warning">Add New Class</h4>

        {message && (
          <div className={`alert text-center ${message.includes("success") ? "alert-success" : "alert-danger"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Class Name (1–12) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="className"
              value={formData.className}
              onChange={handleChange}
              className="form-control rounded-pill"
              placeholder="Enter Class (e.g., 5)"
              required
              min="1"
              max="12"
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">
              Select Class Teacher <span className="text-danger">*</span>
            </label>
            <select
              name="classTeacher"
              value={formData.classTeacher}
              onChange={handleChange}
              className="form-select rounded-pill"
              required
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-warning rounded-pill px-4 fw-semibold">
              + Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewClass;
