import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AllClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [updatedTeacher, setUpdatedTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [classTotals, setClassTotals] = useState({});
  const [overallTotals, setOverallTotals] = useState({
    totalStudents: 0,
    totalBoys: 0,
    totalGirls: 0,
    totalOther: 0,
  });

  // ✅ Fetch all classes and totals
  const fetchData = async () => {
    try {
      const res = await api.get("/api/classes");
      const sorted = (res.data || []).sort(
        (a, b) => Number(a.className) - Number(b.className)
      );
      setClasses(sorted);

      let totalsMap = {};
      let overall = { totalStudents: 0, totalBoys: 0, totalGirls: 0, totalOther: 0 };

      for (const cls of sorted) {
        try {
          const res2 = await api.get(`/api/classes/total/${cls._id}`);
          totalsMap[cls._id] = res2.data;
          overall.totalStudents += res2.data.totalStudents || 0;
          overall.totalBoys += res2.data.totalBoys || 0;
          overall.totalGirls += res2.data.totalGirls || 0;
          overall.totalOther += res2.data.totalOther || 0;
        } catch {
          totalsMap[cls._id] = {
            totalStudents: 0,
            totalBoys: 0,
            totalGirls: 0,
            totalOther: 0,
          };
        }
      }

      setClassTotals(totalsMap);
      setOverallTotals(overall);
    } catch (err) {
      toast.error(" Failed to fetch classes!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch teachers
  const fetchTeachers = async () => {
    try {
      const res = await api.get("/api/classes/teachers");
      setTeachers(res.data || []);
    } catch {
      toast.error("Failed to fetch teachers!");
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  // ✅ Delete class
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      await api.delete(`/api/classes/${id}`);
      setClasses(classes.filter((cls) => cls._id !== id));
      toast.success("Class deleted successfully!");
    } catch {
      toast.error(" Failed to delete class!");
    }
  };

  // ✅ Edit and update teacher
  const handleEdit = (cls) => {
    setEditingClass(cls._id);
    setUpdatedTeacher(cls.classTeacher?._id || "");
    toast.info(`Editing Class ${cls.className}`);
  };

  const handleUpdate = async (id) => {
    if (!updatedTeacher) {
      toast.warning("Please select a teacher before updating!");
      return;
    }

    try {
      await api.put(`/api/classes/${id}`, { classTeacher: updatedTeacher });
      await fetchData();
      setEditingClass(null);
      toast.success("Class teacher updated successfully!");
    } catch {
      toast.error(" Failed to update class!");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading Classes...</p>
      </div>
    );

  return (
    <div className="container py-4">
      {/* ✅ Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      {/* 🏫 Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">
          <i className="bi bi-building me-2"></i>All Classes
        </h3>
        <a href="/classes/new" className="btn btn-primary rounded-pill shadow-sm">
          <i className="bi bi-plus-circle me-2"></i>Add New Class
        </a>
      </div>

      {/* 📊 Overall Summary */}
      <div
        className="card shadow border-0 rounded-4 mb-5"
        style={{
          background: "linear-gradient(135deg, #e9f0ff, #f6ecff)",
        }}
      >
        <div className="card-body py-4">
          <h5 className="fw-bold text-primary mb-4">
            <i className="bi bi-bar-chart-fill me-2"></i>Overall Student Summary
          </h5>
          <div className="row text-center">
            {[
              { label: "Total Students", value: overallTotals.totalStudents, color: "text-primary" },
              { label: "Boys", value: overallTotals.totalBoys, color: "text-info" },
              { label: "Girls", value: overallTotals.totalGirls, color: "text-danger" },
              { label: "Others", value: overallTotals.totalOther, color: "text-secondary" },
            ].map((item, index) => (
              <div key={index} className="col-md-3 mb-3">
                <div className="p-4 bg-white rounded-4 shadow-sm border border-light h-100">
                  <p className="fw-semibold mb-1 text-muted">{item.label}</p>
                  <h3 className={`fw-bold ${item.color} mb-0`}>{item.value}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🧑‍🏫 Class Cards */}
      <div className="row g-4">
        {classes.length === 0 ? (
          <p className="text-center text-muted">No classes found.</p>
        ) : (
          classes.map((cls) => (
            <div key={cls._id} className="col-md-4">
              <div
                className="card h-100 border-0 shadow-lg rounded-4"
                style={{
                  background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0 text-primary">
                      <i className="bi bi-mortarboard-fill me-2"></i>Class {cls.className}
                    </h5>
                    <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                      {classTotals[cls._id]?.totalStudents || 0} Students
                    </span>
                  </div>

                  {/* Totals */}
                  {classTotals[cls._id] && (
                    <div className="mb-3 small text-muted">
                      <span className="text-info fw-semibold">
                        {classTotals[cls._id].totalBoys || 0}
                      </span>{" "}
                      Boys •{" "}
                      <span className="text-danger fw-semibold">
                        {classTotals[cls._id].totalGirls || 0}
                      </span>{" "}
                      Girls •{" "}
                      <span className="text-secondary fw-semibold">
                        {classTotals[cls._id].totalOther || 0}
                      </span>{" "}
                      Others
                    </div>
                  )}

                  {/* Teacher Edit */}
                  {editingClass === cls._id ? (
                    <>
                      <label className="fw-semibold mb-2 text-secondary">
                        Edit Class Teacher
                      </label>
                      <select
                        className="form-select rounded-pill mb-3 shadow-sm"
                        value={updatedTeacher}
                        onChange={(e) => setUpdatedTeacher(e.target.value)}
                      >
                        <option value="">-- Select Teacher --</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-success btn-sm me-2 rounded-pill"
                          onClick={() => handleUpdate(cls._id)}
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm rounded-pill"
                          onClick={() => {
                            setEditingClass(null);
                            toast.info("Edit cancelled!");
                          }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">
                        <strong>Teacher:</strong>{" "}
                        {cls.classTeacher?.name || "N/A"}
                      </p>
                      <div className="d-flex justify-content-end mt-3">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill me-2"
                          onClick={() => handleEdit(cls)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-pill"
                          onClick={() => handleDelete(cls._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* ➕ Add New Class Card */}
        <div className="col-md-4">
          <div
            className="card d-flex align-items-center justify-content-center border-dashed rounded-4 p-5 text-center"
            style={{
              border: "2px dashed #ccc",
              cursor: "pointer",
              background: "#f9f9f9",
            }}
            onClick={() => (window.location.href = "/classes/new")}
          >
            <h5 className="text-muted mb-0">
              <i className="bi bi-plus-circle me-2"></i>Add New Class
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllClasses;
