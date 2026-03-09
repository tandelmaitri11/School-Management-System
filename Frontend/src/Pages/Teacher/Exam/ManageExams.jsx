import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import { FaTrashAlt, FaEye, FaCalendarAlt, FaClock, FaSearch } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const ManageExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const teacherId = localStorage.getItem("teacherId");

  /* ================= FETCH EXAMS ================= */
  const fetchExams = async () => {
    try {
      const res = await api.get(`/api/teachers/my-exams/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming your backend returns { success: true, exams: [...] }
      const examData = res.data.exams || res.data;
      setExams(examData);
      setFilteredExams(examData);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load exams");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  /* ================= SEARCH LOGIC ================= */
  useEffect(() => {
    const results = exams.filter(exam =>
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subjectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExams(results);
  }, [searchTerm, exams]);

  /* ================= DELETE EXAM ================= */
  const handleDelete = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam? All questions will be lost.")) {
      try {
        await api.delete(`/api/teachers/delete-exam/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Exam deleted successfully");
        setExams(exams.filter((exam) => exam._id !== examId));
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting exam");
      }
    }
  };

  /* ================= STATUS BADGE ================= */
  const getStatusBadge = (startTime, duration) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(start.getTime() + Number(duration) * 60000);

    if (now < start) {
      return <span className="badge rounded-pill bg-info text-dark">Upcoming</span>;
    }

    if (now > end) {
      return <span className="badge rounded-pill bg-secondary">Completed</span>;
    }

    return <span className="badge rounded-pill bg-success pulse-animation">Live Now</span>;
  };


  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-grow text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container">
        {/* Header Section */}
        <div className="row align-items-center mb-5">
          <div className="col-md-6">
            <h2 className="fw-bold text-dark mb-1">My Exams</h2>
            <p className="text-muted">You have created {exams.length} exams so far.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <a href="/teacher/addexam" className="btn btn-primary btn-lg rounded-3 shadow-sm px-4">
              + Create New Exam
            </a>
          </div>
        </div>

        {/* Search Bar */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="input-group bg-white shadow-sm rounded-3 p-1">
              <span className="input-group-text bg-transparent border-0"><FaSearch className="text-muted" /></span>
              <input
                type="text"
                className="form-control border-0 shadow-none"
                placeholder="Search title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted mt-3">No exams found.</h4>
          </div>
        ) : (
          <div className="row">
            {filteredExams.map((exam) => (
              <div key={exam._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 exam-card">
                  <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    {getStatusBadge(exam.startTime, exam.duration)}

                    <span className="text-primary fw-bold">{exam.totalMarks} Marks</span>
                  </div>

                  <div className="card-body px-4">
                    <h5 className="card-title fw-bold text-dark mb-3">{exam.title}</h5>

                    <div className="d-flex align-items-center text-muted small mb-2">
                      <FaCalendarAlt className="me-2 text-primary" />
                      <span>{new Date(exam.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="d-flex align-items-center text-muted small mb-4">
                      <FaClock className="me-2 text-primary" />
                      <span>
                        {exam.duration} Minutes <br />
                        Ends at{" "}
                        <b>
                          {new Date(
                            new Date(exam.startTime).getTime() + exam.duration * 60000
                          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </b>
                      </span>

                    </div>

                    <div className="row g-0 bg-light rounded-3 p-2 text-center">
                      <div className="col-6 border-end">
                        <div className="small text-muted mb-0">Class</div>
                        <div className="fw-bold text-dark">{exam.classId?.className || "N/A"}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted mb-0">Subject</div>
                        <div className="fw-bold text-dark">
                          {/* DIRECT ACCESS FIX */}
                          {exam.subjectName || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer bg-white border-0 pb-4 px-4 d-flex gap-2">
                    <button
                      className="btn btn-soft-primary flex-grow-1 rounded-3 fw-medium d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: '#e7f1ff', color: '#0d6efd', border: 'none' }}
                      onClick={() => navigate(`/teacher/exam-results/${exam._id}`)}
                    >
                      <FaEye /> View Results
                    </button>
                    <button
                      className="btn btn-outline-danger rounded-3"
                      onClick={() => handleDelete(exam._id)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .exam-card { transition: all 0.3s ease; }
        .exam-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
        .pulse-animation {
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); }
          100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
        }
      `}</style>
    </div>
  );
};

export default ManageExams;