import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function InfoCard({ title, value }) {
  return (
    <li className="list-group-item">
      <strong>{title}:</strong> {value || "N/A"}
    </li>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="col-md-3 mb-3">
      <div className="p-3 bg-light rounded shadow-sm">
        <h6>{label}</h6>
        <h4 className={color}>{value ?? 0}</h4>
      </div>
    </div>
  );
}

function TeacherDetails() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchTeacher = async () => {
    try {
      const res = await api.get(`/api/teachers/getTeacherById/${id}`);
      setTeacher(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch teacher details.");
    } finally {
      setLoading(false);
    }
  };
  fetchTeacher();
}, [id]);


  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!teacher) return <div className="alert alert-warning mt-4">No teacher data found.</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0 p-4">
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <img
            src={teacher.picture ? `http://localhost:3000/${teacher.picture}` : "/default-avatar.png"}
            alt="teacher"
            className="rounded-circle border"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
          <div className="ms-4">
            <h4 className="mb-1">{teacher.teacherName || "N/A"}</h4>
            <p className="text-muted mb-0">{teacher.role || "Teacher"}</p>
          </div>
        </div>

        <div className="row">
          {/* Basic Info */}
          <div className="col-md-6 mb-4">
            <h5 className="text-primary">👤 Basic Information</h5>
            <ul className="list-group list-group-flush">
              <InfoCard title="Registration No" value={teacher.regNumber} />
              <InfoCard title="Name" value={teacher.teacherName} />
              <InfoCard title="Monthly Salary" value={`₹${teacher.salary}`} />
              <InfoCard title="Date of Joining" value={teacher.joiningDate?.slice(0, 10)} />
              <InfoCard title="Experience" value={teacher.experience} />
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-6 mb-4">
            <h5 className="text-primary">📞 Contact Information</h5>
            <ul className="list-group list-group-flush">
              <InfoCard title="Mobile" value={teacher.mobile} />
              <InfoCard title="Email" value={teacher.email} />
              <InfoCard title="Address" value={teacher.address} />
              <InfoCard title="Blood Group" value={teacher.bloodGroup} />
              <InfoCard title="Date of Birth" value={teacher.dob?.slice(0, 10)} />
            </ul>
          </div>
        </div>

        {/* Attendance Report */}
        <div className="mt-5">
          <h5 className="text-primary">📅 Attendance Report</h5>
          <div className="row text-center mt-3">
            <StatCard label="Presents" value={teacher.presents} color="text-success" />
            <StatCard label="Absents" value={teacher.absents} color="text-danger" />
            <StatCard label="Leaves" value={teacher.leaves} color="text-warning" />
            <StatCard label="Overall %" value={teacher.attendancePercent} color="text-primary" />
          </div>
        </div>

        {/* Salary Report */}
        <div className="mt-5">
          <h5 className="text-primary">💰 Salary Report</h5>
          <div className="p-4 bg-light rounded shadow-sm text-center">
            <h6>Current Salary: ₹{teacher.salary}</h6>
            <p className={teacher.salaryStatus ? "text-success mt-2" : "text-danger mt-2"}>
              {teacher.salaryStatus ? "Latest Salary: Paid" : "Salary Not Received"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDetails;
