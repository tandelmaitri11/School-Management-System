import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Reusable Detail Item with Icon
function DetailItem({ icon, title, value }) {
  return (
    <div className="d-flex align-items-center mb-3">
      <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <p className="text-muted mb-0 small fw-bold text-uppercase" style={{ letterSpacing: "0.5px" }}>{title}</p>
        <p className="mb-0 fw-medium text-dark">{value || "N/A"}</p>
      </div>
    </div>
  );
}

// Reusable Stat Card with soft colors
function StatCard({ label, value, icon, colorClass }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card border-0 shadow-sm rounded-4 h-100 p-3 text-center transition-hover">
        <div className={`mx-auto mb-2 bg-${colorClass} bg-opacity-10 text-${colorClass} rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "50px", height: "50px" }}>
          <i className={`bi ${icon} fs-4`}></i>
        </div>
        <h3 className={`fw-bold mb-0 text-${colorClass}`}>{value ?? 0}</h3>
        <small className="text-muted fw-semibold">{label}</small>
      </div>
    </div>
  );
}

function TeacherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    presents: 0,
    absents: 0,
    leaves: 0,
    attendancePercent: 0,
  });
  const [salaryInfo, setSalaryInfo] = useState({
    status: "Pending",
    month: "",
    paidAmount: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/api/teachers/getTeacherById/${id}`);
        setTeacher(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch teacher details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (!teacher) return;

    const fetchSalary = async () => {
      try {
        const res = await api.get(`/api/teacher-salary/teacher/${teacher._id}/salary`);
        const history = res.data || [];
        const latest = history[0];
        if (latest) {
          setSalaryInfo({
            status: latest.payoutStatus || latest.status || "Pending",
            month: latest.month || "",
            paidAmount: latest.paidAmount ?? null,
          });
        } else {
          setSalaryInfo({ status: "Pending", month: "", paidAmount: null });
        }
      } catch (err) {
        setSalaryInfo({ status: "Pending", month: "", paidAmount: null });
      }
    };

    const fetchAttendance = async () => {
      try {
        const regRes = await api.get("/api/teachers/register");
        const regList = regRes.data || [];
        const regTeacher = regList.find((t) => t.teacherId === teacher.regNumber);
        if (!regTeacher?._id) {
          setAttendanceStats({ presents: 0, absents: 0, leaves: 0, attendancePercent: 0 });
          return;
        }

        const attRes = await api.get(`/api/teacher-attendance/teacher/${regTeacher._id}`);
        const records = attRes.data || [];
        let presents = 0;
        let absents = 0;

        records.forEach((r) => {
          if (r.status === "Present") presents += 1;
          if (r.status === "Absent") absents += 1;
        });

        const total = presents + absents;
        const attendancePercent = total ? Math.round((presents / total) * 100) : 0;

        setAttendanceStats({
          presents,
          absents,
          leaves: 0,
          attendancePercent,
        });
      } catch (err) {
        setAttendanceStats({ presents: 0, absents: 0, leaves: 0, attendancePercent: 0 });
      }
    };

    fetchSalary();
    fetchAttendance();
  }, [teacher]);

  const isSalaryPaid = salaryInfo.status === "Paid";
  const salaryStatusText =
    salaryInfo.status === "Paid"
      ? "Latest month's salary has been fully processed."
      : salaryInfo.status === "Processing"
      ? "Salary payout is currently processing."
      : salaryInfo.status === "Failed"
      ? "Salary payout failed. Please recheck the payout."
      : salaryInfo.status === "Rejected"
      ? "Salary was rejected and needs attention."
      : "The latest salary is currently pending or not received.";

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );
  
  if (error) return <div className="container mt-5"><div className="alert alert-danger rounded-4 shadow-sm">{error}</div></div>;
  if (!teacher) return <div className="container mt-5"><div className="alert alert-warning rounded-4 shadow-sm">No teacher data found.</div></div>;

  return (
    <div className="container py-5">
      {/* Top Action Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary border-0 fw-bold">
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <button onClick={() => navigate(`/teachers/editteacher/${teacher._id}`)} className="btn btn-primary rounded-pill px-4 shadow-sm">
          <i className="bi bi-pencil-square me-2"></i>Edit Profile
        </button>
      </div>

      <div className="row g-4">
        {/* Left Column: Profile Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="bg-primary py-5 text-center">
              <div className="position-relative d-inline-block">
                <img
                  src={teacher.picture ? `http://localhost:3000/${teacher.picture}` : "/default-avatar.png"}
                  alt="teacher"
                  className="rounded-circle border border-4 border-white shadow-sm"
                  style={{ width: "140px", height: "140px", objectFit: "cover", backgroundColor: "#fff" }}
                />
                <span className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle p-2" title="Active Account"></span>
              </div>
              <h4 className="text-white mt-3 mb-0 fw-bold">{teacher.teacherName}</h4>
              <p className="text-white text-opacity-75 mb-0">{teacher.role || "Teacher"}</p>
            </div>
            <div className="card-body p-4">
              <DetailItem icon="bi-hash" title="Registration No" value={teacher.regNumber} />
              <DetailItem icon="bi-envelope" title="Email" value={teacher.email} />
              <DetailItem icon="bi-telephone" title="Mobile" value={teacher.mobile} />
              <DetailItem icon="bi-geo-alt" title="Address" value={teacher.address} />
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Stats & Info */}
        <div className="col-lg-8">
          {/* Quick Stats */}
          <div className="row g-3 mb-4">
            <StatCard label="Presents" value={attendanceStats.presents} icon="bi-check2-circle" colorClass="success" />
            <StatCard label="Absents" value={attendanceStats.absents} icon="bi-x-circle" colorClass="danger" />
            <StatCard label="Leaves" value={attendanceStats.leaves} icon="bi-clock-history" colorClass="warning" />
            <StatCard label="Attendance" value={`${attendanceStats.attendancePercent}%`} icon="bi-graph-up-arrow" colorClass="primary" />
          </div>

          {/* More Information Sections */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">
                <i className="bi bi-info-circle me-2 text-primary"></i>Professional & Personal
              </h5>
              <div className="row">
                <div className="col-md-6">
                  <DetailItem icon="bi-currency-rupee" title="Monthly Salary" value={`₹${teacher.salary}`} />
                  <DetailItem icon="bi-calendar-check" title="Joining Date" value={teacher.joiningDate?.slice(0, 10)} />
                  <DetailItem icon="bi-briefcase" title="Experience" value={teacher.experience ? `${teacher.experience} Years` : "N/A"} />
                </div>
                <div className="col-md-6">
                  <DetailItem icon="bi-droplet" title="Blood Group" value={teacher.bloodGroup} />
                  <DetailItem icon="bi-calendar-heart" title="Date of Birth" value={teacher.dob?.slice(0, 10)} />
                  <DetailItem icon="bi-gender-ambiguous" title="Gender" value={teacher.gender} />
                </div>
              </div>
            </div>
          </div>

          {/* Salary Status Banner */}
          <div className={`card border-0 rounded-4 shadow-sm ${isSalaryPaid ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
            <div className="card-body d-flex align-items-center justify-content-between p-4">
              <div>
                <h6 className="mb-1 fw-bold text-dark">Salary Status</h6>
                <p className={`mb-0 fw-medium ${isSalaryPaid ? 'text-success' : 'text-danger'}`}>
                  {salaryStatusText}
                </p>
              </div>
              <div className={`fs-1 ${isSalaryPaid ? 'text-success' : 'text-danger'} opacity-50`}>
                <i className={`bi ${isSalaryPaid ? 'bi-patch-check-fill' : 'bi-exclamation-octagon-fill'}`}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .transition-hover:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .bg-success-subtle { background-color: #e8f5e9 !important; }
        .bg-danger-subtle { background-color: #ffebee !important; }
      `}</style>
    </div>
  );
}

export default TeacherDetails;
