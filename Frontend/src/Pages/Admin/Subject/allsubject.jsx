import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AllSubject() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState(null);
  const [updatedMarks, setUpdatedMarks] = useState("");
  const [updatedName, setUpdatedName] = useState("");
  const navigate = useNavigate();

  // Fetch all subjects grouped by class
  const fetchSubjects = async () => {
    try {
      const res = await api.get("/api/subjects/getSubjects");
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      alert("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Delete a single subject
  const handleDelete = async (classId, subId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await api.delete(`/api/subjects/deleteSubject/${classId}/${subId}`);
      setClasses(
        classes.map((cls) =>
          cls._id === classId
            ? { ...cls, subjects: cls.subjects.filter((s) => s._id !== subId) }
            : cls
        )
      );
    } catch (err) {
      console.error("Error deleting subject:", err);
      alert("Failed to delete subject");
    }
  };

  // Start editing a subject
  const handleEdit = (sub) => {
    setEditingSubject(sub._id);
    setUpdatedMarks(sub.marks);
    setUpdatedName(sub.subjectName);
  };

  // Update subject
  const handleUpdate = async (classId, subId) => {
    try {
      await api.put(`/api/subjects/updateSubject/${subId}`, {
        subjects: [{ _id: subId, subjectName: updatedName, marks: updatedMarks }],
      });
      setClasses(
        classes.map((cls) =>
          cls._id === classId
            ? {
                ...cls,
                subjects: cls.subjects.map((s) =>
                  s._id === subId ? { ...s, subjectName: updatedName, marks: updatedMarks } : s
                ),
              }
            : cls
        )
      );
      setEditingSubject(null);
      alert("Subject updated successfully!");
    } catch (err) {
      console.error("Error updating subject:", err);
      alert("Failed to update subject");
    }
  };

  if (loading) return <p className="text-center mt-5">Loading subjects...</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">All Subjects</h4>
        <button className="btn btn-primary rounded-pill" onClick={() => navigate("/subject/newsubject")}>
          + Add New
        </button>
      </div>

      <div className="row g-4">
        {classes.length === 0 ? (
          <p className="text-center text-muted">No subjects found.</p>
        ) : (
          classes.map((cls) => (
            <div key={cls._id} className="col-md-6">
              <div className="card shadow-sm border-0 rounded-4 p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-bold">Class: {cls.className}</h5>
                  <span className="badge bg-primary">Total Subjects: {cls.subjects.length}</span>
                </div>

                {cls.subjects.length === 0 ? (
                  <p className="text-muted">No subjects for this class.</p>
                ) : (
                  cls.subjects.map((sub) => (
                    <div key={sub._id} className="mb-3 border-bottom pb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{sub.subjectName}</strong>
                        <div>
                          <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEdit(sub)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(cls._id, sub._id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>

                      {editingSubject === sub._id && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={updatedName}
                            onChange={(e) => setUpdatedName(e.target.value)}
                            className="form-control rounded-pill mb-2"
                          />
                          <input
                            type="number"
                            value={updatedMarks}
                            onChange={(e) => setUpdatedMarks(e.target.value)}
                            className="form-control rounded-pill mb-2"
                          />
                          <div className="d-flex justify-content-end">
                            <button className="btn btn-success btn-sm me-2" onClick={() => handleUpdate(cls._id, sub._id)}>
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingSubject(null)}>
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </div>
                      )}

                      {editingSubject !== sub._id && (
                        <p className="mb-0">
                          Marks: {sub.marks} | Status: <span className="text-success">Active</span>
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}

        {/* Add new subject card */}
        <div className="col-md-6">
          <div
            className="card d-flex align-items-center justify-content-center border-dashed rounded-4 p-5 text-center"
            style={{ border: "2px dashed #ccc", cursor: "pointer" }}
            onClick={() => navigate("/subject/newsubject")}
          >
            <h5 className="text-muted">
              <i className="bi bi-plus-circle me-2"></i>Add New
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllSubject;
