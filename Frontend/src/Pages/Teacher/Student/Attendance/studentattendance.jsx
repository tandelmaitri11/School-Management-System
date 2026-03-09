import React, { useEffect, useState } from "react";
import api from "../../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Toast, ToastContainer } from "react-bootstrap";

export default function StudentAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "primary" });
  const teacherId = localStorage.getItem("teacherId");

  const showToast = (message, variant = "primary") => {
    setToast({ show: true, message, variant });
  };

  useEffect(() => {
    if (teacherId) fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/api/classes/by-teacher/${teacherId}`);
      setClasses(res.data);
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to fetch classes", "danger");
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/students/by-class/${classId}`);
      setStudents(res.data);
      const initialAttendance = {};
      res.data.forEach((s) => (initialAttendance[s._id] = "Present"));
      setAttendance(initialAttendance);
      showToast("✅ Students loaded successfully", "success");
    } catch (err) {
      console.error(err);
      setStudents([]);
      showToast("❌ Failed to load students", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !date) {
      showToast("⚠️ Please select a class and date", "warning");
      return;
    }

    const formattedAttendance = Object.keys(attendance).map((studentId) => ({
      studentId,
      status: attendance[studentId],
    }));

    try {
      await api.post("/api/attendance/mark", {
        classId: selectedClass,
        date,
        teacherId,
        attendance: formattedAttendance,
      });
      showToast("✅ Attendance saved successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to save attendance", "danger");
    }
  };

  return (
    <div className="container-fluid px-2 px-md-4 mt-3 mb-5">
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-3 p-md-4">
          <h3 className="text-center text-primary mb-4 fs-5 fs-md-3">
            <i className="bi bi-check2-square me-2"></i>Mark Attendance
          </h3>

          {/* 🔹 Selection Section */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Select Class</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  fetchStudents(e.target.value);
                }}
              >
                <option value="">-- Select --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    Class {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Select Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 2);
                  return d.toISOString().split("T")[0];
                })()}
              />
            </div>
          </div>

          {/* 🔹 Student Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="alert alert-warning text-center">
              No students found for selected class.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle text-nowrap">
                <thead className="table-primary text-center">
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu, index) => (
                    <tr key={stu._id}>
                      <td className="text-center">{index + 1}</td>
                      <td className="fw-medium">{stu.name}</td>
                      <td className="small">{stu.email}</td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm flex-wrap">
                          <button
                            className={`btn ${
                              attendance[stu._id] === "Present"
                                ? "btn-success"
                                : "btn-outline-success"
                            }`}
                            onClick={() =>
                              handleAttendanceChange(stu._id, "Present")
                            }
                          >
                            Present
                          </button>
                          <button
                            className={`btn ${
                              attendance[stu._id] === "Absent"
                                ? "btn-danger"
                                : "btn-outline-danger"
                            }`}
                            onClick={() =>
                              handleAttendanceChange(stu._id, "Absent")
                            }
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 🔹 Submit Button */}
          <div className="text-center mt-4">
            <button
              className="btn btn-primary px-4 px-md-5 py-2 fw-semibold"
              onClick={handleSubmit}
            >
              <i className="bi bi-save2 me-2"></i>Submit Attendance
            </button>
          </div>
        </div>
      </div>

      {/* 🔔 Toast */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white fw-semibold">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
