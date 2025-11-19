import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AllTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/teachers/getTeachers");
      setTeachers(res.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;

    try {
      await api.delete(`/api/teachers/deleteTeacher/${id}`);
      setTeachers(teachers.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Error deleting teacher:", err);
      alert("Failed to delete teacher. Try again.");
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mt-4 mb-5">
      {/* Search Bar */}
      <div className="d-flex justify-content-end mb-3">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: "250px" }}
          placeholder="Search by teacher name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2">Loading teachers...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="alert alert-info text-center">No teachers found.</div>
      ) : (
        <div className="row g-4">
          {filteredTeachers.map((teacher) => (
            <div key={teacher._id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 p-3">
                {/* Image + Name */}
                <div className="d-flex align-items-center mb-3">
                  {teacher.picture ? (
  <img
    src={`http://localhost:3000/${teacher.picture}`}
    alt="Teacher"
    className="rounded-circle border"
    style={{ width: "80px", height: "80px", objectFit: "cover" }}
  />
) : (
  <i className="bi bi-person-circle fs-1 text-secondary"></i>
)}
                  <div className="ms-3">
                    <h5 className="mb-1">{teacher.teacherName}</h5>
                    <p className="mb-0 text-muted">
                      Reg No: {teacher.regNumber || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Line-by-line info */}
                <ul className="list-group list-group-flush small">
                  <li className="list-group-item bg-light border-0 px-0">
                    <strong>Email:</strong> {teacher.email || "N/A"}
                  </li>
                  <li className="list-group-item bg-light border-0 px-0">
                    <strong>Mobile:</strong> {teacher.mobile || "N/A"}
                  </li>
                  <li className="list-group-item bg-light border-0 px-0">
                    <strong>Gender:</strong> {teacher.gender || "N/A"}
                  </li>
                  <li className="list-group-item bg-light border-0 px-0">
                    <strong>Salary:</strong> ₹{teacher.salary || 0}
                  </li>
                  <li className="list-group-item bg-light border-0 px-0">
                    <strong>Joining Date:</strong>{" "}
                    {teacher.joiningDate
                      ? new Date(teacher.joiningDate).toLocaleDateString()
                      : "N/A"}
                  </li>
                </ul>

                {/* Action Buttons */}
                <div className="text-center mt-3">
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    title="View"
                    onClick={() =>
                      navigate(`/teachers/viewteacher/${teacher._id}`)
                    }
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning me-2"
                    title="Edit"
                    onClick={() =>
                      navigate(`/teachers/editteacher/${teacher._id}`)
                    }
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Delete"
                    onClick={() => handleDelete(teacher._id)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Teacher Card */}
          <div className="col-md-6 col-lg-4">
            <div
              className="card h-100 shadow-sm border-0 d-flex justify-content-center align-items-center text-center p-3"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/teacher/addteacher")}
            >
              <i className="bi bi-plus-circle fs-1 text-success mb-2"></i>
              <h5 className="text-success">Add New Teacher</h5>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllTeachers;
